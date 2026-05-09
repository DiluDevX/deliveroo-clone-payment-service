# Payment Service Architecture

## Purpose

The Payment Service is a microservice responsible for managing payment records, payment status transitions, commission calculations, and Stripe payment processing integration. It serves as the system of record for payment state in the Deliveroo clone ecosystem.

The service:

- Creates and manages payment records with soft-delete support
- Calculates restaurant commissions based on configurable percentages
- Integrates with Stripe for card payment processing
- Provides status tracking for payments (PENDING, COMPLETED, CANCELLED, REFUNDED)
- Supports multiple payment methods (CARD, CASH_ON_DELIVERY)
- Enforces authentication via API key middleware and actor context

## Runtime

- Runtime: Node.js >= 24
- Framework: Express 5
- Language: TypeScript
- Database: PostgreSQL via Prisma
- Payment provider dependency: Stripe
- Default local port in .env.example: 3001, recommended system port is 4003
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
LOG_LEVEL=info
APP_VERSION=1.0.0
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
```

The BFF's `PAYMENT_SERVICE_API_KEY` and order service's `PAYMENT_SERVICE_API_KEY` must equal this service's `API_KEY`.

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

**Key middleware stack applied to /api/v1/payments:**

1. `apiKeyMiddleware` - Validates `x-api-key` header
2. `actorMiddleware` - Extracts actor context (userId, restaurantId)
3. `validateBody/validateParams/validateQuery` - Zod schema validation
4. `rate-limiter` - Rate limiting by IP/API key

## Route MoEndpoints

| Method | Path                                  | Purpose                                        |
| ------ | ------------------------------------- | ---------------------------------------------- |
| POST   | `/api/v1/payments/create-intent`      | Create payment record and Stripe PaymentIntent |
| GET    | `/api/v1/payments/order/:orderId`     | Retrieve payment by order ID                   |
| GET    | `/api/v1/payments/:paymentId`         | Retrieve payment by payment ID                 |
| POST   | `/api/v1/payments/:paymentId/confirm` | Mark payment as confirmed/completed            |
| POST   | `/api/v1/payments/:paymentId/cancel`  | Cancel and optionally                          |

````Request/Response DTOs

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
````

**Response:**

```json
{
  "success": true,
  "message": "Payment intent created",
  "data": {
    "id": "payment-uuid",
    "orderId": "order-uuid",
    "status": "PENDING",
    "amount": 1299,
    "currency": "GBP",
    "commissionValue": 195,
    "transferAmount": 1104,
    "stripeClientSecret": "pi_xxx_secret_xxx"
  }
}
```

### Payment Status

Valid payment statuses:

- `PENDING` - Payment created, awaiting confirmation
- `COMPLETED` - Payment successfully processed
- `CANCELLED` - Payment cancelled before completion
- `REFUNDED` - Payment refunded after completion

### Payment Methods

Valid payment methods:

- `CARD` - Card payment via Stripe
- `CASH_ON_DELIVERY` - Cash payment upon delivery

### Amount Units

All amounts are stored as **integer minor units** (pennies/cents). Callers must convert decimal prices to minor units before sending to the payment service.

Example: £12.99 → `1299`
Authentication & Authorization

**API Key Authentication:**

- All requests to `/api/v1/payments` require the `x-api-key` header
- The API key is validated against `environment.apiKey` using timing-safe comparison
- Requests from BFF, order service, and frontend must include the shared key

**Actor Context Middleware:**

- The `actorMiddleware` extracts user and restaurant context from headers
- For production: context should be signed/verified by the API gateway, not user-supplied
- Current implementation trusts actor data from request body (BFF responsibility)

## Stripe Integration

**Configuration:**

- SError Handling

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
           ↓ creates payment in Payment Service
           ↓ returns PaymentIntent client_secret
           ↑
Frontend (Stripe.js handles card input with client_secret)
           ↓
       BFF (confirm endpoint)
           ↓ confirms payment
           ↓ updates order status
           ↑
Frontend (show success/error)
```

## Local Testing

**Start the service:**

```bash
npm run dev
```

**Create payment intent:**

```bash
curl -X POST http://localhost:4003/api/v1/payments/create-intent \
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
curl -X GET http://localhost:4003/api/v1/payments/order/order-123 \
  -H 'x-api-key: shared-payment-service-key'
```

- Payment service owns payment creation.
- BFF orchestrates the checkout saga or exposes a single checkout endpoint that calls both.

For a small project, a BFF-orchestrated checkout is easier to reason about than service-to-service payment creation plus frontend payment creation.

## Smoke Test

Direct service:

```bash
curl -X POST http://localhost:4003/api/v1/payments/create-intent \
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
- [ ] Implement Stripe PaymentIntent creation before calling this real payment.
- [ ] Confirm endpoint verifies provider state rather than blindly succeeding.
