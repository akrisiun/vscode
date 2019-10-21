/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/editor/common/modes/languageFeatureRegistry", "vs/editor/browser/editorExtensions", "vs/base/common/arrays", "vs/base/common/errors"], function (require, exports, cancellation_1, languageFeatureRegistry_1, editorExtensions_1, arrays_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CallHierarchyDirection;
    (function (CallHierarchyDirection) {
        CallHierarchyDirection[CallHierarchyDirection["CallsTo"] = 1] = "CallsTo";
        CallHierarchyDirection[CallHierarchyDirection["CallsFrom"] = 2] = "CallsFrom";
    })(CallHierarchyDirection = exports.CallHierarchyDirection || (exports.CallHierarchyDirection = {}));
    exports.CallHierarchyProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    async function provideIncomingCalls(model, position, token) {
        const [provider] = exports.CallHierarchyProviderRegistry.ordered(model);
        if (!provider) {
            return [];
        }
        try {
            const result = await provider.provideIncomingCalls(model, position, token);
            if (arrays_1.isNonEmptyArray(result)) {
                return result;
            }
        }
        catch (e) {
            errors_1.onUnexpectedExternalError(e);
        }
        return [];
    }
    exports.provideIncomingCalls = provideIncomingCalls;
    async function provideOutgoingCalls(model, position, token) {
        const [provider] = exports.CallHierarchyProviderRegistry.ordered(model);
        if (!provider) {
            return [];
        }
        try {
            const result = await provider.provideOutgoingCalls(model, position, token);
            if (arrays_1.isNonEmptyArray(result)) {
                return result;
            }
        }
        catch (e) {
            errors_1.onUnexpectedExternalError(e);
        }
        return [];
    }
    exports.provideOutgoingCalls = provideOutgoingCalls;
    editorExtensions_1.registerDefaultLanguageCommand('_executeCallHierarchyIncomingCalls', async (model, position) => provideIncomingCalls(model, position, cancellation_1.CancellationToken.None));
    editorExtensions_1.registerDefaultLanguageCommand('_executeCallHierarchyOutgoingCalls', async (model, position) => provideOutgoingCalls(model, position, cancellation_1.CancellationToken.None));
});
//# sourceMappingURL=callHierarchy.js.map