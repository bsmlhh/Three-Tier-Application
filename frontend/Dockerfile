FROM node:21
WORKDIR /app
COPY package*.json ./
# Drop the local-dev "prepare" script (`cd .. && npm install`) before installing:
# inside the image `..` is `/`, which has no package.json, so it fails the build.
# Deleting only this script keeps dependency install scripts (esbuild/swc) working.
# Retry/timeout settings make the build resilient to flaky networks (EPIPE errors).
# maxsockets 3 limits concurrent TLS connections — too many parallel downloads on
# an unstable link cause ECONNRESET, so throttling them makes the install complete.
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 600000 \
    && npm config set maxsockets 3 \
    && npm pkg delete scripts.prepare \
    && npm install --no-audit --no-fund
COPY . .
COPY .env.sample .env.local

EXPOSE 5173

CMD ["npm","run","dev", "--","--host","--port","5173"]
