const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { WinstonInstrumentation } = require('@opentelemetry/instrumentation-winston');

const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');

const { LoggerProvider, SimpleLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { logs } = require('@opentelemetry/api-logs');

const express = require('express');
const winston = require('winston');

/* =======================
 * 1. OpenTelemetry LOGS
 * ======================= */
const logExporter = new OTLPLogExporter({
  url: 'http://alloy:4318/v1/logs',
});

const loggerProvider = new LoggerProvider();
loggerProvider.addLogRecordProcessor(
  new SimpleLogRecordProcessor(logExporter)
);

logs.setGlobalLoggerProvider(loggerProvider);

/* =======================
 * 2. Winston Logger
 * (KHÔNG gắn OTel transport)
 * ======================= */
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(), // stdout → OTel hook
  ],
});

/* =======================
 * 3. Traces & Metrics SDK
 * + Winston Instrumentation
 * ======================= */
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://alloy:4318/v1/traces',
  }),
  metricExporter: new OTLPMetricExporter({
    url: 'http://alloy:4318/v1/metrics',
  }),
  instrumentations: [
    getNodeAutoInstrumentations(),
    new WinstonInstrumentation(), // ✅ QUAN TRỌNG
  ],
});

sdk.start();

/* =======================
 * 4. Express App
 * ======================= */
const app = express();

app.get('/', (req, res) => {
  logger.info('User truy cập trang chủ');
  res.send('Hệ thống hoạt động bình thường!');
});

app.get('/error', (req, res) => {
  const errorMsg = 'Lỗi nghiêm trọng: Không thể kết nối cơ sở dữ liệu!';
  logger.error(errorMsg, { path: '/error', error_code: 500 });
  res.status(500).send(errorMsg);
});

app.get('/slow', async (req, res) => {
  logger.warn('Cảnh báo: Request chậm...');
  await new Promise((r) => setTimeout(r, 3000));
  res.send('Xin lỗi vì đã để bạn đợi lâu!');
});

app.listen(8080, () => {
  console.log('App demo đang chạy tại cổng 8080...');
});
