
# get
# echo https://nodejs.org/download/release/latest-v10.x/node-v10.16.3-win-x64.zip
# curl https://nodejs.org/download/release/latest-v10.x/node-v10.16.3-win-x64.zip -o node-v10-win-x64.zip

echo https://nodejs.org/download/release/latest-v10.x/node-v10.17.0-win-x64.zip
curl https://nodejs.org/download/release/latest-v10.x/node-v10.17.0-win-x64.zip -o node-v10.17.0-win-x64.zip

curl https://yarnpkg.com/latest.msi -o yarn.msi

sudo npm i -g npm
sudo npm i -g node-gyp yarn optimist