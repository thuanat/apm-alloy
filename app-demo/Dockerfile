# Sử dụng bản node nhẹ để tiết kiệm dung lượng
FROM node:18-slim

# Tạo thư mục làm việc trong container
WORKDIR /app

# Copy các file quản lý thư viện vào trước
COPY package*.json ./

# Cài đặt thư viện
RUN npm install

# Copy toàn bộ mã nguồn còn lại
COPY . .

# App chạy cổng 8080
EXPOSE 8080

# Lệnh khởi chạy app
CMD ["node", "app.js"]