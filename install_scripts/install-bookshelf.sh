#!/bin/bash

# Error Handling
# Print each command and exit on error
set -ex

# Create symlinks for .env from each relevant component subdirectory
_symlink()
{
  DIRS=$(find . -type f -name '*.env.example' -exec dirname {} \; |sed -r 's|./?||' |sort |uniq)
  for D in $DIRS; do
    if [ ! -e $D/.env ]; then
      (cd $D && ln -s ../.env .env)
    fi
  done
}


_main()
{
  REPO_ROOT=$(git rev-parse --show-toplevel)
  cd "$REPO_ROOT"

  # install the correct version of node, npm, npx
  fnm install
  # to actually be able to use them
  fnm use

  # Start the requisite 2 external services: https://dev.parallelbookshelf.com/manual/development/development-environment.html#docker-compose
  docker compose up -d

  # Create env file
  cp .env.example .env

  # symlink envfiles
  _symlink

  # openai env arguments
  
  # Install all node modules
  npm install

  # Install all python packages
  poetry install

  # Build App
  just build

  # Migrate the database
  #npm -w database run migrate
}

_main
