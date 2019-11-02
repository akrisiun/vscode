#!/bin/bash

brew unlink node
# brew link node@10
brew upgrade node@10
brew link  --force --overwrite node@10  