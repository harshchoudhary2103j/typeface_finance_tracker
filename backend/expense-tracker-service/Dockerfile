# Use Node.js LTS version with Python support for OCR
FROM node:20-alpine

# Install Python + OCR dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    curl

# Symlink for python and pip
RUN ln -sf /usr/bin/python3 /usr/local/bin/python && \
    ln -sf /usr/bin/pip3 /usr/local/bin/pip

# Install Python packages (force allow)
RUN pip install --no-cache-dir --break-system-packages requests pillow pytesseract PyMuPDF

# Debug check
RUN python3 -c "import requests, pytesseract, fitz; print('✅ Python packages installed successfully')"

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p uploads/receipts uploads/statements

ENV NODE_ENV=production
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

CMD ["node", "src/server.js"]
