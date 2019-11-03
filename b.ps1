
remove-item -force ./out-build/

# compile
# bundle-extensions-build
yarn vscode-x64

yarn x64-archive

ls .build\win32-x64\archive\