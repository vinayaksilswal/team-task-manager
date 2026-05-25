FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies (required for some compiling packages if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY . /app/

# Expose port (informational — Railway overrides via $PORT)
EXPOSE 8000

# Start command — shell form so $PORT is expanded at runtime.
# Falls back to 8000 for local Docker builds without a PORT env var.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
