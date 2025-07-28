FROM node:22.6-alpine3.20

WORKDIR /app

COPY package.json ./

RUN npm install \
    && npm cache clean --force

RUN npx @helperkits/bumper package.json

COPY . .

RUN ["npm", "run", "build"]

CMD ["node", "dist/index.js"]