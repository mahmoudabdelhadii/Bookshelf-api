FROM node:20.14.0-alpine AS database
WORKDIR /workspace
COPY package.json package-lock.json tsconfig.json       ./
COPY database/package.json                              ./database/
RUN npm ci
COPY database                                           ./database/
COPY --from=codegen /workspace/seeder/out/seedtypes.ts /workspace/seeder/out/schematypes.ts  ./database/src/
RUN npm run build -w database
ENTRYPOINT npm run deploy -w database
