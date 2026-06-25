import { randomUUID } from 'node:crypto';
import { environment } from '../config/environment';
import { logger } from '../utils/logger';
import { EventEnvelope } from '../types/event-envelope';
import { createRabbitMqConnection } from './rabbitmq.client';

export async function publishEvent<TData>(eventType: string, data: TData): Promise<void> {
  const connection = await createRabbitMqConnection();

  if (!connection) {
    logger.warn({ eventType }, 'RabbitMQ URL is not configured. Event was not published');
    return;
  }

  const channel = await connection.createChannel();

  try {
    await channel.assertExchange(environment.rabbitMQ.exchange, 'topic', {
      durable: true,
    });

    const envelope: EventEnvelope<TData> = {
      eventId: randomUUID(),
      eventType,
      occurredAt: new Date().toISOString(),
      producer: environment.serviceName,
      data,
    };

    const published = channel.publish(
      environment.rabbitMQ.exchange,
      eventType,
      Buffer.from(JSON.stringify(envelope)),
      {
        persistent: true,
        contentType: 'application/json',
        messageId: envelope.eventId,
        timestamp: Date.now(),
      }
    );

    if (!published) {
      logger.warn({ eventId: envelope.eventId, eventType }, 'RabbitMQ publish buffer is full');
    }

    logger.info({ eventId: envelope.eventId, eventType }, 'Event published');
  } finally {
    await channel.close();
    await connection.close();
  }
}
