import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import * as process from 'process';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import {
  CompositePropagator,
  W3CTraceContextPropagator,
  W3CBaggagePropagator,
} from '@opentelemetry/core';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

// Export logs using OTLP protocol over HTTP on port 4318
// This is because on otel-collector-config.yaml the http receiver for OTel is on port 4318
const logExporter = new OTLPLogExporter({
  url: `http://${process.env.OTEL_SERVICE_NAME}:4318/v1/logs`,
});
const logProcessor = new BatchLogRecordProcessor(logExporter);

// Export trace using OTLP protocol over HTTP on port 4318
// This is because on otel-collector-config.yaml the http receiver for OTel is on port 4318
const traceExporter = new OTLPTraceExporter({
  url: `http://${process.env.OTEL_SERVICE_NAME}:4318/v1/traces`,
});
const spanProcessor = new BatchSpanProcessor(traceExporter);

// Export prometheus compatible metrics on port 8081 over to Mimir
const metricReader = new PrometheusExporter({
  port: 8081,
});

const otelSDK = new NodeSDK({
  metricReader, // Send metrics via OTel
  spanProcessors: [spanProcessor], // Send traces via OTel
  logRecordProcessors: [logProcessor], // Send logs via OTel
  contextManager: new AsyncLocalStorageContextManager(),
  // By targeting @opentelemetry/instrumentation-pino, you're enabling both:
  // Log correlation: every Pino log gets trace_id, span_id, and trace_flags added so you can link logs to active spans
  // Log sending: Pino logs are forwarded to your OpenTelemetry LoggerProvider and ultimately your OTLP log exporter
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-pino': {
        enabled: true,
        // Add each log record with service.name attribute
        logHook: (_span, logRecord) => {
          logRecord[ATTR_SERVICE_NAME] =
            process.env.OTEL_SERVICE_NAME || 'unknown-service';
        },
      },
    }),
  ],
  // A TextMapPropagator is responsible for injecting and extracting context (trace IDs, baggage) into/out of carriers like HTTP headers.
  // CompositePropagator: You can combine multiple propagators (e.g., W3C TraceContext, Baggage, B3) so your app speaks multiple header formats.
  textMapPropagator: new CompositePropagator({
    propagators: [
      new W3CTraceContextPropagator(),
      new W3CBaggagePropagator(),
      new B3Propagator(),
    ],
  }),
});

export default otelSDK;

// You can also use the shutdown method to gracefully shut down the SDK before process shutdown
// or on some operating system signal.
process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(
      () => console.log('SDK shut down successfully'),
      (err) => console.log('Error shutting down SDK', err),
    )
    .finally(() => process.exit(0));
});
