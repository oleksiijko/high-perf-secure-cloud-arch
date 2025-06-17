FROM node:18-alpine
WORKDIR /app

RUN mkdir -p /certs
COPY certs/server.key  /certs/server.key
COPY certs/server.crt  /certs/server.crt

COPY cert.pem key.pem ./

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && \
    mkdir -p /app/logs && \
    chown node:node /app/logs
ENV LOG_DIR=/app/logs

COPY server.js policy.json ./
USER node
CMD ["node","server.js"]
