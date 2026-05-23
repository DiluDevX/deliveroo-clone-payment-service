# Payment Service Architecture

## Purpose

The Payment Service is a microservice responsible for managing payment records, payment status transitions, commission calculations, and Stripe payment processing integration. It serves as the system of record for payment state in the Deliveroo clone ecosystem.

The service:

- Creates and manages payment records with soft-delete support
- Calculates restaurant commissions based on configurable percentages
- Integrates with Stripe for card payment processing
- Provides status tracking for payments (PENDING, PROCESSING, SUCCEEDED, FAILED, CANCELLED, REFUNDED)
- Receives Stripe webhooks and syncs final payment state back to the order service
- Supports multiple payment methods (CARD, CASH_ON_DELIVERY)
- Enforces authentication via API key middleware and actor context

## Runtime

- Runtime: Node.js >= 24
- Framework: Express 5
- Language: TypeScript
- Database: PostgreSQL via Prisma
- Payment provider dependency: Stripe
- Default local port: 4003
- Entry point: src/index.ts

## Install and Run

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Production-style local run:

```bash
npm run build
npm run start:development
```

Useful checks:

```bash
npm run types:check
npm run lint:check
npm run format:check
```

## Required Environment

```env
PORT=4003
NODE_ENV=development
SERVICE_NAME=deliveroo-clone-payment-service
DATABASE_URL=postgresql://user:password@localhost:5432/payment_service_db
API_KEY=shared-payment-service-key
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
ORDER_SERVICE_URL=http://localhost:4002
ORDER_SERVICE_API_KEY=shared-order-service-key
LOG_LEVEL=info
APP_VERSION=1.0.0
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
```

The BFF's `PAYMENT_SERVICE_API_KEY` and order service's `PAYMENT_SERVICE_API_KEY` must equal this service's `API_KEY`.
This service's `ORDER_SERVICE_API_KEY` must equal the order service's `BFF_API_KEY`.

## Database

Prisma schema: prisma/schema.prisma

Main model:

- Payment

Important fields:

- orderId
- userId
- restaurantId
- amount
- currency
- commissionPercentage
- commissionValue
- transferAmount
- paymentMethod
- status
- providerPaymentId
- providerMetadata
- refundedAt/refundReason

## Architecture & Layers

The service follows a layered architecture pattern:

```
Routes (src/routes/)
    ↓ [Validation Middleware]
Controllers (src/controllers/v1/)
    ↓ [Business Logic]
Services (src/services/)
    ↓ [Data Access Layer]
Database (Prisma + PostgreSQL)
```

**Key middleware stack applied to `/v1/payments`:**

1. `apiKeyMiddleware` - Validates `x-api-key` header
2. `actorMiddleware` - Extracts actor context (userId, restaurantId)
3. `validateBody/validateParams/validateQuery` - Zod schema validation
4. `rate-limiter` - Rate limiting by IP/API key

The Stripe webhook route is mounted before JSON body parsing and does not use API key auth. It uses Stripe signature verification instead, which requires the raw request body.

## Route Endpoints

| Method | Path                                                    | Purpose                                                 |
| ------ | ------------------------------------------------------- | ------------------------------------------------------- |
| POST   | `/v1/payments/create-intent`                            | Create payment record and Stripe PaymentIntent          |
| GET    | `/v1/payments/payment-methods`                          | List authenticated user's saved payment methods         |
| POST   | `/v1/payments/payment-methods/setup-intent`             | Create Stripe SetupIntent for saving a card             |
| POST   | `/v1/payments/payment-methods/finalize`                 | Store a saved card reference after SetupIntent succeeds |
| PATCH  | `/v1/payments/payment-methods/:paymentMethodId/default` | Set default saved payment method                        |
| DELETE | `/v1/payments/payment-methods/:paymentMethodId`         | Detach and soft-delete saved payment method             |
| GET    | `/v1/payments/order/:orderId`                           | Retrieve payment by order ID                            |
| GET    | `/v1/payments/:paymentId`                               | Retrieve payment by payment ID                          |
| POST   | `/v1/payments/:paymentId/confirm`                       | Mark payment as confirmed/completed                     |
| POST   | `/v1/payments/:paymentId/cancel`                        | Cancel and optionally refund payment                    |
| POST   | `/v1/payments/webhooks/stripe`                          | Stripe webhook receiver                                 |

