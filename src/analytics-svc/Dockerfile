FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js .
# run as unprivileged user and rely on Node's OpenSSL build
# to leverage AES-NI when available
USER node
CMD ["node","server.js"]
