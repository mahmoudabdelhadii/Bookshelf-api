set shell := ["bash", "-uc"]

install:
    npm install --workspaces
# Build anything that might be needed and then run the servers.
default: build-database build-server && run

dev:
    just docker-start
    npm run -w masjid-bookshelf-client ios
# Default command: Build and run the server
# docker: docker-build-server && docker-start
# # Run the servers.
run:
    npx tsx -r dotenv/config dev.ts
    

# Initialize the most basic parts of the repo
init: tsinit
    #!/usr/bin/env bash
    DIRS=$(find . -type f -name '*.env.example' -exec dirname {} \; |sed -r 's|./?||' |sort |uniq)
    for D in $DIRS; do
      if [ ! -e $D/.env ]; then
        (cd $D && ln -s ../.env .env)
      fi
    done

# Build all components of the project
build: tsbuild

# Lint all components
lint: tslint

# Format all code
fmt: tsfmt

# Typecheck all components
check: tscheck

# Clean all
clean: tsclean

# Install TypeScript dependencies
[group('typescript')]
tsinit:
    npm install

# Build all TypeScript projects
[group('typescript')]
tsbuild: build-eslint-plugin-bookshelf build-database build-server

# Lint all TypeScript projects
[group('typescript')]
tslint: lint-server lint-eslint-plugin-bookshelf lint-client lint-database

# Format all TypeScript projects
[group('typescript')]
tsfmt: fmt-database fmt-server fmt-eslint-plugin-bookshelf fmt-client

# Clean all TypeScript projects
[group('typescript')]
tsclean: clean-database clean-server clean-eslint-plugin-bookshelf clean-client

# Typecheck all TypeScript projects
[group('typescript')]
tscheck: check-database check-server check-eslint-plugin-bookshelf check-client

# Test all TypeScript projects
[group('typescript')]
tstest: test-database test-server

# Build database package
[group('database')]
build-database:
    npx tsc --build database

# Typecheck database package
[group('database')]
check-database:
    npx -w database tsc --build --emitDeclarationOnly

# Lint database package
[group('database')]
lint-database: build-eslint-plugin-bookshelf
    npx -w database eslint . --max-warnings 0 --cache

# Format database package
[group('database')]
fmt-database:
    npx -w database prettier . --write --cache

# Clean generated files from database package
[group('database')]
clean-database:
    npx -w database tsc --build --clean
    rm -f database/src/seedtypes.ts
    rm -f database/.eslintcache
    rm -rf database/node_modules/.cache/prettier/

# Run database tests
[group('database')]
test-database url="postgresql://postgres:postgres@localhost:45432/bookshelf": build-database
    #!/usr/bin/env bash
    set -e
    cd database
    for file in $(ls tests); do
        docker compose -f ../e2e/docker-compose.yml exec postgres pg_prove -U postgres -d bookshelf "/tests/$file"
    done

    DATABASE_URL={{url}} npm -w database test

# Generate a new (possibly empty) migration
[group('database')]
migration name:
    npx -w database tsx -r dotenv/config src/private/makemigration.ts "{{name}}"

# Migrate the database to the latest state
[group('database')]
migrate:
    npx -w database tsx -r dotenv/config src/private/migrate.ts

# Migrate the test database to the latest state
[group('database')]
[private]
migrate-test url="postgresql://postgres:postgres@localhost:45432/bookshelf":
    docker compose -f ./e2e/docker-compose.yml exec postgres dropdb -U postgres bookshelf || true
    docker compose -f ./e2e/docker-compose.yml exec postgres createdb -U postgres bookshelf
    DATABASE_URL={{url}} npm run -w database migrate

# Clear the database and re-run all migrations
[group('database')]
reset-database: clear-database && migrate

# Clear the database
[group('database')]
[confirm("Are you sure you want to reset the database? This action cannot be undone.")]
clear-database:
    docker compose exec postgres dropdb -U postgres bookshelf || true
    docker compose exec postgres createdb -U postgres bookshelf

# Build server package
[group('server')]
build-server:
    npx tsc --build server

# Typecheck server
[group('server')]
check-server:
    npx -w server tsc --build --emitDeclarationOnly

# Lint server
[group('server')]
lint-server: build-eslint-plugin-bookshelf build-database
    npx -w server eslint . --max-warnings 0 --cache

# Format server
[group('server')]
fmt-server:
    npx -w server prettier . --write --cache

# Export GraphQL schema
[group('server')]
export: migrate build-database
    npm run -w server export

# Test server
[group('server')]
test-server:
    npm -w server test

# Clean generated files from server
[group('server')]
clean-server:
    npx -w server tsc --build --clean
    cd server
    rm -f server/.eslintcache
    rm -rf server/node_modules/.cache/prettier/

[private]
build-eslint-plugin-bookshelf:
    npx tsc --build eslint-plugin-bookshelf

[private]
check-eslint-plugin-bookshelf:
    npx -w eslint-plugin-bookshelf tsc --build --emitDeclarationOnly

[private]
lint-eslint-plugin-bookshelf:
    npx -w eslint-plugin-bookshelf eslint . --max-warnings 0 --cache

[private]
fmt-eslint-plugin-bookshelf:
    npx -w eslint-plugin-bookshelf prettier . --write --cache

[private]
test-eslint-plugin-bookshelf: build-eslint-plugin-bookshelf
    npm -w eslint-plugin-bookshelf test

[private]
clean-eslint-plugin-bookshelf:
    npx -w eslint-plugin-bookshelf tsc --build --clean
    rm -f eslint-plugin-bookshelf/.eslintcache
    rm -rf eslint-plugin-bookshelf/node_modules/.cache/prettier/

[group('e2e')]
start-e2e service="": && migrate-test
    docker compose -f ./e2e/docker-compose.yml up -d --wait --build {{service}}
    sleep 2

[group('e2e')]
stop-e2e:
    docker compose -f ./e2e/docker-compose.yml down

# Typecheck e2e
[group('e2e')]
check-e2e:
    npx -w e2e tsc --build

# Lint e2e
[group('e2e')]
lint-e2e: build-eslint-plugin-bookshelf
    npx -w e2e eslint . --max-warnings 0 --cache

# Format e2e
[group('e2e')]
fmt-e2e:
    npx -w e2e prettier . --write --cache

# Clean generated files in e2e
[group('e2e')]
clean-e2e:
    npx -w e2e tsc --build --clean
    rm -f e2e/.eslintcache
    rm -rf e2e/node_modules/.cache/prettier/

[group('client')]
lint-client:
    npm -w masjid-bookshelf-client run lint

[group('client')]
test-client:
    npm -w masjid-bookshelf-client run test
[group('client')]
run-client:
    npm -w masjid-bookshelf-client start

[group('client')]
fmt-client:
    npx -w masjid-bookshelf-client prettier . --write --cache

[group('client')]
clean-client:
    npx -w masjid-bookshelf-client tsc --build --clean
    rm -f masjid-bookshelf-client/.eslintcache
    rm -rf masjid-bookshelf-client/node_modules/.cache/prettier/
[group('client')]
check-client:
    npx -w masjid-bookshelf-client tsc --build

# Docker commands
docker-build-server:
    docker build -f Dockerfile.server -t bookshelf-server .

docker-start:
    docker-compose up -d

docker-stop:
    docker-compose down

docker-restart:
    just docker-stop
    # just docker-build-server
    just docker-start

# Clean up Docker resources
docker-clean:
    docker system prune -f