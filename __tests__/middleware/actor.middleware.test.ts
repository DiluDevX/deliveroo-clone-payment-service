import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const boundaries = vi.hoisted(() => ({
  createPayment: vi.fn(),
  updatePaymentStatus: vi.fn(),
  findPaymentById: vi.fn(),
  findPaymentByOrderId: vi.fn(),
  refundPayment: vi.fn(),
  getOrCreatePaymentCustomer: vi.fn(),
  listUserPaymentMethods: vi.fn(),
  setDefaultUserPaymentMethod: vi.fn(),
  deleteUserPaymentMethod: vi.fn(),
  saveStripePaymentMethod: vi.fn(),
  notifyOrderPaymentStatus: vi.fn(),
  publishEvent: vi.fn(),
  paymentIntentCreate: vi.fn(),
  paymentIntentRetrieve: vi.fn(),
  refundCreate: vi.fn(),
  setupIntentCreate: vi.fn(),
  setupIntentRetrieve: vi.fn(),
  webhookConstructEvent: vi.fn(),
  checkDatabaseConnection: vi.fn(),
}));

vi.mock('../../src/config/environment', () => ({
  environment: {
    apiKey: 'test-api-key',
    env: 'test',
    serviceName: 'payment-service',
    logging: { level: 'silent' },
    version: '1.0.0',
    stripeWebhookSecret: 'whsec_test',
    rateLimit: { windowMs: 60_000, max: 10_000 },
  },
}));
vi.mock('../../src/config/database', () => ({
  checkDatabaseConnection: boundaries.checkDatabaseConnection,
}));
vi.mock('../../src/services/payment.database.service', () => ({
  createPayment: boundaries.createPayment,
  updatePaymentStatus: boundaries.updatePaymentStatus,
  findPaymentById: boundaries.findPaymentById,
  findPaymentByOrderId: boundaries.findPaymentByOrderId,
  refundPayment: boundaries.refundPayment,
}));
vi.mock('../../src/services/payment-method.database.service', () => ({
  getOrCreatePaymentCustomer: boundaries.getOrCreatePaymentCustomer,
  listUserPaymentMethods: boundaries.listUserPaymentMethods,
  setDefaultUserPaymentMethod: boundaries.setDefaultUserPaymentMethod,
  deleteUserPaymentMethod: boundaries.deleteUserPaymentMethod,
  saveStripePaymentMethod: boundaries.saveStripePaymentMethod,
}));
vi.mock('../../src/services/order.service', () => ({
  notifyOrderPaymentStatus: boundaries.notifyOrderPaymentStatus,
}));
vi.mock('../../src/messaging/event-publisher', () => ({ publishEvent: boundaries.publishEvent }));
vi.mock('../../src/config/stripe', () => ({
  stripe: {
    paymentIntents: {
      create: boundaries.paymentIntentCreate,
      retrieve: boundaries.paymentIntentRetrieve,
    },
    refunds: { create: boundaries.refundCreate },
    setupIntents: {
      create: boundaries.setupIntentCreate,
      retrieve: boundaries.setupIntentRetrieve,
    },
    webhooks: { constructEvent: boundaries.webhookConstructEvent },
  },
}));

import routes from '../../src/routes';
import { actorMiddleware } from '../../src/middleware/actor.middleware';
import { errorHandler } from '../../src/middleware/error-handler.middleware';

const app = express();
app.use(express.json());
app.get('/actor', actorMiddleware, (req, res) => res.json(req.actor));
app.use(routes);
app.use(errorHandler);

const paymentBody = {
  orderId: 'order-1',
  userId: 'user-1',
  restaurantId: 'restaurant-1',
  amount: 1000,
  paymentMethod: 'CASH_ON_DELIVERY',
  commissionPercentage: 10,
};

