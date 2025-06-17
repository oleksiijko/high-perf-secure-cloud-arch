FROM python:3.9-slim
WORKDIR /app
COPY agent.py requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && \
    mkdir -p /app/logs && \
    chown nobody:nogroup /app/logs
ENV LOG_DIR=/app/logs
USER nobody
CMD ["python", "agent.py"]
