/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ServiceCollection {
        constructor(...entries) {
            this._entries = new Map();
            for (let [id, service] of entries) {
                this.set(id, service);
            }
        }
        set(id, instanceOrDescriptor) {
            const result = this._entries.get(id);
            this._entries.set(id, instanceOrDescriptor);
            return result;
        }
        forEach(callback) {
            this._entries.forEach((value, key) => callback(key, value));
        }
        has(id) {
            return this._entries.has(id);
        }
        get(id) {
            return this._entries.get(id);
        }
    }
    exports.ServiceCollection = ServiceCollection;
});
//# sourceMappingURL=serviceCollection.js.map