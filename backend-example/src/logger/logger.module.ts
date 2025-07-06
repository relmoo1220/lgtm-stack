import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { logger } from './logger';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    // Set up nestjs-pino to use our custom logger instance.
    // This ensures consistent structured logging across NestJS lifecycle hooks and routes.
    PinoLoggerModule.forRoot({
      pinoHttp: {
        logger: logger, // Inject our custom Pino instance
      },
      // Optional: exclude certain paths like /health from logging
      // exclude: [{ method: RequestMethod.ALL, path: 'health' }],
    }),
  ],
  controllers: [],
  providers: [],
})
export class LoggerModule {}
