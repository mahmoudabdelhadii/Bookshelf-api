FROM node:20.14.0-alpine AS database
WORKDIR /workspace
COPY package.json package-lock.json tsconfig.json       ./
COPY database/package.json                              ./database/
RUN npm ci
COPY database                                           ./database/
COPY --from=codegen /workspace/seeder/out/seedtypes.ts /workspace/seeder/out/schematypes.ts  ./database/src/
RUN npm run build -w database
ENTRYPOINT npm run deploy -w database


FROM node:20.14.0-alpine AS gateway
WORKDIR /workspace
COPY package.json package-lock.json tsconfig.json       ./
COPY database/package.json                              ./database/
COPY server/package.json                               ./server/
RUN npm ci
COPY --from=database /workspace/database/               ./database/
COPY server                                            ./server/
RUN npm run build -w server
ENV RUN_GATEWAY=true \
    RUN_COORDINATOR=false \
    NODE_ENV=production
ENTRYPOINT npm start -w server


FROM node:20.14.0-alpine AS coordinator
WORKDIR /workspace
COPY package.json package-lock.json tsconfig.json ./
COPY ./database/package.json ./database/
COPY ./server/package.json ./server/
RUN npm ci
COPY ./database/ ./database/
COPY ./server/ ./server/
ENV RUN_COORDINATOR=true \
    NODE_ENV=production
ENTRYPOINT npx -w server node build/src/index.js