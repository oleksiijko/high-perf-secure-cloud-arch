FROM python:3.9-slim
WORKDIR /app
COPY agent.py requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
CMD ["python", "agent.py"]
