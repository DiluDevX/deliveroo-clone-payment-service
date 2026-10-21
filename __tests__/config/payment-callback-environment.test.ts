import { afterEach, describe, expect, it, vi } from 'vitest';

const loadEnvironment = async (secret: string | undefined) => {
  vi.resetModules();
  vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost/test');
  vi.stubEnv('API_KEY', 'test-api-key');
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test');
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test');
  vi.stubEnv('ORDER_SERVICE_API_KEY', 'test-order-key');
  vi.stubEnv('SERVICE_NAME', 'payment-service');
  vi.stubEnv('PAYMENT_CALLBACK_SECRET', secret);
  return import('../../src/config/environment');
};

afterEach(() => vi.unstubAllEnvs());

describe('payment callback secret configuration', () => {
  it.each([undefined, '', 'short-secret'])(
    'fails startup for missing or short secret %s',
    async (secret) => {
      await expect(loadEnvironment(secret)).rejects.toThrow('PAYMENT_CALLBACK_SECRET');
    }
  );

  it('loads an independent callback secret', async () => {
    const secret = 'test-callback-secret-with-at-least-32-bytes';
    const { environment } = await loadEnvironment(secret);
    expect(environment.paymentCallbackSecret).toBe(secret);
    expect(environment.paymentCallbackSecret).not.toBe(environment.orderServiceApiKey);
  });
});
