import { createHash } from 'node:crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const config = vi.hoisted(() => ({
  orderServiceUrl: 'http://order-service',
  orderServiceApiKey: 'order-api-key',
  paymentCallbackSecret: 'test-callback-secret-with-at-least-32-bytes',
}));
vi.mock('../../src/config/environment', () => ({ environment: config }));
vi.mock('../../src/utils/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));

import { notifyOrderPaymentStatus } from '../../src/services/order.service';

describe('signed payment callbacks', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-21T10:00:00Z'));
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ success: true, message: 'synced' }))
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each(['SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PROCESSING'] as const)(
    'binds %s callbacks to the order, action and exact transmitted body',
    async (status) => {
      await notifyOrderPaymentStatus('order-1', 'payment-1', status);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('http://order-service/v1/orders/order-1/payment-status');
      expect(options?.method).toBe('POST');
      expect(options?.body).toBe(JSON.stringify({ paymentId: 'payment-1', paymentStatus: status }));
      const headers = new Headers(options?.headers);
      expect(headers.get('x-api-key')).toBe('order-api-key');
      expect(headers.get('x-actor-type')).toBe('SYSTEM');
      const token = headers.get('x-payment-callback-token');
      expect(token).toBeTruthy();
      const claims = jwt.verify(token!, config.paymentCallbackSecret, {
        algorithms: ['HS256'],
        issuer: 'payment-service',
        audience: 'order-service',
        subject: 'order-1',
      }) as JwtPayload;
      expect(claims.action).toBe('payment-status');
      expect(claims.payloadSha256).toBe(
        createHash('sha256').update(String(options?.body), 'utf8').digest('hex')
      );
      expect(claims.exp! - claims.iat!).toBe(60);
      expect(() => jwt.verify(token!, 'wrong-secret', { algorithms: ['HS256'] })).toThrow();
      vi.advanceTimersByTime(60_000);
      expect(() => jwt.verify(token!, config.paymentCallbackSecret)).toThrow('jwt expired');
    }
  );

  it('creates a fresh token for each retry', async () => {
    await notifyOrderPaymentStatus('order-1', 'payment-1', 'SUCCEEDED');
    vi.advanceTimersByTime(1000);
    await notifyOrderPaymentStatus('order-1', 'payment-1', 'SUCCEEDED');
    const tokens = fetchMock.mock.calls.map(([, options]) =>
      new Headers(options?.headers).get('x-payment-callback-token')
    );
    expect(tokens[0]).not.toBe(tokens[1]);
  });

  it('encodes the order ID as one URL path segment', async () => {
    await notifyOrderPaymentStatus('order/1?x=y', 'payment-1', 'FAILED');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://order-service/v1/orders/order%2F1%3Fx%3Dy/payment-status'
    );
  });

  it('propagates callback rejection so the caller can retry', async () => {
    fetchMock.mockResolvedValue(new Response('Unauthorized', { status: 401 }));
    await expect(notifyOrderPaymentStatus('order-1', 'payment-1', 'SUCCEEDED')).rejects.toThrow(
      'Failed to sync order payment status'
    );
  });
});
