set shell := ["bash", "-uc"]

install:
    npm install --workspaces
# Build anything that might be needed and then run the servers.
default: build-database build-server && run

dev:
    just docker-start
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
tsbuild: build-eslint-plugin-kitab build-database build-server

# Lint all TypeScript projects
[group('typescript')]
tslint: lint-server lint-eslint-plugin-kitab  lint-database

# Format all TypeScript projects
[group('typescript')]
tsfmt: fmt-database fmt-server fmt-eslint-plugin-kitab
# Clean all TypeScript projects
[group('typescript')]
tsclean: clean-database clean-server clean-eslint-plugin-kitab 
# Typecheck all TypeScript projects
[group('typescript')]
tscheck: check-database check-server check-eslint-plugin-kitab 

# Test all TypeScript projects
[group('typescript')]
tstest: test-server

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
lint-database: build-eslint-plugin-kitab
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
migrate-test url="postgresql://postgres:postgres@localhost:45432/kitab":
    docker compose -f ./e2e/docker-compose.yml exec postgres dropdb -U postgres kitab || true
    docker compose -f ./e2e/docker-compose.yml exec postgres createdb -U postgres kitab
    DATABASE_URL={{url}} npm run -w database migrate

# Clear the database and re-run all migrations
[group('database')]
reset-database: clear-database && migrate

# Clear the database
[group('database')]
[confirm("Are you sure you want to reset the database? This action cannot be undone.")]
clear-database:
    docker compose exec postgres dropdb -U postgres kitab || true
    docker compose exec postgres createdb -U postgres kitab

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
lint-server: build-eslint-plugin-kitab build-database
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
build-eslint-plugin-kitab:
    npx tsc --build eslint-plugin-kitab

[private]
check-eslint-plugin-kitab:
    npx -w eslint-plugin-kitab tsc --build --emitDeclarationOnly

[private]
lint-eslint-plugin-kitab:
    npx -w eslint-plugin-kitab eslint . --max-warnings 0 --cache

[private]
fmt-eslint-plugin-kitab:
    npx -w eslint-plugin-kitab prettier . --write --cache

[private]
test-eslint-plugin-kitab: build-eslint-plugin-kitab
    npm -w eslint-plugin-kitab test

[private]
clean-eslint-plugin-kitab:
    npx -w eslint-plugin-kitab tsc --build --clean
    rm -f eslint-plugin-kitab/.eslintcache
    rm -rf eslint-plugin-kitab/node_modules/.cache/prettier/

# Docker commands
docker-build-server:
    docker build -f Dockerfile.server -t kitab-server .

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
