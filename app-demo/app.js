const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const express = require('express');
const winston = require('winston');

// Cấu hình Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: 'http://alloy:4318/v1/traces' }),
  metricExporter: new OTLPMetricExporter({ url: 'http://alloy:4318/v1/metrics' }),
  instrumentations: [getNodeAutoInstrumentations()]
});
sdk.start();

const app = express();

// 1. Endpoint thành công
app.get('/', (req, res) => {
  logger.info('User truy cập trang chủ');
  res.send('Hệ thống hoạt động bình thường!');
});

// 2. Endpoint GÂY LỖI (Để test Loki Error Logs)
app.get('/error', (req, res) => {
  const errorMsg = 'Lỗi nghiêm trọng: Không thể kết nối cơ sở dữ liệu giả lập!';
  logger.error(errorMsg, { 
    path: '/error', 
    error_code: 500,
    trace_id: req.headers['traceparent'] // Gắn ID để dễ tìm
  });
  res.status(500).send(errorMsg);
});

// 3. Endpoint CHẬM (Để test Tempo Traces)
app.get('/slow', async (req, res) => {
  logger.warn('Cảnh báo: Request này sẽ mất nhiều thời gian...');
  await new Promise(resolve => setTimeout(resolve, 3000)); // Delay 3 giây
  res.send('Xin lỗi vì đã để bạn đợi lâu!');
});

app.listen(8080, () => {
  console.log('App demo đang chạy tại cổng 8080...');
});