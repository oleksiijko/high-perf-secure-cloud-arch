FROM node:18-alpine
WORKDIR /app

RUN mkdir -p /certs
COPY src/auth-svc/certs/server.key /certs/server.key
COPY src/auth-svc/certs/server.crt /certs/server.crt

COPY package.json package-lock.json* ./
RUN npm install --production && \
    mkdir -p /app/logs && \
    chown node:node /app/logs
ENV LOG_DIR=/app/logs

COPY . .
USER node
CMD ["node", "server.js"]
