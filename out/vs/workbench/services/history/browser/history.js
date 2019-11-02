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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/uri", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/history/common/history", "vs/platform/files/common/files", "vs/editor/common/core/selection", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/platform/registry/common/platform", "vs/base/common/event", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorGroupsService", "vs/editor/browser/editorBrowser", "vs/workbench/services/search/common/search", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/resources", "vs/workbench/services/layout/browser/layoutService", "vs/platform/contextkey/common/contextkey", "vs/base/common/arrays", "vs/platform/instantiation/common/extensions", "vs/base/common/types", "vs/base/browser/dom", "vs/platform/workspaces/common/workspaces"], function (require, exports, errors_1, uri_1, editor_1, editorService_1, history_1, files_1, selection_1, workspace_1, lifecycle_1, storage_1, platform_1, event_1, configuration_1, editorGroupsService_1, editorBrowser_1, search_1, instantiation_1, resources_1, layoutService_1, contextkey_1, arrays_1, extensions_1, types_1, dom_1, workspaces_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Stores the selection & view state of an editor and allows to compare it to other selection states.
     */
    class TextEditorState {
        constructor(_editorInput, _selection) {
            this._editorInput = _editorInput;
            this._selection = _selection;
            this.textEditorSelection = selection_1.Selection.isISelection(_selection) ? {
                startLineNumber: _selection.startLineNumber,
                startColumn: _selection.startColumn
            } : undefined;
        }
        get editorInput() {
            return this._editorInput;
        }
        get selection() {
            return this.textEditorSelection;
        }
        justifiesNewPushState(other, event) {
            var _a;
            if (((_a = event) === null || _a === void 0 ? void 0 : _a.source) === 'api') {
                return true; // always let API source win (e.g. "Go to definition" should add a history entry)
            }
            if (!this._editorInput.matches(other._editorInput)) {
                return true; // different editor inputs
            }
            if (!selection_1.Selection.isISelection(this._selection) || !selection_1.Selection.isISelection(other._selection)) {
                return true; // unknown selections
            }
            const thisLineNumber = Math.min(this._selection.selectionStartLineNumber, this._selection.positionLineNumber);
            const otherLineNumber = Math.min(other._selection.selectionStartLineNumber, other._selection.positionLineNumber);
            if (Math.abs(thisLineNumber - otherLineNumber) < TextEditorState.EDITOR_SELECTION_THRESHOLD) {
                return false; // ignore selection changes in the range of EditorState.EDITOR_SELECTION_THRESHOLD lines
            }
            return true;
        }
    }
    exports.TextEditorState = TextEditorState;
    TextEditorState.EDITOR_SELECTION_THRESHOLD = 10; // number of lines to move in editor to justify for new state
    let HistoryService = class HistoryService extends lifecycle_1.Disposable {
        constructor(editorService, editorGroupService, contextService, storageService, configurationService, fileService, workspacesService, instantiationService, layoutService, contextKeyService) {
            super();
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.contextService = contextService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.fileService = fileService;
            this.workspacesService = workspacesService;
            this.instantiationService = instantiationService;
            this.layoutService = layoutService;
            this.contextKeyService = contextKeyService;
            this.activeEditorListeners = this._register(new lifecycle_1.DisposableStore());
            this.editorHistoryListeners = new Map();
            this.editorStackListeners = new Map();
            this.navigatingInStack = false;
            this.currentTextEditorState = null;
            this.history = [];
            this.canNavigateBackContextKey = (new contextkey_1.RawContextKey('canNavigateBack', false)).bindTo(this.contextKeyService);
            this.canNavigateForwardContextKey = (new contextkey_1.RawContextKey('canNavigateForward', false)).bindTo(this.contextKeyService);
            this.canNavigateToLastEditLocationContextKey = (new contextkey_1.RawContextKey('canNavigateToLastEditLocation', false)).bindTo(this.contextKeyService);
            this.index = -1;
            this.lastIndex = -1;
            this.stack = [];
            this.recentlyClosedFiles = [];
            this.loaded = false;
            this.resourceFilter = this._register(instantiationService.createInstance(resources_1.ResourceGlobMatcher, (root) => this.getExcludes(root), (event) => event.affectsConfiguration(files_1.FILES_EXCLUDE_CONFIG) || event.affectsConfiguration('search.exclude')));
            this.registerListeners();
        }
        getExcludes(root) {
            const scope = root ? { resource: root } : undefined;
            return search_1.getExcludes(scope ? this.configurationService.getValue(scope) : this.configurationService.getValue());
        }
        registerListeners() {
            this._register(this.editorService.onDidActiveEditorChange(() => this.onActiveEditorChanged()));
            this._register(this.editorService.onDidOpenEditorFail(event => this.remove(event.editor)));
            this._register(this.editorService.onDidCloseEditor(event => this.onEditorClosed(event)));
            this._register(this.storageService.onWillSaveState(() => this.saveState()));
            this._register(this.fileService.onFileChanges(event => this.onFileChanges(event)));
            this._register(this.resourceFilter.onExpressionChange(() => this.handleExcludesChange()));
            // if the service is created late enough that an editor is already opened
            // make sure to trigger the onActiveEditorChanged() to track the editor
            // properly (fixes https://github.com/Microsoft/vscode/issues/59908)
            if (this.editorService.activeControl) {
                this.onActiveEditorChanged();
            }
            // Mouse back/forward support
            const mouseBackForwardSupportListener = this._register(new lifecycle_1.DisposableStore());
            const handleMouseBackForwardSupport = () => {
                mouseBackForwardSupportListener.clear();
                if (this.configurationService.getValue('workbench.editor.mouseBackForwardToNavigate')) {
                    mouseBackForwardSupportListener.add(dom_1.addDisposableListener(this.layoutService.getWorkbenchElement(), dom_1.EventType.MOUSE_DOWN, e => this.onMouseDown(e)));
                }
            };
            this._register(this.configurationService.onDidChangeConfiguration(event => {
                if (event.affectsConfiguration('workbench.editor.mouseBackForwardToNavigate')) {
                    handleMouseBackForwardSupport();
                }
            }));
            handleMouseBackForwardSupport();
        }
        onMouseDown(e) {
            // Support to navigate in history when mouse buttons 4/5 are pressed
            switch (e.button) {
                case 3:
                    dom_1.EventHelper.stop(e);
                    this.back();
                    break;
                case 4:
                    dom_1.EventHelper.stop(e);
                    this.forward();
                    break;
            }
        }
        onActiveEditorChanged() {
            var _a;
            const activeControl = this.editorService.activeControl;
            if (this.lastActiveEditor && this.matchesEditor(this.lastActiveEditor, activeControl)) {
                return; // return if the active editor is still the same
            }
            // Remember as last active editor (can be undefined if none opened)
            this.lastActiveEditor = ((_a = activeControl) === null || _a === void 0 ? void 0 : _a.input) && activeControl.group ? { editor: activeControl.input, groupId: activeControl.group.id } : undefined;
            // Dispose old listeners
            this.activeEditorListeners.clear();
            // Propagate to history
            this.handleActiveEditorChange(activeControl);
            // Apply listener for selection changes if this is a text editor
            const activeTextEditorWidget = editorBrowser_1.getCodeEditor(this.editorService.activeTextEditorWidget);
            const activeEditor = this.editorService.activeEditor;
            if (activeTextEditorWidget) {
                // Debounce the event with a timeout of 0ms so that multiple calls to
                // editor.setSelection() are folded into one. We do not want to record
                // subsequent history navigations for such API calls.
                this.activeEditorListeners.add(event_1.Event.debounce(activeTextEditorWidget.onDidChangeCursorPosition, (last, event) => event, 0)((event => {
                    this.handleEditorSelectionChangeEvent(activeControl, event);
                })));
                // Track the last edit location by tracking model content change events
                // Use a debouncer to make sure to capture the correct cursor position
                // after the model content has changed.
                this.activeEditorListeners.add(event_1.Event.debounce(activeTextEditorWidget.onDidChangeModelContent, (last, event) => event, 0)((event => {
                    if (activeEditor) {
                        this.rememberLastEditLocation(activeEditor, activeTextEditorWidget);
                    }
                })));
            }
        }
        rememberLastEditLocation(activeEditor, activeTextEditorWidget) {
            this.lastEditLocation = { input: activeEditor };
            this.canNavigateToLastEditLocationContextKey.set(true);
            const position = activeTextEditorWidget.getPosition();
            if (position) {
                this.lastEditLocation.selection = {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column
                };
            }
        }
        matchesEditor(identifier, editor) {
            if (!editor || !editor.group) {
                return false;
            }
            if (identifier.groupId !== editor.group.id) {
                return false;
            }
            return identifier.editor.matches(editor.input);
        }
        onFileChanges(e) {
            if (e.gotDeleted()) {
                this.remove(e); // remove from history files that got deleted or moved
            }
        }
        onEditorClosed(event) {
            // Track closing of editor to support to reopen closed editors (unless editor was replaced)
            if (!event.replaced) {
                const resource = event.editor ? event.editor.getResource() : undefined;
                const supportsReopen = resource && this.fileService.canHandleResource(resource); // we only support file'ish things to reopen
                if (resource && supportsReopen) {
                    // Remove all inputs matching and add as last recently closed
                    this.removeFromRecentlyClosedFiles(event.editor);
                    this.recentlyClosedFiles.push({ resource, index: event.index });
                    // Bounding
                    if (this.recentlyClosedFiles.length > HistoryService.MAX_RECENTLY_CLOSED_EDITORS) {
                        this.recentlyClosedFiles.shift();
                    }
                }
            }
        }
        reopenLastClosedEditor() {
            this.ensureHistoryLoaded();
            let lastClosedFile = this.recentlyClosedFiles.pop();
            while (lastClosedFile && this.isFileOpened(lastClosedFile.resource, this.editorGroupService.activeGroup)) {
                lastClosedFile = this.recentlyClosedFiles.pop(); // pop until we find a file that is not opened
            }
            if (lastClosedFile) {
                this.editorService.openEditor({ resource: lastClosedFile.resource, options: { pinned: true, index: lastClosedFile.index } }).then(editor => {
                    // Fix for https://github.com/Microsoft/vscode/issues/67882
                    // If opening of the editor fails, make sure to try the next one
                    // but make sure to remove this one from the list to prevent
                    // endless loops.
                    if (!editor) {
                        this.recentlyClosedFiles.pop();
                        this.reopenLastClosedEditor();
                    }
                });
            }
        }
        openLastEditLocation() {
            if (this.lastEditLocation) {
                this.doNavigate(this.lastEditLocation, true);
            }
        }
        forward(acrossEditors) {
            if (this.stack.length > this.index + 1) {
                if (acrossEditors) {
                    this.doForwardAcrossEditors();
                }
                else {
                    this.doForwardInEditors();
                }
            }
        }
        doForwardInEditors() {
            this.setIndex(this.index + 1);
            this.navigate();
        }
        setIndex(value) {
            this.lastIndex = this.index;
            this.index = value;
            this.updateContextKeys();
        }
        doForwardAcrossEditors() {
            let currentIndex = this.index;
            const currentEntry = this.stack[this.index];
            // Find the next entry that does not match our current entry
            while (this.stack.length > currentIndex + 1) {
                currentIndex++;
                const previousEntry = this.stack[currentIndex];
                if (!this.matches(currentEntry.input, previousEntry.input)) {
                    this.setIndex(currentIndex);
                    this.navigate(true /* across editors */);
                    break;
                }
            }
        }
        back(acrossEditors) {
            if (this.index > 0) {
                if (acrossEditors) {
                    this.doBackAcrossEditors();
                }
                else {
                    this.doBackInEditors();
                }
            }
        }
        last() {
            if (this.lastIndex === -1) {
                this.back();
            }
            else {
                this.setIndex(this.lastIndex);
                this.navigate();
            }
        }
        doBackInEditors() {
            this.setIndex(this.index - 1);
            this.navigate();
        }
        doBackAcrossEditors() {
            let currentIndex = this.index;
            const currentEntry = this.stack[this.index];
            // Find the next previous entry that does not match our current entry
            while (currentIndex > 0) {
                currentIndex--;
                const previousEntry = this.stack[currentIndex];
                if (!this.matches(currentEntry.input, previousEntry.input)) {
                    this.setIndex(currentIndex);
                    this.navigate(true /* across editors */);
                    break;
                }
            }
        }
        clear() {
            this.ensureHistoryLoaded();
            // Navigation (next, previous)
            this.index = -1;
            this.lastIndex = -1;
            this.stack.splice(0);
            this.editorStackListeners.forEach(listeners => lifecycle_1.dispose(listeners));
            this.editorStackListeners.clear();
            // Closed files
            this.recentlyClosedFiles = [];
            // History
            this.clearRecentlyOpened();
            this.updateContextKeys();
        }
        clearRecentlyOpened() {
            this.history = [];
            this.editorHistoryListeners.forEach(listeners => lifecycle_1.dispose(listeners));
            this.editorHistoryListeners.clear();
        }
        updateContextKeys() {
            this.canNavigateBackContextKey.set(this.stack.length > 0 && this.index > 0);
            this.canNavigateForwardContextKey.set(this.stack.length > 0 && this.index < this.stack.length - 1);
        }
        navigate(acrossEditors) {
            this.navigatingInStack = true;
            this.doNavigate(this.stack[this.index], !acrossEditors).finally(() => this.navigatingInStack = false);
        }
        doNavigate(location, withSelection) {
            const options = {
                revealIfOpened: true // support to navigate across editor groups
            };
            // Unless we navigate across editors, support selection and
            // minimize scrolling by setting revealInCenterIfOutsideViewport
            if (location.selection && withSelection) {
                options.selection = location.selection;
                options.revealInCenterIfOutsideViewport = true;
            }
            if (location.input instanceof editor_1.EditorInput) {
                return this.editorService.openEditor(location.input, options);
            }
            return this.editorService.openEditor({ resource: location.input.resource, options });
        }
        handleEditorSelectionChangeEvent(editor, event) {
            this.handleEditorEventInStack(editor, event);
        }
        handleActiveEditorChange(editor) {
            this.handleEditorEventInHistory(editor);
            this.handleEditorEventInStack(editor);
        }
        handleEditorEventInHistory(editor) {
            var _a;
            const input = (_a = editor) === null || _a === void 0 ? void 0 : _a.input;
            // Ensure we have at least a name to show and not configured to exclude input
            if (!input || !input.getName() || !this.include(input)) {
                return;
            }
            this.ensureHistoryLoaded();
            const historyInput = this.preferResourceInput(input);
            // Remove any existing entry and add to the beginning
            this.removeFromHistory(input);
            this.history.unshift(historyInput);
            // Respect max entries setting
            if (this.history.length > HistoryService.MAX_HISTORY_ITEMS) {
                this.clearOnEditorDispose(this.history.pop(), this.editorHistoryListeners);
            }
            // Remove this from the history unless the history input is a resource
            // that can easily be restored even when the input gets disposed
            if (historyInput instanceof editor_1.EditorInput) {
                this.onEditorDispose(historyInput, () => this.removeFromHistory(historyInput), this.editorHistoryListeners);
            }
        }
        onEditorDispose(editor, listener, mapEditorToDispose) {
            const toDispose = event_1.Event.once(editor.onDispose)(() => listener());
            let disposables = mapEditorToDispose.get(editor);
            if (!disposables) {
                disposables = new lifecycle_1.DisposableStore();
                mapEditorToDispose.set(editor, disposables);
            }
            disposables.add(toDispose);
        }
        clearOnEditorDispose(editor, mapEditorToDispose) {
            if (editor instanceof editor_1.EditorInput) {
                const disposables = mapEditorToDispose.get(editor);
                if (disposables) {
                    lifecycle_1.dispose(disposables);
                    mapEditorToDispose.delete(editor);
                }
            }
        }
        include(input) {
            if (input instanceof editor_1.EditorInput) {
                return true; // include any non files
            }
            const resourceInput = input;
            return !this.resourceFilter.matches(resourceInput.resource);
        }
        handleExcludesChange() {
            this.removeExcludedFromHistory();
        }
        remove(arg1) {
            this.removeFromHistory(arg1);
            this.removeFromStack(arg1);
            this.removeFromRecentlyClosedFiles(arg1);
            this.removeFromRecentlyOpened(arg1);
        }
        removeExcludedFromHistory() {
            this.ensureHistoryLoaded();
            this.history = this.history.filter(e => {
                const include = this.include(e);
                // Cleanup any listeners associated with the input when removing from history
                if (!include) {
                    this.clearOnEditorDispose(e, this.editorHistoryListeners);
                }
                return include;
            });
        }
        removeFromHistory(arg1) {
            this.ensureHistoryLoaded();
            this.history = this.history.filter(e => {
                const matches = this.matches(arg1, e);
                // Cleanup any listeners associated with the input when removing from history
                if (matches) {
                    this.clearOnEditorDispose(arg1, this.editorHistoryListeners);
                }
                return !matches;
            });
        }
        handleEditorEventInStack(control, event) {
            var _a, _b, _c;
            const codeEditor = control ? editorBrowser_1.getCodeEditor(control.getControl()) : undefined;
            // treat editor changes that happen as part of stack navigation specially
            // we do not want to add a new stack entry as a matter of navigating the
            // stack but we need to keep our currentTextEditorState up to date with
            // the navigtion that occurs.
            if (this.navigatingInStack) {
                if (codeEditor && ((_a = control) === null || _a === void 0 ? void 0 : _a.input)) {
                    this.currentTextEditorState = new TextEditorState(control.input, codeEditor.getSelection());
                }
                else {
                    this.currentTextEditorState = null; // we navigated to a non text editor
                }
            }
            // normal navigation not part of history navigation
            else {
                // navigation inside text editor
                if (codeEditor && ((_b = control) === null || _b === void 0 ? void 0 : _b.input)) {
                    this.handleTextEditorEvent(control, codeEditor, event);
                }
                // navigation to non-text editor
                else {
                    this.currentTextEditorState = null; // at this time we have no active text editor view state
                    if ((_c = control) === null || _c === void 0 ? void 0 : _c.input) {
                        this.handleNonTextEditorEvent(control);
                    }
                }
            }
        }
        handleTextEditorEvent(editor, editorControl, event) {
            if (!editor.input) {
                return;
            }
            const stateCandidate = new TextEditorState(editor.input, editorControl.getSelection());
            // Add to stack if we dont have a current state or this new state justifies a push
            if (!this.currentTextEditorState || this.currentTextEditorState.justifiesNewPushState(stateCandidate, event)) {
                this.add(editor.input, stateCandidate.selection);
            }
            // Otherwise we replace the current stack entry with this one
            else {
                this.replace(editor.input, stateCandidate.selection);
            }
            // Update our current text editor state
            this.currentTextEditorState = stateCandidate;
        }
        handleNonTextEditorEvent(editor) {
            if (!editor.input) {
                return;
            }
            const currentStack = this.stack[this.index];
            if (currentStack && this.matches(editor.input, currentStack.input)) {
                return; // do not push same editor input again
            }
            this.add(editor.input);
        }
        add(input, selection) {
            if (!this.navigatingInStack) {
                this.addOrReplaceInStack(input, selection);
            }
        }
        replace(input, selection) {
            if (!this.navigatingInStack) {
                this.addOrReplaceInStack(input, selection, true /* force replace */);
            }
        }
        addOrReplaceInStack(input, selection, forceReplace) {
            // Overwrite an entry in the stack if we have a matching input that comes
            // with editor options to indicate that this entry is more specific. Also
            // prevent entries that have the exact same options. Finally, Overwrite
            // entries if we detect that the change came in very fast which indicates
            // that it was not coming in from a user change but rather rapid programmatic
            // changes. We just take the last of the changes to not cause too many entries
            // on the stack.
            // We can also be instructed to force replace the last entry.
            let replace = false;
            const currentEntry = this.stack[this.index];
            if (currentEntry) {
                if (forceReplace) {
                    replace = true; // replace if we are forced to
                }
                else if (this.matches(input, currentEntry.input) && this.sameSelection(currentEntry.selection, selection)) {
                    replace = true; // replace if the input is the same as the current one and the selection as well
                }
            }
            const stackInput = this.preferResourceInput(input);
            const entry = { input: stackInput, selection };
            // Replace at current position
            let removedEntries = [];
            if (replace) {
                removedEntries.push(this.stack[this.index]);
                this.stack[this.index] = entry;
            }
            // Add to stack at current position
            else {
                // If we are not at the end of history, we remove anything after
                if (this.stack.length > this.index + 1) {
                    for (let i = this.index + 1; i < this.stack.length; i++) {
                        removedEntries.push(this.stack[i]);
                    }
                    this.stack = this.stack.slice(0, this.index + 1);
                }
                // Insert entry at index
                this.stack.splice(this.index + 1, 0, entry);
                // Check for limit
                if (this.stack.length > HistoryService.MAX_STACK_ITEMS) {
                    removedEntries.push(this.stack.shift()); // remove first
                    if (this.lastIndex >= 0) {
                        this.lastIndex--;
                    }
                }
                else {
                    this.setIndex(this.index + 1);
                }
            }
            // Clear editor listeners from removed entries
            removedEntries.forEach(removedEntry => this.clearOnEditorDispose(removedEntry.input, this.editorStackListeners));
            // Remove this from the stack unless the stack input is a resource
            // that can easily be restored even when the input gets disposed
            if (stackInput instanceof editor_1.EditorInput) {
                this.onEditorDispose(stackInput, () => this.removeFromStack(stackInput), this.editorStackListeners);
            }
            // Context
            this.updateContextKeys();
        }
        preferResourceInput(input) {
            const resource = input.getResource();
            if (resource && this.fileService.canHandleResource(resource)) {
                return { resource: resource };
            }
            return input;
        }
        sameSelection(selectionA, selectionB) {
            if (!selectionA && !selectionB) {
                return true;
            }
            if (!selectionA || !selectionB) {
                return false;
            }
            return selectionA.startLineNumber === selectionB.startLineNumber; // we consider the history entry same if we are on the same line
        }
        removeFromStack(arg1) {
            this.stack = this.stack.filter(e => {
                const matches = this.matches(arg1, e.input);
                // Cleanup any listeners associated with the input when removing
                if (matches) {
                    this.clearOnEditorDispose(arg1, this.editorStackListeners);
                }
                return !matches;
            });
            this.index = this.stack.length - 1; // reset index
            this.lastIndex = -1;
            this.updateContextKeys();
        }
        removeFromRecentlyClosedFiles(arg1) {
            this.recentlyClosedFiles = this.recentlyClosedFiles.filter(e => !this.matchesFile(e.resource, arg1));
        }
        removeFromRecentlyOpened(arg1) {
            if (arg1 instanceof editor_1.EditorInput || arg1 instanceof files_1.FileChangesEvent) {
                return; // for now do not delete from file events since recently open are likely out of workspace files for which there are no delete events
            }
            const input = arg1;
            this.workspacesService.removeFromRecentlyOpened([input.resource]);
        }
        isFileOpened(resource, group) {
            if (!group) {
                return false;
            }
            if (!this.editorService.isOpen({ resource }, group)) {
                return false; // fast check
            }
            return group.editors.some(e => this.matchesFile(resource, e));
        }
        matches(arg1, inputB) {
            if (arg1 instanceof files_1.FileChangesEvent) {
                if (inputB instanceof editor_1.EditorInput) {
                    return false; // we only support this for IResourceInput
                }
                const resourceInputB = inputB;
                return arg1.contains(resourceInputB.resource, 2 /* DELETED */);
            }
            if (arg1 instanceof editor_1.EditorInput && inputB instanceof editor_1.EditorInput) {
                return arg1.matches(inputB);
            }
            if (arg1 instanceof editor_1.EditorInput) {
                return this.matchesFile(inputB.resource, arg1);
            }
            if (inputB instanceof editor_1.EditorInput) {
                return this.matchesFile(arg1.resource, inputB);
            }
            const resourceInputA = arg1;
            const resourceInputB = inputB;
            return resourceInputA && resourceInputB && resourceInputA.resource.toString() === resourceInputB.resource.toString();
        }
        matchesFile(resource, arg2) {
            var _a;
            if (arg2 instanceof files_1.FileChangesEvent) {
                return arg2.contains(resource, 2 /* DELETED */);
            }
            if (arg2 instanceof editor_1.EditorInput) {
                const inputResource = arg2.getResource();
                if (!inputResource) {
                    return false;
                }
                if (this.layoutService.isRestored() && !this.fileService.canHandleResource(inputResource)) {
                    return false; // make sure to only check this when workbench has restored (for https://github.com/Microsoft/vscode/issues/48275)
                }
                return inputResource.toString() === resource.toString();
            }
            const resourceInput = arg2;
            return ((_a = resourceInput) === null || _a === void 0 ? void 0 : _a.resource.toString()) === resource.toString();
        }
        getHistory() {
            this.ensureHistoryLoaded();
            return this.history.slice(0);
        }
        ensureHistoryLoaded() {
            if (!this.loaded) {
                this.loadHistory();
            }
            this.loaded = true;
        }
        saveState() {
            if (!this.history) {
                return; // nothing to save because history was not used
            }
            const registry = platform_1.Registry.as(editor_1.Extensions.EditorInputFactories);
            const entries = arrays_1.coalesce(this.history.map((input) => {
                // Editor input: try via factory
                if (input instanceof editor_1.EditorInput) {
                    const factory = registry.getEditorInputFactory(input.getTypeId());
                    if (factory) {
                        const deserialized = factory.serialize(input);
                        if (deserialized) {
                            return { editorInputJSON: { typeId: input.getTypeId(), deserialized } };
                        }
                    }
                }
                // File resource: via URI.toJSON()
                else {
                    return { resourceJSON: input.resource.toJSON() };
                }
                return undefined;
            }));
            this.storageService.store(HistoryService.STORAGE_KEY, JSON.stringify(entries), 1 /* WORKSPACE */);
        }
        loadHistory() {
            let entries = [];
            const entriesRaw = this.storageService.get(HistoryService.STORAGE_KEY, 1 /* WORKSPACE */);
            if (entriesRaw) {
                entries = arrays_1.coalesce(JSON.parse(entriesRaw));
            }
            const registry = platform_1.Registry.as(editor_1.Extensions.EditorInputFactories);
            this.history = arrays_1.coalesce(entries.map(entry => {
                try {
                    return this.safeLoadHistoryEntry(registry, entry);
                }
                catch (error) {
                    errors_1.onUnexpectedError(error);
                    return undefined; // https://github.com/Microsoft/vscode/issues/60960
                }
            }));
        }
        safeLoadHistoryEntry(registry, entry) {
            var _a;
            const serializedEditorHistoryEntry = entry;
            // File resource: via URI.revive()
            if (serializedEditorHistoryEntry.resourceJSON) {
                return { resource: uri_1.URI.revive(serializedEditorHistoryEntry.resourceJSON) };
            }
            // Editor input: via factory
            const { editorInputJSON } = serializedEditorHistoryEntry;
            if ((_a = editorInputJSON) === null || _a === void 0 ? void 0 : _a.deserialized) {
                const factory = registry.getEditorInputFactory(editorInputJSON.typeId);
                if (factory) {
                    const input = factory.deserialize(this.instantiationService, editorInputJSON.deserialized);
                    if (input) {
                        this.onEditorDispose(input, () => this.removeFromHistory(input), this.editorHistoryListeners);
                    }
                    return types_1.withNullAsUndefined(input);
                }
            }
            return undefined;
        }
        getLastActiveWorkspaceRoot(schemeFilter) {
            // No Folder: return early
            const folders = this.contextService.getWorkspace().folders;
            if (folders.length === 0) {
                return undefined;
            }
            // Single Folder: return early
            if (folders.length === 1) {
                const resource = folders[0].uri;
                if (!schemeFilter || resource.scheme === schemeFilter) {
                    return resource;
                }
                return undefined;
            }
            // Multiple folders: find the last active one
            const history = this.getHistory();
            for (const input of history) {
                if (input instanceof editor_1.EditorInput) {
                    continue;
                }
                const resourceInput = input;
                if (schemeFilter && resourceInput.resource.scheme !== schemeFilter) {
                    continue;
                }
                const resourceWorkspace = this.contextService.getWorkspaceFolder(resourceInput.resource);
                if (resourceWorkspace) {
                    return resourceWorkspace.uri;
                }
            }
            // fallback to first workspace matching scheme filter if any
            for (const folder of folders) {
                const resource = folder.uri;
                if (!schemeFilter || resource.scheme === schemeFilter) {
                    return resource;
                }
            }
            return undefined;
        }
        getLastActiveFile(filterByScheme) {
            var _a;
            const history = this.getHistory();
            for (const input of history) {
                let resource;
                if (input instanceof editor_1.EditorInput) {
                    resource = editor_1.toResource(input, { filterByScheme });
                }
                else {
                    resource = input.resource;
                }
                if (((_a = resource) === null || _a === void 0 ? void 0 : _a.scheme) === filterByScheme) {
                    return resource;
                }
            }
            return undefined;
        }
    };
    HistoryService.STORAGE_KEY = 'history.entries';
    HistoryService.MAX_HISTORY_ITEMS = 200;
    HistoryService.MAX_STACK_ITEMS = 50;
    HistoryService.MAX_RECENTLY_CLOSED_EDITORS = 20;
    HistoryService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, files_1.IFileService),
        __param(6, workspaces_1.IWorkspacesService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, layoutService_1.IWorkbenchLayoutService),
        __param(9, contextkey_1.IContextKeyService)
    ], HistoryService);
    exports.HistoryService = HistoryService;
    extensions_1.registerSingleton(history_1.IHistoryService, HistoryService);
});
//# sourceMappingURL=history.js.map