/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/marshalling", "vs/base/common/types", "vs/base/common/strings"], function (require, exports, event_1, marshalling_1, types_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createChannelReceiver(service, options) {
        const handler = service;
        const disableMarshalling = options && options.disableMarshalling;
        // Buffer any event that should be supported by
        // iterating over all property keys and finding them
        const mapEventNameToEvent = new Map();
        for (const key in handler) {
            if (propertyIsEvent(key)) {
                mapEventNameToEvent.set(key, event_1.Event.buffer(handler[key], true));
            }
        }
        return new class {
            listen(_, event) {
                const eventImpl = mapEventNameToEvent.get(event);
                if (eventImpl) {
                    return eventImpl;
                }
                throw new Error(`Event not found: ${event}`);
            }
            call(_, command, args) {
                const target = handler[command];
                if (typeof target === 'function') {
                    // Revive unless marshalling disabled
                    if (!disableMarshalling && Array.isArray(args)) {
                        for (let i = 0; i < args.length; i++) {
                            args[i] = marshalling_1.revive(args[i]);
                        }
                    }
                    return target.apply(handler, args);
                }
                throw new Error(`Method not found: ${command}`);
            }
        };
    }
    exports.createChannelReceiver = createChannelReceiver;
    function createChannelSender(channel, options) {
        const disableMarshalling = options && options.disableMarshalling;
        return new Proxy({}, {
            get(_target, propKey, _receiver) {
                if (typeof propKey === 'string') {
                    // Event
                    if (propertyIsEvent(propKey)) {
                        return channel.listen(propKey);
                    }
                    // Function
                    return async function (...args) {
                        // Add context if any
                        let methodArgs;
                        if (options && !types_1.isUndefinedOrNull(options.context)) {
                            methodArgs = [options.context, ...args];
                        }
                        else {
                            methodArgs = args;
                        }
                        const result = await channel.call(propKey, methodArgs);
                        // Revive unless marshalling disabled
                        if (!disableMarshalling) {
                            return marshalling_1.revive(result);
                        }
                        return result;
                    };
                }
                throw new Error(`Property not found: ${String(propKey)}`);
            }
        });
    }
    exports.createChannelSender = createChannelSender;
    function propertyIsEvent(name) {
        // Assume a property is an event if it has a form of "onSomething"
        return name[0] === 'o' && name[1] === 'n' && strings_1.isUpperAsciiLetter(name.charCodeAt(2));
    }
});
//# sourceMappingURL=ipc.js.map