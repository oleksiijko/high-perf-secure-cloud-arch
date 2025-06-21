# src/monolith-svc/Dockerfile
FROM node:20-slim

WORKDIR /app

# Устанавливаем прод-зависимости
COPY package*.json package-lock.json ./
RUN npm ci --omit=dev

# Копируем исходники службы
COPY . .

# Служба слушает непривилегированный порт 8080
EXPOSE 8080

# Запускаемся от непривилегированного пользователя node
USER node

CMD ["node", "index.js"]
