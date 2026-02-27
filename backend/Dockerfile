# ============================================
# Dockerfile for Backend (Node.js + Express)
# ============================================
# This builds the backend API container image.
# It installs dependencies and runs server.js.
# ============================================

# Use official Node.js image as base
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (for Docker layer caching)
COPY package.json .

# Install Node.js dependencies
RUN npm install

# Copy the server code
COPY server.js .

# Expose port 3000 for the API
EXPOSE 3000

# Command to start the server
CMD ["node", "server.js"]
