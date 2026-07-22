# Base image for backend
FROM node:21 

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies. Retry/timeout settings make the build resilient to
# flaky networks (the EPIPE/registry errors seen on slow connections).
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 600000 \
    && npm ci --no-audit --no-fund

# Copy the rest of the application code to the working directory
COPY . .
COPY .env.sample .env
# Expose the port the app runs on
EXPOSE 5000

# Command to start the backend server
CMD ["npm", "run", "dev"]