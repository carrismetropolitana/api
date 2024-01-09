FROM node:alpine

# Install git
RUN apk update && \
    apk upgrade && \
    apk add git

# Create app directory
WORKDIR /app

# Copy package.json and install app dependencies
COPY package.json ./
RUN npm --omit=dev install

# Copy the rest of the repo
COPY . .

# Start the program
CMD ["node", "index.js"]
