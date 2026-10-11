FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir \
    "mcp>=1.8.0,<2.0.0" \
    uvicorn \
    starlette \
    requests \
    google-auth

COPY mcp_server.py /app/mcp_server.py

EXPOSE 8080

ENTRYPOINT ["python3", "/app/mcp_server.py"]
