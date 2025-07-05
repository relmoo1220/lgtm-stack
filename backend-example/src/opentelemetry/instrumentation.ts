import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { LoggerProviderConfig, NodeSDK } from '@opentelemetry/sdk-node';
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
// This is because on otel-collector-config.yaml the http receiver is on port 4318
const logExporter = new OTLPLogExporter({
  url: `http://${process.env.OTEL_SERVICE_NAME}:4318/v1/logs`,
});
const loggerProvider = new LoggerProvider({
  processors: [new BatchLogRecordProcessor(logExporter)],
});

// Export trace using OTLP protocol over HTTP on port 4318
// This is because on otel-collector-config.yaml the http receiver is on port 4318
const traceExporter = new OTLPTraceExporter({
  url: `http://${process.env.OTEL_SERVICE_NAME}:4318/v1/traces`,
});
const spanProcessor = new BatchSpanProcessor(traceExporter);

// Export prometheus compatible metrics on port 4319
const metricReader = new PrometheusExporter({
  port: 8081,
});

const otelSDK = new NodeSDK({
  metricReader,
  spanProcessor: spanProcessor,
  contextManager: new AsyncLocalStorageContextManager(),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-pino': {
        enabled: true,
        logHook: (_span, logRecord) => {
          logRecord[ATTR_SERVICE_NAME] =
            process.env.OTEL_SERVICE_NAME || 'unknown-service';
        },
      },
    }),
  ],
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
