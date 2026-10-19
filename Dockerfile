FROM python:3.12-slim

# Install system dependencies & headless LibreOffice for PDF conversion
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-writer \
    fonts-dejavu \
    fonts-liberation \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Environment variables
ENV PORT=8000
ENV HOST=0.0.0.0
ENV DATA_DIR=/app/data

# Ensure data directories exist
RUN mkdir -p /app/data /app/data/uploads /app/data/generated /app/data/templates

EXPOSE 8000

CMD ["sh", "-c", "python seed.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
