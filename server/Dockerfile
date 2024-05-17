FROM node:alpine

# Create app directory
WORKDIR /app

# Copy package.json and install app dependencies
COPY package.json ./
RUN npm install \
    && npm cache clean --force

# Copy the rest of the repo
COPY . .

# Run build script from package.json
RUN ["npm", "run", "build"]

# Start the program
CMD ["node", "build/index.js"]
