FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 8080                            # слушаем непривилегованный порт
USER 1000                              # UID ≠ 0, совместим с runAsNonRoot

CMD ["node", "index.js"]
