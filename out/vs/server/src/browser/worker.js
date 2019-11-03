define(["require", "exports", "vs/base/common/uri", "vs/server/node_modules/@coder/node-browser/out/client/client", "vs/server/node_modules/@coder/requirefs/out/requirefs"], function (require, exports, uri_1, client_1, requirefs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.loadCommonJSModule = async (module, activationTimesBuilder, nodeProxy, logService, vscode) => {
        const fetchUri = uri_1.URI.from({
            scheme: self.location.protocol.replace(":", ""),
            authority: self.location.host,
            path: `${self.location.pathname.replace(/\/static.*\/out\/vs\/workbench\/services\/extensions\/worker\/extensionHostWorkerMain.js$/, "")}/tar`,
            query: `path=${encodeURIComponent(module.extensionLocation.path)}`,
        });
        const response = await fetch(fetchUri.toString(true));
        if (response.status !== 200) {
            throw new Error(`Failed to download extension "${module.extensionLocation.path}"`);
        }
        const client = new client_1.Client(nodeProxy, { logger: logService });
        const init = await client.handshake();
        const buffer = new Uint8Array(await response.arrayBuffer());
        const rfs = requirefs_1.fromTar(buffer);
        self.global = self;
        rfs.provide("vscode", vscode);
        Object.keys(client.modules).forEach((key) => {
            const mod = client.modules[key];
            if (key === "process") {
                self.process = mod;
                self.process.env = init.env;
                return;
            }
            rfs.provide(key, mod);
            switch (key) {
                case "buffer":
                    self.Buffer = mod.Buffer;
                    break;
                case "timers":
                    self.setImmediate = mod.setImmediate;
                    break;
            }
        });
        try {
            activationTimesBuilder.codeLoadingStart();
            return rfs.require(".");
        }
        finally {
            activationTimesBuilder.codeLoadingStop();
        }
    };
});
//# sourceMappingURL=worker.js.map