#!/bin/bash

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.0/install.sh | bash
# .nvm/*

source ~/.bashrc
export PS1="$ "
nvm -v
nvm ls-remote | grep LTS

nvm install 10.17.0
nvm use 10.17.0

npm install scripts-prepend-node-path=true
# .nvmrc
# nvm set scripts-prepend-node-path=true
# npm config set scripts-prepend-node-path auto
