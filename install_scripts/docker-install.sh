#!/bin/bash

# Error Handling
# Print each command and exit on error
set -ex

_install()
{
  # Download and install Docker
  echo "Downloading Docker"

  # Check if the system is macOS
  if [ "$(uname)" = "Darwin" ]; then
    curl -O https://desktop.docker.com/mac/main/arm64/Docker.dmg

    hdiutil attach Docker.dmg

    echo "Copying Docker.app into /Applications"
    cp -rf /Volumes/Docker.app /Applications

    hdiutil detach /Volumes/Docker

    rm Docker.dmg
  else
    sudo apt install docker.io docker-compose-plugin -y
  fi
}


_main()
{
  if [ -x "$(command -v docker)" ]; then
    echo "Docker Already Installed"
  else
    echo "Installing docker"
    _install
  fi
}

_main
