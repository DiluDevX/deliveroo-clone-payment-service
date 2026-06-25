import amqp, { type ChannelModel } from 'amqplib';
import { environment } from '../config/environment';

export async function createRabbitMqConnection(): Promise<ChannelModel | null> {
  if (!environment.rabbitMQ.url) {
    return null;
  }

  return amqp.connect(environment.rabbitMQ.url);
}
