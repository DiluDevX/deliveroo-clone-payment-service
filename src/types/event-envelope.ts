export interface EventEnvelope<TData> {
  eventId: string;
  eventType: string;
  occurredAt: string;
  producer: string;
  data: TData;
}

export interface PaymentEventData {
  paymentId: string;
  orderId: string;
  userId: string;
  restaurantId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  providerPaymentId: string | null;
}
