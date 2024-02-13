FROM node:alpine

# Create app directory
WORKDIR /app

# Copy package.json and install app dependencies
COPY package.json ./
RUN npm --omit=dev install

# Copy the rest of the repo
COPY . .

# Start the program
RUN ["npm", "run", "build"]

CMD ["node", "build/index.js"]
