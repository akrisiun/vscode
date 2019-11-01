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
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/arrays", "vs/base/common/strings", "vs/base/common/types", "vs/platform/registry/common/platform", "vs/base/common/actions", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/workbench/common/editor", "vs/platform/quickOpen/common/quickOpen", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls, objects, arrays, strings, types, platform_1, actions_1, quickOpenModel_1, editor_1, quickOpen_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CLOSE_ON_FOCUS_LOST_CONFIG = 'workbench.quickOpen.closeOnFocusLost';
    exports.PRESERVE_INPUT_CONFIG = 'workbench.quickOpen.preserveInput';
    exports.SEARCH_EDITOR_HISTORY = 'search.quickOpen.includeHistory';
    class QuickOpenHandler {
        /**
         * A quick open handler returns results for a given input string. The resolved promise
         * returns an instance of quick open model. It is up to the handler to keep and reuse an
         * instance of the same model across multiple calls. This helps in situations where the user is
         * narrowing down a search and the model is just filtering some items out.
         *
         * As such, returning the same model instance across multiple searches will yield best
         * results in terms of performance when many items are shown.
         */
        getResults(searchValue, token) {
            return Promise.resolve(null);
        }
        /**
         * The ARIA label to apply when this quick open handler is active in quick open.
         */
        getAriaLabel() {
            return null;
        }
        /**
         * Extra CSS class name to add to the quick open widget to do custom styling of entries.
         */
        getClass() {
            return null;
        }
        /**
         * Indicates if the handler can run in the current environment. Return a string if the handler cannot run but has
         * a good message to show in this case.
         */
        canRun() {
            return true;
        }
        /**
         * Hints to the outside that this quick open handler typically returns results fast.
         */
        hasShortResponseTime() {
            return false;
        }
        /**
         * Indicates if the handler wishes the quick open widget to automatically select the first result entry or an entry
         * based on a specific prefix match.
         */
        getAutoFocus(searchValue, context) {
            return {};
        }
        /**
         * Indicates to the handler that the quick open widget has been opened.
         */
        onOpen() {
            return;
        }
        /**
         * Indicates to the handler that the quick open widget has been closed. Allows to free up any resources as needed.
         * The parameter canceled indicates if the quick open widget was closed with an entry being run or not.
         */
        onClose(canceled) {
            return;
        }
        /**
         * Allows to return a label that will be placed to the side of the results from this handler or null if none.
         */
        getGroupLabel() {
            return null;
        }
        /**
         * Allows to return a label that will be used when there are no results found
         */
        getEmptyLabel(searchString) {
            if (searchString.length > 0) {
                return nls.localize('noResultsMatching', "No results matching");
            }
            return nls.localize('noResultsFound2', "No results found");
        }
    }
    exports.QuickOpenHandler = QuickOpenHandler;
    /**
     * A lightweight descriptor of a quick open handler.
     */
    class QuickOpenHandlerDescriptor {
        constructor(ctor, id, prefix, contextKey, param, instantProgress = false) {
            this.ctor = ctor;
            this.id = id;
            this.prefix = prefix;
            this.contextKey = contextKey;
            this.instantProgress = instantProgress;
            if (types.isString(param)) {
                this.description = param;
            }
            else {
                this.helpEntries = param;
            }
        }
        getId() {
            return this.id;
        }
        instantiate(instantiationService) {
            return instantiationService.createInstance(this.ctor);
        }
    }
    exports.QuickOpenHandlerDescriptor = QuickOpenHandlerDescriptor;
    exports.Extensions = {
        Quickopen: 'workbench.contributions.quickopen'
    };
    class QuickOpenRegistry {
        constructor() {
            this.handlers = [];
        }
        registerQuickOpenHandler(descriptor) {
            this.handlers.push(descriptor);
            // sort the handlers by decreasing prefix length, such that longer
            // prefixes take priority: 'ext' vs 'ext install' - the latter should win
            this.handlers.sort((h1, h2) => h2.prefix.length - h1.prefix.length);
        }
        registerDefaultQuickOpenHandler(descriptor) {
            this.defaultHandler = descriptor;
        }
        getQuickOpenHandlers() {
            return this.handlers.slice(0);
        }
        getQuickOpenHandler(text) {
            return text ? (arrays.first(this.handlers, h => strings.startsWith(text, h.prefix)) || null) : null;
        }
        getDefaultQuickOpenHandler() {
            return this.defaultHandler;
        }
    }
    platform_1.Registry.add(exports.Extensions.Quickopen, new QuickOpenRegistry());
    /**
     * A subclass of quick open entry that will open an editor with input and options when running.
     */
    class EditorQuickOpenEntry extends quickOpenModel_1.QuickOpenEntry {
        constructor(_editorService) {
            super();
            this._editorService = _editorService;
        }
        get editorService() {
            return this._editorService;
        }
        getInput() {
            return undefined;
        }
        getOptions() {
            return undefined;
        }
        run(mode, context) {
            const hideWidget = (mode === 1 /* OPEN */);
            if (mode === 1 /* OPEN */ || mode === 2 /* OPEN_IN_BACKGROUND */) {
                const sideBySide = context.keymods.ctrlCmd;
                let openOptions;
                if (mode === 2 /* OPEN_IN_BACKGROUND */) {
                    openOptions = { pinned: true, preserveFocus: true };
                }
                else if (context.keymods.alt) {
                    openOptions = { pinned: true };
                }
                const input = this.getInput();
                if (input instanceof editor_1.EditorInput) {
                    let opts = this.getOptions();
                    if (opts) {
                        opts = objects.mixin(opts, openOptions, true);
                    }
                    else if (openOptions) {
                        opts = editor_1.EditorOptions.create(openOptions);
                    }
                    this.editorService.openEditor(input, types.withNullAsUndefined(opts), sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
                }
                else {
                    const resourceInput = input;
                    if (openOptions) {
                        resourceInput.options = objects.assign(resourceInput.options || Object.create(null), openOptions);
                    }
                    this.editorService.openEditor(resourceInput, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
                }
            }
            return hideWidget;
        }
    }
    exports.EditorQuickOpenEntry = EditorQuickOpenEntry;
    /**
     * A subclass of quick open entry group that provides access to editor input and options.
     */
    class EditorQuickOpenEntryGroup extends quickOpenModel_1.QuickOpenEntryGroup {
        getInput() {
            return undefined;
        }
        getOptions() {
            return undefined;
        }
    }
    exports.EditorQuickOpenEntryGroup = EditorQuickOpenEntryGroup;
    let QuickOpenAction = class QuickOpenAction extends actions_1.Action {
        constructor(id, label, prefix, quickOpenService) {
            super(id, label);
            this.quickOpenService = quickOpenService;
            this.prefix = prefix;
            this.enabled = !!this.quickOpenService;
        }
        run() {
            // Show with prefix
            this.quickOpenService.show(this.prefix);
            return Promise.resolve(undefined);
        }
    };
    QuickOpenAction = __decorate([
        __param(3, quickOpen_1.IQuickOpenService)
    ], QuickOpenAction);
    exports.QuickOpenAction = QuickOpenAction;
});
//# sourceMappingURL=quickopen.js.map