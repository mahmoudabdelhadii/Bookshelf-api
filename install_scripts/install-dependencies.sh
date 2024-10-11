#!/bin/bash

# Error Handling
# Print each command and exit on error
set -ex

SHELL_DOTFILE=$1

_main()
{
  
  if command -v brew &> /dev/null
  then
    echo "Homebrew is already installed"
  else
    # Install brew (https://brew.sh/)
    echo "Homebrew not found. Installing Homebrew..."
    yes '' | /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi

  if [ -f /etc/debian_version ]; then
    # Add brew to path
    (echo; echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"') >> ${SHELL_DOTFILE}
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"

    # Python install dependencies for Debian/Linux
    sudo apt update; sudo apt install -y make build-essential libssl-dev zlib1g-dev \
      libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm \
      libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev
  fi

  # Install asdf (https://asdf-vm.com/guide/getting-started.html)
  brew install coreutils curl git zsh-completions
  if [ ! -d ~/.asdf ]; then
    git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.14.0
    echo -e ". \"$HOME/.asdf/asdf.sh\"" >> ${SHELL_DOTFILE}
    source ${SHELL_DOTFILE}
    # if [[ "$SHELL_DOTFILE" == *".zshrc" ]]; then
    #   echo -e "fpath=(${HOME}/.asdf/completions \$fpath)" >> ${SHELL_DOTFILE}
    #   echo -e "autoload -Uz compinit && compinit"
    # elif [[ "$SHELL_DOTFILE" == *".bashrc" ]]; then
    #   echo -e ". \"$HOME/.asdf/completions/asdf.bash\"" >> ${SHELL_DOTFILE}
    # else
    #   echo "Unsupported shell configuration file. Please use .bashrc or .zshrc."
    #   exit 1
    # fi
    source ${SHELL_DOTFILE}
  else
    asdf update
  fi

  # asdf: terraform python 
  asdf plugin-add terraform
  asdf install terraform 1.6.6

  if [ ! -d ~/.cargo ]; then
    # Install Cargo
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    echo -e ". \"$HOME/.cargo/env\"" >> ${SHELL_DOTFILE}
  fi
  source "$HOME/.cargo/env" 
  # Verify Cargo installation
  if command -v cargo &> /dev/null
  then
    echo "Cargo is installed and accessible."
  else
    echo "Cargo command not found. Please check your installation."
  fi
  # cargo: mdbook mdbook-graphviz mdbook-mermaid fnm just
  cargo install mdbook mdbook-graphviz mdbook-mermaid fnm just

  echo 'eval "$(fnm env --use-on-cd)"' >> ${SHELL_DOTFILE}
  source ${SHELL_DOTFILE}

  # postgresql
  brew install postgresql@15
  echo 'export PATH="/opt/homebrew/Cellar/postgresql@15/15.7/bin/:$PATH" ' >> ${SHELL_DOTFILE}
  source ${SHELL_DOTFILE}

  # required pq_config for psycopg2 dependencies
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "skipping postgresql-devel"
    # brew install postgresql-devel -- already included in postgresql
  else
    sudo apt install libpq-dev
  fi
}

_main
