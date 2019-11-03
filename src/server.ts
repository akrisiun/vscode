// "@types/node": "^10.12.12",

declare var process: NodeJS.Process;

process.env.NBIN_BYPASS = 'true';

import { load, entry } from './bootstrap-amd';
// ts-node cli1.ts experiment
import * as cli from './vs/server/src/node/cli1';

entry(cli, null, null);
