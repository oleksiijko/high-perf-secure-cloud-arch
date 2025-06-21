FROM node:18-bullseye-slim AS base
WORKDIR /app
ENV NODE_ENV=production \
    TZ=UTC \
    NODE_OPTIONS="--max_old_space_size=256"
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev && npm cache clean --force


FROM gcr.io/distroless/nodejs18 AS runtime
WORKDIR /app
COPY --from=base /app /app
RUN npm ci --omit=dev && \
    mkdir -p /app/logs && \
    chown node:node /app/logs
ENV LOG_DIR=/app/logs 
COPY server.js .
USER nonroot
ENTRYPOINT ["node","server.js"]
