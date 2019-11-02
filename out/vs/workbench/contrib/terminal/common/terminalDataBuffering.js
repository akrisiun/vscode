/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TerminalDataBufferer {
        constructor() {
            this._terminalBufferMap = new Map();
        }
        dispose() {
            for (const buffer of this._terminalBufferMap.values()) {
                buffer.dispose();
            }
        }
        startBuffering(id, event, callback, throttleBy = 5) {
            let disposable;
            disposable = event((e) => {
                let buffer = this._terminalBufferMap.get(id);
                if (buffer) {
                    buffer.data.push(e);
                    return;
                }
                const timeoutId = setTimeout(() => {
                    this._terminalBufferMap.delete(id);
                    callback(id, buffer.data.join(''));
                }, throttleBy);
                buffer = {
                    data: [e],
                    timeoutId: timeoutId,
                    dispose: () => {
                        clearTimeout(timeoutId);
                        this._terminalBufferMap.delete(id);
                        disposable.dispose();
                    }
                };
                this._terminalBufferMap.set(id, buffer);
            });
            return disposable;
        }
        stopBuffering(id) {
            const buffer = this._terminalBufferMap.get(id);
            if (buffer) {
                buffer.dispose();
            }
        }
    }
    exports.TerminalDataBufferer = TerminalDataBufferer;
});
//# sourceMappingURL=terminalDataBuffering.js.map