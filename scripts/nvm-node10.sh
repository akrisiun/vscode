#!/bin/bash

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.0/install.sh | bash
# .nvm/*

source ~/.bashrc
export PS1="$ "
nvm -v
nvm ls-remote | grep LTS

nvm install 10.17.0
nvm use 10.17.0
nvm set scripts-prepend-node-path=true

npm install scripts-prepend-node-path=true
# .nvmrc



curl -sL https://deb.nodesource.com/setup_10.x -o scripts/nodesource_setup.sh
chmod +x scripts/nodesource_setup.sh
sudo scripts/nodesource_setup.sh

sudo apt-get install -y nodejs
sudo apt-get install -y make gcc g++ pkg-config libx11-dev libxkbfile-dev

# sudo npm i -g npm
yarn global add npm
yarn global add optimist node-gyp
npm config set scripts-prepend-node-path auto
