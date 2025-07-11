FROM node:22.9.0-slim

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm ci

# Bundle app source
COPY . .

# Copy environment file
COPY .env .env

# Build the TypeScript files
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the app
CMD npm run start
