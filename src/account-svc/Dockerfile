###############################################################################
# build stage (есть shell + npm)
###############################################################################
FROM node:18-bullseye-slim AS build
WORKDIR /app

# базовые переменные
ENV NODE_ENV=production TZ=UTC NODE_OPTIONS="--max_old_space_size=256"

# зависимости
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev && npm cache clean --force

# исходники
COPY server.js policy.json ./

# директория для логов, права на uid 65532 (distroless nonroot)
RUN mkdir -p /app/logs && chown 65532:65532 /app/logs
ENV LOG_DIR=/app/logs

###############################################################################
# runtime stage (distroless, нет /bin/sh)
###############################################################################
FROM gcr.io/distroless/nodejs18 AS runtime
WORKDIR /app

COPY --from=build /app /app
ENV LOG_DIR=/app/logs
USER nonroot                           

CMD ["server.js"]
