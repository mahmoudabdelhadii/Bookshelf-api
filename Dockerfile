# Dockerfile.database

# Stage 1: Build the database package
FROM node:20.14.0-alpine AS database-builder

WORKDIR /workspace

# Copy root package files and database package.json
COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json ./database/

# Install dependencies
RUN npm ci

# Copy database source code
COPY database ./database

# Build the database package
RUN npm run build -w database

# Stage 2: Prepare the database package
FROM node:20.14.0-alpine AS database

WORKDIR /workspace

# Copy built database package from the builder stage
COPY --from=database-builder /workspace/database ./database

# Set the entrypoint if needed (e.g., for migrations)
ENTRYPOINT ["npm", "run", "deploy", "-w", "database"]


# Dockerfile.server

# Stage 1: Build the server
FROM node:20.14.0-alpine AS server-builder

WORKDIR /workspace

# Copy root package files and package.json files for database and server
COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json ./database/
COPY server/package.json ./server/

# Install dependencies
RUN npm ci

# Copy database and server source code
COPY database ./database
COPY server ./server

# Build the database package
RUN npm run build -w database

# Build the server package
RUN npm run build -w server

# Stage 2: Run the server
FROM node:20.14.0-alpine AS server

WORKDIR /workspace

# Copy built server and database packages from the builder stage
COPY --from=server-builder /workspace/database ./database
COPY --from=server-builder /workspace/server ./server
COPY package.json package-lock.json tsconfig.json ./

# Install production dependencies
RUN npm ci --only=production

# Set environment variables
ENV NODE_ENV=production

# Expose the necessary port
EXPOSE 8080

# Start the server
ENTRYPOINT ["npm", "start", "-w", "server"]
