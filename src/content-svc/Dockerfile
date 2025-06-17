FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && \
    mkdir -p /logs && \
    chown node:node /logs
COPY server.js .
# run as unprivileged user and rely on Node's OpenSSL build
# to leverage AES-NI when available
USER node
CMD ["node","server.js"]
