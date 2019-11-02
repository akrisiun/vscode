/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/modes/languageFeatureRegistry", "vs/base/common/arrays", "vs/base/common/errors"], function (require, exports, languageFeatureRegistry_1, arrays_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CallHierarchyDirection;
    (function (CallHierarchyDirection) {
        CallHierarchyDirection[CallHierarchyDirection["CallsTo"] = 1] = "CallsTo";
        CallHierarchyDirection[CallHierarchyDirection["CallsFrom"] = 2] = "CallsFrom";
    })(CallHierarchyDirection = exports.CallHierarchyDirection || (exports.CallHierarchyDirection = {}));
    exports.CallHierarchyProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    class RefCountedDisposabled {
        constructor(_disposable, _counter = 1) {
            this._disposable = _disposable;
            this._counter = _counter;
        }
        acquire() {
            this._counter++;
            return this;
        }
        release() {
            if (--this._counter === 0) {
                this._disposable.dispose();
            }
            return this;
        }
    }
    class CallHierarchyModel {
        constructor(provider, root, ref) {
            this.provider = provider;
            this.root = root;
            this.ref = ref;
        }
        static async create(model, position, token) {
            const [provider] = exports.CallHierarchyProviderRegistry.ordered(model);
            if (!provider) {
                return undefined;
            }
            const session = await provider.prepareCallHierarchy(model, position, token);
            if (!session) {
                return undefined;
            }
            return new CallHierarchyModel(provider, session.root, new RefCountedDisposabled(session));
        }
        dispose() {
            this.ref.release();
        }
        fork(item) {
            const that = this;
            return new class extends CallHierarchyModel {
                constructor() {
                    super(that.provider, item, that.ref.acquire());
                }
            };
        }
        async resolveIncomingCalls(item, token) {
            try {
                const result = await this.provider.provideIncomingCalls(item, token);
                if (arrays_1.isNonEmptyArray(result)) {
                    return result;
                }
            }
            catch (e) {
                errors_1.onUnexpectedExternalError(e);
            }
            return [];
        }
        async resolveOutgoingCalls(item, token) {
            try {
                const result = await this.provider.provideOutgoingCalls(item, token);
                if (arrays_1.isNonEmptyArray(result)) {
                    return result;
                }
            }
            catch (e) {
                errors_1.onUnexpectedExternalError(e);
            }
            return [];
        }
    }
    exports.CallHierarchyModel = CallHierarchyModel;
});
//# sourceMappingURL=callHierarchy.js.map