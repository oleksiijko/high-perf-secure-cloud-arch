FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm ci --omit=dev
COPY server.js policies.json ./
# Node uses OpenSSL with AES-NI when available
USER node
CMD ["node","server.js"]
