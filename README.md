# lgtm-stack

Loki, Grafana, Tempo, Mimir, along with OpenTelemetry.

This is a sample/tutorial project on configuring a local LGTM stack along with OpenTelemetry and a NestJS application.

![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-FFFFFF?&style=for-the-badge&logo=opentelemetry&logoColor=black)
![Grafana](https://img.shields.io/badge/Grafana-F2F4F9?style=for-the-badge&logo=grafana&logoColor=orange&labelColor=F2F4F9)

## Overview and Diagram

Put image here...

## Setting up NestJS and send logs, traces and metrics to OpenTelemetry

After initiating the NestJS project, we need to set it up to send logs, traces and metrics to OpenTelemetry.

### Installing required packages and setting up of instrumentation.ts

First we need to install the required packages, which would include the OpenTelemetry packages and the pino logger.

```
npm install @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-logs-otlp-http @opentelemetry/exporter-prometheus @opentelemetry/exporter-trace-otlp-grpc @opentelemetry/sdk-node @opentelemetry/resources nestjs-otel nestjs-pino pino
```

Next, we would need to setup the configurations for exporting logs, traces and metrics of this NestJS application. This can be found in `instrumentation.ts`. In this file we basically set up:

- `logExporter` and `logProcessor`, which are for exporting logs using OTLP/HTTP on port 4318
- `traceExporter` and `spanProcessor`, which are for exporting traces using OTLP/HTTP on port 4318
- `metricReader`, which is for exposing prometheus compatible metrics on port 8081 of this NestJS application

There are also other configurations but for this example the three listed points above are the main ones to configure.

### Configuring the pino logger

The configuration for the pino logger can be found in the `logger` directory. After the configurations are done we just import the `LoggerModule` in `app.module.ts`.

### app.module.ts

In `app.module.ts`, you can see that we created an `OpenTelemetryModuleConfig` and enabled host-level metrics collection, which are system-level metrics provided by OpenTelemetry . After that we also add that into our `imports`.

### main.ts

So over here in `main.ts`, we just need to start the OpenTelemetry SDK using the exported `otelSDK` from `instrumentation.ts`.

### Generate a books resource and write CRUD endpoints

In this NestJS application, we can generate a books resource using:

```
nest g resource books
```

After generating the boilerplate, you can just write your CRUD endpoints as per normal using the controller and service. Remember to import the module in `app.module.ts`.

This would help us create CRUD endpoints for us to test the LGTM stack later on.

---

## Setting up configuration for OpenTelemetry

Now that the NestJS application has been configured, we need to configure OpenTelemetry. Inside the `otel-collector` directory, you will see two files (`Dockerfile` and `otel-collector-config.yaml`).

In the `Dockerfile`, we are basically using the latest `otel/opentelemetry-collector-contrib` image, copying the `otel-collector-config.yaml` file over and also loading the configurations using the copied file.

In the `otel-collector-config.yaml`, there are a lot of configurations that can be made.

### Receivers

To start off, the `receivers` are set to to receive data through `OTLP`. `OTLP` supports `HTTP` and also `gRPC`. Therefore, we configure `gRPC` to listen on all available network interfaces on port `4317` and `HTTP` to also do the same but on port `4318`.

If you remember the `logExporter` and `traceExporter` configured in `instrumentation.ts`, we configured to push logs and traces using `HTTP` (as it is through port `4318`).

Next, `prometheus` is a Prometheus configuration set, which defines a set of configurations for scraping by the OpenTelemetry Collector. It is used to consolidate metrics from the various services and export them to `Mimir`. In the below two code blocks, you can see that the metrics exposed on port `8081` of the NestJS application is used here.

```yaml
- job_name: "backend-example"
    scrape_interval: 2s
    static_configs:
      - targets: ["backend-example:8081"]
        labels:
          service: "backend-example"
```

```ts
const metricReader = new PrometheusExporter({
  port: 8081,
});
```

In addition, we also scrape metrics from the other services like Loki, Grafana, Tempo, Mimir.

### Processors

In the `processors`, it is basically to make configurations on how the recevied data is going to be processed.

### Connectors

In the `connectors`, we are configuring `spanmetrics` and `servicegraph` to transform trace data into metrics.

A connector serves as both an exporter for one pipeline and a receiver for another. This lets you:

- Convert spans (traces) into metrics within the Collector.
- Route those new metrics into your metrics pipeline for exporting.
- Keep pipelines clean, without mixing trace and metric logic manually

### Exporters

The `exporters` is another important section as it defines where the data is going to be exported to. In our case:

- Logs to Loki
- Trace to Tempo
- Metrics to Mimir

Do take note that since we are running all of them in docker containers, we should use the container names for the endpoints we are configuring.

#### Loki

For `otlphttp/loki`, we are sending our logs over to Loki using `HTTP`. Therefore, we have to use `otlphttp` prefix and the endpoint should be `http://loki:3100/otlp`.

#### Tempo

For `otlp/tempo`, we are sending our traces over to Tempo using `gRPC`. Therefore, we have to use the `otlp` prefix and the endpoint should be to our Tempo's gRPC receiver, which has the endpoint of `tempo:4317`.

#### Prometheus Remote Write

We are using the `prometheusremotewrite` exporter to send metrics over to our Mimir service through `HTTP` endpoint of `http://mimir:9009/api/v1/push`.

### Service

Finally, we defined the full service graph for the OpenTelemetry collector.

We need to declare all the `pipelines` for each of the signals received.

#### Traces

- `receivers: [otlp]` means we receive the data through the `otlp` receiver (as declared at the top of the file where we declared `otlp` endpoints for `HTTP` and `gRPC`).
- `processors: [batch]` means we are using the `batch` processor to process received trace spans
- `exporters: [otlp/tempo]` means we are exporting the data over to Tempo using the `otlp/tempo` exporter

#### Metrics

- `receivers: [otlp, prometheus]` means we receive the data through the `otlp` receiver and also `prometheus` which scrapes all the declared services
- `processors: [batch]` means we are using the `batch` processor to process received trace spans
- `exporters: [prometheusremotewrite]` means we are exporting the data over to Mimir using the `prometheusremotewrite` exporter

#### Logs

- `receivers: [otlp]` means we receive the data through the `otlp` receiver
- `processors: [batch]` means we are using the `batch` processor to process received trace spans
- `exporters: [otlphttp/loki]` means we are exporting the data over to Loki using the `otlphttp/loki` exporter

---

## Setting up Loki configuration for logs

---

## Setting up Tempo configuration for traces

---

## Setting up Mimir configuration for metrics

---

## Setting up Grafana configuration to visualize data

---

## Dockerfiles

---

## Setting up the docker-compose.yaml

---

## Testing the workflow

### Visit Grafana

You can visit `Grafana` at `http://localhost:3000`. Upon visiting the page, you would be prompted to enter the `username` and `password`. You can enter `admin1` for both the username and password because we set it that way in our `grafana.ini`.

You can make calls to these endpoints using `Postman`:

- POST to `http://localhost:5555/books/create` with body of raw/json - To create a book entry

  ```json
  {
    "title": "Harry Potter 3",
    "author": "JK Rowling"
  }
  ```

- GET to `http://localhost:5555/books/find` - To find all book entries

- GET to `http://localhost:3000/books/find/1` (where 1 refers to the `:id`) - To find a specific book entry given an id

> After running this ,you should be able to see in `Grafana` your updated logs and traces.

---

## Additional Information

### Alerting and Notification

Many components in the observability stack — such as Loki (logs), Tempo (traces), and Mimir (metrics) — support alerting by sending alerts to an `Alertmanager`. `Alertmanager` acts as a centralized alert router that:

- Receives alerts from various sources
- Deduplicates and groups alerts
- Manages silences and inhibition rules
- Forwards alerts to notification platforms like Slack, email, PagerDuty, and webhooks

By configuring Alertmanager with your Slack webhook URL, all alerts from logs, metrics, and traces can be consolidated and forwarded to your Slack channels for streamlined incident response.