## Request/Response DTOs

### Create Payment Intent

**Request:**

```json
{
  "orderId": "uuid",
  "userId": "uuid",
  "restaurantId": "uuid",
  "amount": 1299,
  "currency": "GBP",
  "paymentMethod": "CARD",
  "commissionPercentage": 15
}
```

**Response (CARD):**

```json
{
  "success": true,
  "message": "Payment intent created",
  "data": {
    "paymentId": "payment-uuid",
    "status": "PENDING",
    "clientSecret": "pi_xxx_secret_xxx"
  }
}
```

**Response (CASH_ON_DELIVERY):**

```json
{
  "success": true,
  "message": "Payment intent created",
  "data": {
    "paymentId": "payment-uuid",
    "status": "PROCESSING"
  }
}
```

### Payment Status

Valid payment statuses:

- `PaymentStatus.PENDING` - Payment created, awaiting confirmation
- `PaymentStatus.PROCESSING` - Payment processing initiated (COD only)
- `PaymentStatus.SUCCEEDED` - Payment successfully verified with Stripe (confirm handler only transitions here after verifying `stripeIntent.status === 'succeeded'`)
- `PaymentStatus.FAILED` - Payment failed
- `PaymentStatus.CANCELLED` - Payment cancelled before completion
- `PaymentStatus.REFUNDED` - Payment refunded after completion

### Payment Methods

Valid payment methods:

- `CARD` - Card payment via Stripe
- `CASH_ON_DELIVERY` - Cash payment upon delivery

### Amount Units

All amounts are stored as **integer minor units** (pennies/cents). Callers must convert decimal prices to minor units before sending to the payment service.

Example: £12.99 → `1299`

## Authentication & Authorization

**API Key Authentication:**

- All requests to `/v1/payments` require the `x-api-key` header
- The API key is validated against `environment.apiKey` using timing-safe comparison
- Requests from BFF, order service, and frontend must include the shared key

**Actor Context Middleware:**

- The `actorMiddleware` extracts user and restaurant context from headers
- For production: context should be signed/verified by the API gateway, not user-supplied
- Current implementation trusts actor data from request body (BFF responsibility)

## Stripe Integration

**Configuration:**

- Stripe secret key: `STRIPE_SECRET_KEY` (environment variable)
- Stripe webhook secret: `STRIPE_WEBHOOK_SECRET` (for verifying webhook signatures)
- Configured in [src/config/stripe.ts](src/config/stripe.ts)

**Payment Flow:**

