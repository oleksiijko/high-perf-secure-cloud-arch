FROM node:18-bullseye-slim AS base
WORKDIR /app
ENV NODE_ENV=production \
    TZ=UTC \
    NODE_OPTIONS="--max_old_space_size=256"
COPY agent.py requirements.txt ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev && npm cache clean --force


FROM gcr.io/distroless/nodejs18 AS runtime
WORKDIR /app
COPY --from=base /app /app
RUN pip install --no-cache-dir -r requirements.txt && \
    mkdir -p /app/logs && \
    chown nobody:nogroup /app/logs
ENV LOG_DIR=/app/logs 
COPY server.js .
USER nonroot
ENTRYPOINT ["python", "agent.py"]
