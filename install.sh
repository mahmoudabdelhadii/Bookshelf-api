#!/bin/bash

# Error Handling
# Print each command and exit on error
set -ex

# Text Colour
GREEN="\033[1;32m"
NC="\033[0m"


_dotfile_location()
{
  default_dotfile="~/.zshrc"
  echo -e $GREEN
  echo -e "This setup will require changes to your shell's dotfile. Please indicate your prefered destination $NC"

  read -p "Specify shell dotfile [default: ${default_dotfile}]: " DOTFILE
  DOTFILE=${DOTFILE:-$default_dotfile}
}

_run_instructions()
{
  echo -e $GREEN
  echo "kitab Successfully Installed!! Run this to start the app and all the services!$NC"
  echo "npm run dev"
  echo -e $GREEN
}

_main() {
  # set dotfile location
  _dotfile_location

  # Download and Install Docker
  ./install_scripts/docker-install.sh

  # install dependencies
  ./install_scripts/install-dependencies.sh "$(eval echo ${DOTFILE})"

  # install
  ./install_scripts/install-kitab.sh 

  # Display instructions to run
  _run_instructions
}

_main
