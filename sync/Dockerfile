FROM node:alpine

WORKDIR /app

COPY package.json ./
RUN npm --omit=dev install

COPY . .

CMD ["node", "index.js"]
