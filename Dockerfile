


FROM node:v22.9.0-alpine AS database-builder

WORKDIR /workspace


COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json ./database/


RUN npm ci


COPY database ./database


RUN npm run build -w database


FROM node:v22.9.0-alpine AS database

WORKDIR /workspace


COPY --from=database-builder /workspace/database ./database


ENTRYPOINT ["npm", "run", "deploy", "-w", "database"]





FROM node:v22.9.0-alpine AS server-builder

WORKDIR /workspace


COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json ./database/
COPY server/package.json ./server/


RUN npm ci


COPY database ./database
COPY server ./server


RUN npm run build -w database


RUN npm run build -w server


FROM node:v22.9.0-alpine AS server

WORKDIR /workspace


COPY --from=server-builder /workspace/database ./database
COPY --from=server-builder /workspace/server ./server
COPY package.json package-lock.json tsconfig.json ./


RUN npm ci --only=production


ENV NODE_ENV=production


EXPOSE 8080


ENTRYPOINT ["npm", "start", "-w", "server"]