1. Controller gets or creates a Stripe Customer for the authenticated user
2. Controller calls `stripe.paymentIntents.create()` with amount, currency, customer, and metadata
3. Stripe returns `PaymentIntent` with `client_secret`
4. Payment record stored with `providerPaymentId` (Stripe's intent ID)
5. Client-side: frontend exchanges `client_secret` for card authorization
6. Frontend calls `/confirm` endpoint after Stripe reports success
7. Confirm handler verifies intent status before updating DB
8. Stripe webhook also updates final payment state for reliable async confirmation
9. Payment service notifies order service after final status changes

**Saved Payment Methods:**

- The service uses Stripe SetupIntents to save cards for future use.
- Raw card numbers, expiry input, and CVC are never stored in this service.
- The database stores Stripe references plus safe display metadata only: provider payment method id, brand, last4, expiry, funding, country, cardholder name, and default flag.
- Deleting a saved card detaches the Stripe PaymentMethod and soft-deletes the local record.

**Metadata Stored:**

- `orderId` - Links payment to order
- `restaurantId` - Identifies receiving restaurant
- `commissionPercentage` - Commission calculation record

### Stripe Webhook Flow

The webhook endpoint handles these events:

- `payment_intent.succeeded` -> `PaymentStatus.SUCCEEDED`
- `payment_intent.payment_failed` -> `PaymentStatus.FAILED`
- `payment_intent.canceled` -> `PaymentStatus.CANCELLED`

For each supported event, the service:

1. Finds the local payment by Stripe PaymentIntent id.
2. Updates the local payment status idempotently.
3. Calls order service `POST /v1/orders/:orderId/payment-status`.
4. Returns 200 to Stripe only after the local DB and order-service sync path completes.

If the payment is already at the same status, the service still retries the order-service notification. This matters because Stripe may retry after an earlier failed response.

## Error Handling

The service uses custom error classes extending `AppError` for consistent error responses.

**Error Types:**

- `BadRequestError` (400) - Invalid request body/parameters
- `UnauthorizedError` (401) - Missing/invalid API key
- `NotFoundError` (404) - Payment/order not found
- `ConflictError` (409) - Duplicate payment for order
- `ValidationError` (400) - Zod schema validation failure
- `InternalServerError` (500) - Unexpected server errors

**Error Response Format:**

```json
{
  "success": false,
  "message": "Payment not found"
}
```

All errors are caught by the global error handler middleware which:

- Converts known errors to HTTP responses
- Logs errors with Pino logger (structured JSON in prod, pretty-printed in dev)
- Never exposes stack traces to clients
- Returns generic 500 for non-operational errors

## Commission Calculation

The service calculates restaurant commission on payment creation:

```
commission_value = (amount * commission_percentage) / 100
transfer_amount = amount - commission_value
```

**Example:**

- Order amount: £100 (10000 pence)
- Commission: 15%
- Commission value: £15 (1500 pence)
- Restaurant transfer: £85 (8500 pence)

## Service Integration Pattern

**Recommended ownership:**

1. **Order Service** - Creates order records
2. **Payment Service** - Creates and manages payment records
3. **BFF** - Orchestrates checkout: creates order → creates payment → returns client secret

**Data Flow:**

```
Frontend → BFF (checkout endpoint)
           ↓ creates order in Order Service
           ↓ asks Order Service to prepare payment
           ↓ Order Service creates payment in Payment Service
           ↓ returns PaymentIntent client_secret
           ↑
Frontend (Stripe.js handles card input with client_secret)
           ↓
       BFF (confirm endpoint)
           ↓ confirms payment in Payment Service
           ↓ Payment Service notifies Order Service
           ↑
Frontend (show success/error)

Stripe webhook
           ↓
Payment Service
           ↓
Order Service payment-status endpoint
```

Do not make the BFF or frontend send trusted totals directly into payment service. The order service should be the caller that supplies amount, restaurant, user, currency, and commission data.

## Local Testing

**Start the service:**

```bash
npm run dev
```

**Create payment intent:**

```bash
curl -X POST http://localhost:4003/v1/payments/create-intent \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: shared-payment-service-key' \
  -d '{
    "orderId":"order-123",
    "userId":"user-456",
    "restaurantId":"restaurant-789",
    "amount":1299,
    "currency":"GBP",
    "paymentMethod":"CARD",
    "commissionPercentage":15
  }'
```

**Retrieve payment:**

```bash
curl -X GET http://localhost:4003/v1/payments/order/order-123 \
  -H 'x-api-key: shared-payment-service-key'
```

**Listen for Stripe webhooks locally:**

```bash
stripe listen --forward-to localhost:4003/v1/payments/webhooks/stripe
```

Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

## Smoke Test

Direct service:

```bash
curl -X POST http://localhost:4003/v1/payments/create-intent \
  -H 'content-type: application/json' \
  -H 'x-api-key: shared-payment-service-key' \
  -d '{"orderId":"o1","userId":"u1","restaurantId":"r1","amount":1299,"currency":"GBP","paymentMethod":"CARD","commissionPercentage":15}'
```

Through BFF after path mapping is fixed:

```bash
curl -X POST http://localhost:4000/api/payments/create-intent \
  -H 'content-type: application/json' \
  -H 'x-api-key: frontend-bff-key' \
  -d '{"orderId":"o1","userId":"u1","restaurantId":"r1","amount":1299,"currency":"GBP","paymentMethod":"CARD","commissionPercentage":15}'
```

## Merge-Readiness Checklist

- [ ] Align route prefix with BFF.
- [ ] Align payment method enum with order service and frontend.
- [ ] Decide amount unit and currency.
- [ ] Configure Stripe webhook secret in every environment.
- [ ] `ORDER_SERVICE_API_KEY` matches the order service accepted API key.
- [ ] Add retry/outbox handling if order-service sync failures become common.
