import Stripe from 'stripe';
import { environment } from './environment';

/**
 * Stripe client singleton.
 * Typed and ready for implementation — actual API calls are stubbed in the controllers.
 */
export const stripe = new Stripe(environment.stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',
});
