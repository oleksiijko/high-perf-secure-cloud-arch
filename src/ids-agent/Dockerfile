FROM python:3.12-slim AS build
WORKDIR /app

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

COPY agent.py .
RUN mkdir -p /app/logs && chown 65532:65532 /app/logs

FROM gcr.io/distroless/python3-debian12 AS runtime
WORKDIR /app

COPY --from=build /install /usr/local
COPY --from=build /app /app

ENV PYTHONPATH=/usr/local/lib/python3.12/site-packages
ENV PYTHONMALLOC=malloc
ENV LOG_DIR=/app/logs
USER nonroot
CMD ["agent.py"]
