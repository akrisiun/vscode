/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "../common/errorTelemetry"], function (require, exports, errors_1, errorTelemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ErrorTelemetry extends errorTelemetry_1.default {
        installErrorListeners() {
            errors_1.setUnexpectedErrorHandler(err => console.error(err));
            // Print a console message when rejection isn't handled within N seconds. For details:
            // see https://nodejs.org/api/process.html#process_event_unhandledrejection
            // and https://nodejs.org/api/process.html#process_event_rejectionhandled
            const unhandledPromises = [];
            process.on('unhandledRejection', (reason, promise) => {
                unhandledPromises.push(promise);
                setTimeout(() => {
                    const idx = unhandledPromises.indexOf(promise);
                    if (idx >= 0) {
                        promise.catch(e => {
                            unhandledPromises.splice(idx, 1);
                            console.warn(`rejected promise not handled within 1 second: ${e}`);
                            if (e.stack) {
                                console.warn(`stack trace: ${e.stack}`);
                            }
                            errors_1.onUnexpectedError(reason);
                        });
                    }
                }, 1000);
            });
            process.on('rejectionHandled', (promise) => {
                const idx = unhandledPromises.indexOf(promise);
                if (idx >= 0) {
                    unhandledPromises.splice(idx, 1);
                }
            });
            // Print a console message when an exception isn't handled.
            process.on('uncaughtException', (err) => {
                errors_1.onUnexpectedError(err);
            });
        }
    }
    exports.default = ErrorTelemetry;
});
//# sourceMappingURL=errorTelemetry.js.map