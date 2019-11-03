define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ControlMessage;
    (function (ControlMessage) {
        ControlMessage["okToChild"] = "ok>";
        ControlMessage["okFromChild"] = "ok<";
    })(ControlMessage || (ControlMessage = {}));
    class IpcMain {
        constructor() {
            this._onMessage = new event_1.Emitter();
            this.onMessage = this._onMessage.event;
        }
        handshake(child) {
            return new Promise((resolve, reject) => {
                const target = child || process;
                if (!target.send) {
                    throw new Error("Not spawned with IPC enabled");
                }
                target.on("message", (message) => {
                    if (message === child ? ControlMessage.okFromChild : ControlMessage.okToChild) {
                        target.removeAllListeners();
                        target.on("message", (msg) => this._onMessage.fire(msg));
                        if (child) {
                            target.send(ControlMessage.okToChild);
                        }
                        resolve();
                    }
                });
                if (child) {
                    child.once("error", reject);
                    child.once("exit", (code) => {
                        const error = new Error(`Unexpected exit with code ${code}`);
                        error.code = code;
                        reject(error);
                    });
                }
                else {
                    target.send(ControlMessage.okFromChild);
                }
            });
        }
        relaunch() {
            if (!process.send) {
                throw new Error("Not a child process with IPC enabled");
            }
            process.send("relaunch");
        }
    }
    exports.ipcMain = new IpcMain();
});
//# sourceMappingURL=ipc.js.map