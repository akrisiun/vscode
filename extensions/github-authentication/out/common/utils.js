"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseFromEvent = exports.onceEvent = exports.filterEvent = void 0;
function filterEvent(event, filter) {
    return (listener, thisArgs = null, disposables) => event(e => filter(e) && listener.call(thisArgs, e), null, disposables);
}
exports.filterEvent = filterEvent;
function onceEvent(event) {
    return (listener, thisArgs = null, disposables) => {
        const result = event(e => {
            result.dispose();
            return listener.call(thisArgs, e);
        }, null, disposables);
        return result;
    };
}
exports.onceEvent = onceEvent;
const passthrough = (value, resolve) => resolve(value);
/**
 * Return a promise that resolves with the next emitted event, or with some future
 * event as decided by an adapter.
 *
 * If specified, the adapter is a function that will be called with
 * `(event, resolve, reject)`. It will be called once per event until it resolves or
 * rejects.
 *
 * The default adapter is the passthrough function `(value, resolve) => resolve(value)`.
 *
 * @param event the event
 * @param adapter controls resolution of the returned promise
 * @returns a promise that resolves or rejects as specified by the adapter
 */
async function promiseFromEvent(event, adapter = passthrough) {
    let subscription;
    return new Promise((resolve, reject) => subscription = event((value) => {
        try {
            Promise.resolve(adapter(value, resolve, reject))
                .catch(reject);
        }
        catch (error) {
            reject(error);
        }
    })).then((result) => {
        subscription.dispose();
        return result;
    }, error => {
        subscription.dispose();
        throw error;
    });
}
exports.promiseFromEvent = promiseFromEvent;
//# sourceMappingURL=utils.js.map