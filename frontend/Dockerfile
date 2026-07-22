FROM node:21
WORKDIR /app
COPY package*.json ./
# Drop the local-dev "prepare" script (`cd .. && npm install`) before installing:
# inside the image `..` is `/`, which has no package.json, so it fails the build.
# Deleting only this script keeps dependency install scripts (esbuild/swc) working.
RUN npm pkg delete scripts.prepare && npm i
COPY . .
COPY .env.sample .env.local

EXPOSE 5173

CMD ["npm","run","dev", "--","--host","--port","5173"]
