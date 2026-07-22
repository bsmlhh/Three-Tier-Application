FROM node:21
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
COPY .env.sample .env.local

EXPOSE 5173

CMD ["npm","run","dev", "--","--host","--port","5173"]
