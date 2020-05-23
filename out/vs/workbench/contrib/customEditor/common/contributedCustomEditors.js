/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/customEditor/common/extensionPoint", "vs/workbench/contrib/files/common/files"], function (require, exports, event_1, lifecycle_1, nls, customEditor_1, extensionPoint_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContributedCustomEditors = exports.defaultCustomEditor = void 0;
    const builtinProviderDisplayName = nls.localize('builtinProviderDisplayName', "Built-in");
    exports.defaultCustomEditor = new customEditor_1.CustomEditorInfo({
        id: files_1.DEFAULT_EDITOR_ID,
        displayName: nls.localize('promptOpenWith.defaultEditor.displayName', "Text Editor"),
        providerDisplayName: builtinProviderDisplayName,
        selector: [
            { filenamePattern: '*' }
        ],
        priority: "default" /* default */,
    });
    class ContributedCustomEditors extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._editors = new Map();
            this._onChange = this._register(new event_1.Emitter());
            this.onChange = this._onChange.event;
            extensionPoint_1.customEditorsExtensionPoint.setHandler(extensions => {
                this._editors.clear();
                for (const extension of extensions) {
                    for (const webviewEditorContribution of extension.value) {
                        this.add(new customEditor_1.CustomEditorInfo({
                            id: webviewEditorContribution.viewType,
                            displayName: webviewEditorContribution.displayName,
                            providerDisplayName: extension.description.isBuiltin ? builtinProviderDisplayName : extension.description.displayName || extension.description.identifier.value,
                            selector: webviewEditorContribution.selector || [],
                            priority: getPriorityFromContribution(webviewEditorContribution, extension.description),
                        }));
                    }
                }
                this._onChange.fire();
            });
        }
        [Symbol.iterator]() {
            return this._editors.values();
        }
        get(viewType) {
            return viewType === exports.defaultCustomEditor.id
                ? exports.defaultCustomEditor
                : this._editors.get(viewType);
        }
        getContributedEditors(resource) {
            return Array.from(this._editors.values())
                .filter(customEditor => customEditor.matches(resource));
        }
        add(info) {
            if (info.id === exports.defaultCustomEditor.id || this._editors.has(info.id)) {
                console.error(`Custom editor with id '${info.id}' already registered`);
                return;
            }
            this._editors.set(info.id, info);
        }
    }
    exports.ContributedCustomEditors = ContributedCustomEditors;
    function getPriorityFromContribution(contribution, extension) {
        switch (contribution.priority) {
            case "default" /* default */:
            case "option" /* option */:
                return contribution.priority;
            case "builtin" /* builtin */:
                // Builtin is only valid for builtin extensions
                return extension.isBuiltin ? "builtin" /* builtin */ : "default" /* default */;
            default:
                return "default" /* default */;
        }
    }
});
//# sourceMappingURL=contributedCustomEditors.js.map