# ============================================
# Dockerfile for Frontend (nginx)
# ============================================
# This builds the frontend container image.
# It copies the HTML file and custom nginx
# config into the official nginx image.
# ============================================

# Use official nginx image as base
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config (with reverse proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the frontend HTML file
COPY index.html /usr/share/nginx/html/index.html

# Expose port 80
EXPOSE 80

# nginx starts automatically (default CMD)
