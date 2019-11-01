/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/platform/registry/common/platform", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/workbench/browser/quickopen", "vs/platform/quickOpen/common/quickOpen"], function (require, exports, nls, types, platform_1, quickOpenModel_1, quickopen_1, quickOpen_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HELP_PREFIX = '?';
    class HelpEntry extends quickOpenModel_1.QuickOpenEntryGroup {
        constructor(prefix, description, quickOpenService, openOnPreview) {
            super();
            if (!prefix) {
                this.prefix = '';
                this.prefixLabel = '\u2026' /* ... */;
            }
            else {
                this.prefix = this.prefixLabel = prefix;
            }
            this.description = description;
            this.quickOpenService = quickOpenService;
            this.openOnPreview = openOnPreview;
        }
        getLabel() {
            return this.prefixLabel;
        }
        getAriaLabel() {
            return nls.localize('entryAriaLabel', "{0}, picker help", this.getLabel());
        }
        getDescription() {
            return this.description;
        }
        run(mode, context) {
            if (mode === 1 /* OPEN */ || this.openOnPreview) {
                this.quickOpenService.show(this.prefix);
            }
            return false;
        }
    }
    let HelpHandler = class HelpHandler extends quickopen_1.QuickOpenHandler {
        constructor(quickOpenService) {
            super();
            this.quickOpenService = quickOpenService;
        }
        getResults(searchValue, token) {
            searchValue = searchValue.trim();
            const registry = (platform_1.Registry.as(quickopen_1.Extensions.Quickopen));
            const handlerDescriptors = registry.getQuickOpenHandlers();
            const defaultHandler = registry.getDefaultQuickOpenHandler();
            if (defaultHandler) {
                handlerDescriptors.push(defaultHandler);
            }
            const workbenchScoped = [];
            const editorScoped = [];
            const matchingHandlers = [];
            handlerDescriptors.sort((h1, h2) => h1.prefix.localeCompare(h2.prefix)).forEach(handlerDescriptor => {
                if (handlerDescriptor.prefix !== exports.HELP_PREFIX) {
                    // Descriptor has multiple help entries
                    if (types.isArray(handlerDescriptor.helpEntries)) {
                        for (const helpEntry of handlerDescriptor.helpEntries) {
                            if (helpEntry.prefix.indexOf(searchValue) === 0) {
                                matchingHandlers.push(helpEntry);
                            }
                        }
                    }
                    // Single Help entry for descriptor
                    else if (handlerDescriptor.prefix.indexOf(searchValue) === 0) {
                        matchingHandlers.push(handlerDescriptor);
                    }
                }
            });
            matchingHandlers.forEach(handler => {
                if (handler instanceof quickopen_1.QuickOpenHandlerDescriptor) {
                    workbenchScoped.push(new HelpEntry(handler.prefix, handler.description, this.quickOpenService, matchingHandlers.length === 1));
                }
                else {
                    const entry = new HelpEntry(handler.prefix, handler.description, this.quickOpenService, matchingHandlers.length === 1);
                    if (handler.needsEditor) {
                        editorScoped.push(entry);
                    }
                    else {
                        workbenchScoped.push(entry);
                    }
                }
            });
            // Add separator for workbench scoped handlers
            if (workbenchScoped.length > 0) {
                workbenchScoped[0].setGroupLabel(nls.localize('globalCommands', "global commands"));
            }
            // Add separator for editor scoped handlers
            if (editorScoped.length > 0) {
                editorScoped[0].setGroupLabel(nls.localize('editorCommands', "editor commands"));
                if (workbenchScoped.length > 0) {
                    editorScoped[0].setShowBorder(true);
                }
            }
            return Promise.resolve(new quickOpenModel_1.QuickOpenModel([...workbenchScoped, ...editorScoped]));
        }
        getAutoFocus(searchValue) {
            searchValue = searchValue.trim();
            return {
                autoFocusFirstEntry: searchValue.length > 0,
                autoFocusPrefixMatch: searchValue
            };
        }
    };
    HelpHandler.ID = 'workbench.picker.help';
    HelpHandler = __decorate([
        __param(0, quickOpen_1.IQuickOpenService)
    ], HelpHandler);
    exports.HelpHandler = HelpHandler;
});
//# sourceMappingURL=helpHandler.js.map