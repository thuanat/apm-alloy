const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');

// --- THÊM PHẦN LOGS ---
const { LoggerProvider, SimpleLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { WinstonTransport } = require('@opentelemetry/winston-transport');

const express = require('express');
const winston = require('winston');

// 1. Cấu hình OTLP Log Exporter để đẩy về Alloy
const logExporter = new OTLPLogExporter({ 
  url: 'http://alloy:4318/v1/logs' 
});
const loggerProvider = new LoggerProvider();
loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(logExporter));

// 2. Cấu hình Winston dùng WinstonTransport của OpenTelemetry
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new WinstonTransport({ loggerProvider }) // CẦU NỐI: Đẩy log từ winston sang OTLP
  ]
});

// 3. Khởi tạo SDK (Traces & Metrics)
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: 'http://alloy:4318/v1/traces' }),
  metricExporter: new OTLPMetricExporter({ url: 'http://alloy:4318/v1/metrics' }),
  instrumentations: [getNodeAutoInstrumentations()]
});
sdk.start();

const app = express();

// --- CÁC ENDPOINT ---

app.get('/', (req, res) => {
  logger.info('User truy cập trang chủ'); // Log này giờ sẽ tự có trace_id
  res.send('Hệ thống hoạt động bình thường!');
});

app.get('/error', (req, res) => {
  const errorMsg = 'Lỗi nghiêm trọng: Không thể kết nối cơ sở dữ liệu giả lập!';
  // Bạn KHÔNG CẦN tự gắn trace_id nữa, OTel Transport sẽ tự làm việc đó
  logger.error(errorMsg, { 
    path: '/error', 
    error_code: 500
  });
  res.status(500).send(errorMsg);
});

app.get('/slow', async (req, res) => {
  logger.warn('Cảnh báo: Request này sẽ mất nhiều thời gian...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  res.send('Xin lỗi vì đã để bạn đợi lâu!');
});

app.listen(8080, () => {
  console.log('App demo đang chạy tại cổng 8080...');
});