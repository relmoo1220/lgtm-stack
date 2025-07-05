import otelSDK from './opentelemetry/instrumentation';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  // OpenTelemetry SDK (otelSDK) needs to start as early as possible in your application lifecycle.
  // This ensures that all telemetry data (traces, metrics) are captured from the very beginning of your app startup.
  otelSDK.start();
  console.log('Started OTEL SDK');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // When bufferLogs set to true, all logs will be buffered until a custom logger is attached
  });
  app.useLogger(app.get(Logger)); // Use the Pino logger instead of default logger for better structured logs

  app.enableShutdownHooks(); // Listen for shutdown signals (SIGINT, SIGTERM, etc.)
  app.enableCors({ origin: '*' });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
