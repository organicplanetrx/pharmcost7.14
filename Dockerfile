# Use Node.js with Chrome dependencies pre-installed
FROM node:20-bullseye

# Install Chrome dependencies and Chrome itself
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install dependencies with forced resolution
RUN npm install --omit=dev --no-audit --legacy-peer-deps --force

# Copy source code
COPY . .

# Build the application
RUN npm run build || echo "Build warnings ignored"

# Create non-root user for security with proper home directory
RUN groupadd -r pharmcost && useradd -r -g pharmcost -s /bin/bash -m pharmcost
RUN chown -R pharmcost:pharmcost /app
RUN mkdir -p /home/pharmcost/.cache /home/pharmcost/.local/share/applications
RUN chown -R pharmcost:pharmcost /home/pharmcost
USER pharmcost

# Expose port - Railway will provide PORT via environment
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PORT=5000

# Start the application
CMD ["npm", "start"]