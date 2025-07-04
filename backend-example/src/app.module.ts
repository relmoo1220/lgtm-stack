import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenTelemetryModule } from 'nestjs-otel';
import { LoggerModule } from './logger/logger.module';
import { BooksModule } from './api/books/books.module';

// This enables host-level metrics collection. These are system-level metrics provided by OpenTelemetry like:
// CPU usage
// Memory usage
// Uptime
// Number of open file descriptors
// Disk space
// Network traffic
const OpenTelemetryModuleConfig = OpenTelemetryModule.forRoot({
  metrics: {
    hostMetrics: true,
  },
});

@Module({
  imports: [OpenTelemetryModuleConfig, LoggerModule, BooksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
