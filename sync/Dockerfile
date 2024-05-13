FROM node:alpine

# Create app directory
WORKDIR /app

# Copy package.json and install app dependencies
COPY package.json ./
RUN npm --omit=dev install \
    && npm cache clean --force

# Copy the rest of the repo
COPY . .

# Start the program
CMD ["node", "index.js"]
