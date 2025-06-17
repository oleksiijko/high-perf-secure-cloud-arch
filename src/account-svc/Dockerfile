FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY cert.pem key.pem ./
RUN npm ci --omit=dev && \
    mkdir -p /app/logs && \
    chown node:node /app/logs
ENV LOG_DIR=/app/logs
COPY server.js .
# run as unprivileged user and rely on Node's OpenSSL build
# to leverage AES-NI when available
USER node
CMD ["node","server.js"]
