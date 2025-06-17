FROM node:18-alpine
WORKDIR /app

RUN mkdir -p /certs
COPY server.key server.crt /certs/

COPY package.json package-lock.json* ./
RUN npm install --production && \
    mkdir -p /app/logs && \
    chown node:node /app/logs
ENV LOG_DIR=/app/logs

COPY . .
USER node
CMD ["node", "server.js"]
