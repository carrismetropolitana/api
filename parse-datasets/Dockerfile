FROM node:alpine

# Install git
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y git

# Create app directory
WORKDIR /app

# Copy package.json and install app dependencies
COPY package.json ./
RUN npm --omit=dev install

# Copy the rest of the repo
COPY . .

# Start the program
CMD ["node", "index.js"]
