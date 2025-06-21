# ---------- build stage: есть shell и pip ----------
FROM python:3.12-slim AS build
WORKDIR /app
COPY agent.py requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt \
    && mkdir -p /app/logs \
    && chown 65532:65532 /app/logs

# ---------- runtime stage: distroless, НЕТ shell ----------
FROM gcr.io/distroless/python3-debian12 AS runtime
WORKDIR /app

COPY --from=build /usr/local /usr/local
COPY --from=build /app /app


ENV LOG_DIR=/app/logs
USER nonroot
CMD ["agent.py"]
