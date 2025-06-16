FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js policy.json ./
USER node
CMD ["node","server.js"]
