FROM node:alpine

WORKDIR /app

COPY package.json ./

RUN npm install \
    && npm cache clean --force

RUN npx @helperkits/bumper bump

COPY . .

RUN ["npm", "run", "build"]

CMD ["node", "build/index.js"]