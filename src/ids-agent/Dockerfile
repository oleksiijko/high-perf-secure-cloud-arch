# ---------- build stage ----------
FROM python:3.12-slim AS build
WORKDIR /app

# зависимости
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# исходники
COPY agent.py .
RUN mkdir -p /app/logs && chown 65532:65532 /app/logs

# ---------- runtime stage ----------
FROM gcr.io/distroless/python3-debian12 AS runtime
WORKDIR /app

# перенести только то, что нужно
COPY --from=build /install /usr/local
COPY --from=build /app /app

# гарантируем, что site-packages в поисковом пути
ENV PYTHONPATH=/usr/local/lib/python3.12/site-packages
ENV LOG_DIR=/app/logs
USER nonroot
CMD ["agent.py"]
