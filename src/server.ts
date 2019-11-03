
/// <reference types="node" />
// import  'node';
// "@types/node": "^10.12.12",

declare var process: NodeJS.Process;

/* interface Process { // extends EventEmitter {
    emitWarning(warning: string | Error, name?: string, ctor?: Function): void;
    env: ProcessEnv;
    exit(code?: number): never;
}
  
interface ProcessEnv {
    [key: string]: string | undefined;
} */

process.env.NBIN_BYPASS = "true";

import { Amd } from "./bootstrap-amdts";
// import * as cli from "./vs/server/src/node/cli";
const cli = "./vs/server/src/node/cli";

// JQuery.d.ts #
// declare let $: JQuery;
// export default $;
// App.ts #
// import $ from "jquery";
// import { default as MyClass } 

let amd = new Amd();
amd.load(cli, null, null);
