FROM node:20-slim
WORKDIR /app
COPY package*.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 80
USER node
CMD ["node","index.js"]
