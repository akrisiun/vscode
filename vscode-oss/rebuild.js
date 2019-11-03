// @nicolasnoble's answer is perfect. Try this for your ElectronRebuild.js script:
// @flow
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import dependencies from '..//package.json';

const nodeModulesPath = path.join(__dirname, '..', '..', 'app', 'node_modules');
const modules = [ 'vscode-sqllite3', '' ];
// dependencies.filter(e => e === 'grpc-node').join(',');

if (
  Object.keys(dependencies || {}).length > 0 &&
  fs.existsSync(nodeModulesPath)
) {
  const electronRebuildCmd =
    `../node_modules/.bin/electron-rebuild --parallel --which-module ${modules} --force --types prod,optional --module-dir .`;

  const cmd =
    process.platform === 'win32'
      ? electronRebuildCmd.replace(/\//g, '\\')
      : electronRebuildCmd;

  execSync(cmd, {
    cwd: path.join(__dirname, '..', '..', 'app')
  });
}
