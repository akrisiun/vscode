#!/usr/bin/env bash
# ./scripts./electron.sh

set -e
echo OSTYPE=$OSTYPE

if [[ "$OSTYPE" == "darwin"* ]]; then
	realpath() { [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"; }
	ROOT=$(dirname "$(dirname "$(realpath "$0")")")
else
	ROOT=$(dirname "$(dirname "$(readlink -f $0)")")
	if grep -qi Microsoft /proc/version; then
		IN_WSL=true
	fi
fi


function code() {

	cd "$ROOT"

	# Configuration
	export NODE_ENV=development
	export VSCODE_DEV=1
	export VSCODE_CLI=1
	export ELECTRON_ENABLE_STACK_DUMPING=1
	export ELECTRON_ENABLE_LOGGING=1
	export VSCODE_LOGS=

	# Launch Code
	export CODE="./.build/electron/Code - OSS.app/Contents/MacOS/Electron"

	echo "$CODE . $@"
	# ./.build/electron/Code - OSS.app/Contents/MacOS/Electron .
	exec "$CODE" . "$@"
}

function code-wsl()
{
	# in a wsl shell
	ELECTRON="$ROOT/.build/electron/Code - OSS.exe"
	if [ -f "$ELECTRON"  ]; then
		local CWD=$(pwd)
		cd $ROOT
		export WSLENV=ELECTRON_RUN_AS_NODE/w:$WSLENV
		local WSL_EXT_ID="ms-vscode-remote.remote-wsl"
		local WSL_EXT_WLOC=$(ELECTRON_RUN_AS_NODE=1 "$ROOT/.build/electron/Code - OSS.exe" "out/cli.js" --locate-extension $WSL_EXT_ID)
		cd $CWD
		if [ -n "$WSL_EXT_WLOC" ]; then
			# replace \r\n with \n in WSL_EXT_WLOC
			local WSL_CODE=$(wslpath -u "${WSL_EXT_WLOC%%[[:cntrl:]]}")/scripts/wslCode-dev.sh
			$WSL_CODE "$ROOT" "$@"
			exit $?
		else
			echo "Remote WSL not installed, trying to run VSCode in WSL."
		fi
	fi
}

if ! [ -z ${IN_WSL+x} ]; then
	code-wsl "$@"
fi

echo "code $@"
code "$@"
