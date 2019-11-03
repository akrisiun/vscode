// Once our entry file is loaded we no longer need nbin to bypass normal Node
// execution. We can still shim the fs into the binary even when bypassing. This
// will ensure for example that a spawn like `${process.argv[0]} -e` will work
// while still allowing us to access files within the binary.

process.env.NBIN_BYPASS = "true";

// const cli = require("./vs/server/src/node/cli");
import { Amd }  from "../../bootstrap-amdts';
// import * as cli from 

const cli = "./src/node/cli";

let amd = new Amd();
amd.load(cli);
