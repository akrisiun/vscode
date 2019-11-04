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

npm config set scripts-prepend-node-path auto

# curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh
chmod +x ./nodesource_setup.sh
sudo ./nodesource_setup.sh
sudo apt-get install -y nodejs
sudo apt-get install -y make gcc g++ python2.7 pkg-config libx11-dev libxkbfile-dev libsecret-1-dev

# sudo npm i -g npm
yarn global add npm
yarn global add optimist node-gyp

