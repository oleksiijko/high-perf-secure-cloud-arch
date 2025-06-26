FROM node:18-bullseye-slim AS build
WORKDIR /app

ENV NODE_ENV=production TZ=UTC NODE_OPTIONS="--max_old_space_size=256"

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev && npm cache clean --force

COPY . .

RUN mkdir -p /app/logs && chown 65532:65532 /app/logs
ENV LOG_DIR=/app/logs

FROM gcr.io/distroless/nodejs18 AS runtime
WORKDIR /app

COPY --from=build /app /app
ENV LOG_DIR=/app/logs
USER nonroot                           

CMD ["server.js"]
