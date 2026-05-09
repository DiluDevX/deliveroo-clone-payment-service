import Stripe from 'stripe';
import { environment } from './environment';

export const stripe = new Stripe(environment.stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',
});