const mutationCases = [
  { method: 'post', path: '/v1/payments/create-intent', body: paymentBody },
  { method: 'post', path: '/v1/payments/payment-1/confirm' },
  { method: 'post', path: '/v1/payments/payment-1/cancel', body: {} },
  { method: 'post', path: '/v1/payments/payment-methods/setup-intent' },
  {
    method: 'post',
    path: '/v1/payments/payment-methods/finalize',
    body: { setupIntentId: 'seti_1' },
  },
  { method: 'patch', path: '/v1/payments/payment-methods/pm-1/default' },
  { method: 'delete', path: '/v1/payments/payment-methods/pm-1' },
] as const;

describe('payment actor boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  for (const mutation of mutationCases) {
    it.each([
      { name: 'missing', header: undefined },
      { name: 'empty', header: '' },
      { name: 'unknown', header: 'ADMIN' },
      { name: 'lowercase', header: 'user' },
      { name: 'array', header: ['USER', 'SYSTEM'] },
      { name: 'duplicate', header: ['USER', 'USER'] },
    ])(
      `${mutation.method.toUpperCase()} ${mutation.path} rejects $name actor`,
      async ({ header }) => {
        let pending = request(app)[mutation.method](mutation.path).set('x-api-key', 'test-api-key');
        if (Array.isArray(header)) {
          pending = Reflect.apply(pending.set, pending, ['x-actor-type', header]);
        } else if (header !== undefined) {
          pending = pending.set('x-actor-type', header);
        }
        if ('body' in mutation) {
          pending = pending.send(mutation.body);
        }

        const response = await pending;
        expect(response.status).toBe(401);
        expect(response.body.code).toBe('UNAUTHORIZED');
        for (const effect of Object.values(boundaries)) {
          expect(effect).not.toHaveBeenCalled();
        }
      }
    );
  }

  it('checks the API key before actor context', async () => {
    const response = await request(app).post('/v1/payments/create-intent').send(paymentBody);
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('API key is required');
  });

  it('allows an explicit SYSTEM caller to create a payment intent', async () => {
    boundaries.createPayment.mockResolvedValue({ id: 'payment-1' });
    boundaries.updatePaymentStatus.mockResolvedValue({ id: 'payment-1', status: 'PROCESSING' });

    const response = await request(app)
      .post('/v1/payments/create-intent')
      .set('x-api-key', 'test-api-key')
      .set('x-actor-type', 'SYSTEM')
      .set('x-user-id', 'user-1')
      .send(paymentBody);

    expect(response.status).toBe(201);
    expect(boundaries.createPayment).toHaveBeenCalledOnce();
    expect(boundaries.updatePaymentStatus).toHaveBeenCalledWith('payment-1', 'PROCESSING');
  });

  it('allows an explicit USER caller to list saved payment methods', async () => {
    boundaries.listUserPaymentMethods.mockResolvedValue([]);
    const response = await request(app)
      .get('/v1/payments/payment-methods')
      .set('x-api-key', 'test-api-key')
      .set('x-actor-type', 'USER')
      .set('x-user-id', 'user-1');

    expect(response.status).toBe(200);
    expect(boundaries.listUserPaymentMethods).toHaveBeenCalledWith('user-1');
  });

  it.each(['USER', 'RESTAURANT', 'DRIVER', 'SYSTEM'])(
    'preserves the explicitly supplied %s actor type',
    async (actorType) => {
      const response = await request(app).get('/actor').set('x-actor-type', actorType);
      expect(response.status).toBe(200);
      expect(response.body.type).toBe(actorType);
    }
  );

  it('rejects an array in the parsed actor header', () => {
    const next = vi.fn();
    const req = {
      headers: { 'x-actor-type': ['USER'] },
      rawHeaders: ['x-actor-type', 'USER'],
    };

    Reflect.apply(actorMiddleware, undefined, [req, {}, next]);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNAUTHORIZED' }));
    expect(req).not.toHaveProperty('actor');
  });

  it('keeps the health route public', async () => {
    const response = await request(app).get('/health/live');
    expect(response.status).toBe(200);
  });
});
