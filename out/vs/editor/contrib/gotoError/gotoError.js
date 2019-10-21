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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/markers/common/markers", "vs/editor/common/core/range", "vs/editor/browser/editorExtensions", "vs/platform/theme/common/themeService", "vs/editor/common/editorContextKeys", "vs/platform/keybinding/common/keybindingsRegistry", "./gotoErrorWidget", "vs/base/common/strings", "vs/base/common/arrays", "vs/editor/browser/services/codeEditorService", "vs/base/common/errors", "vs/platform/actions/common/actions", "vs/base/common/actions", "vs/platform/keybinding/common/keybinding", "vs/base/common/resources"], function (require, exports, nls, event_1, lifecycle_1, contextkey_1, markers_1, range_1, editorExtensions_1, themeService_1, editorContextKeys_1, keybindingsRegistry_1, gotoErrorWidget_1, strings_1, arrays_1, codeEditorService_1, errors_1, actions_1, actions_2, keybinding_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MarkerModel {
        constructor(editor, markers) {
            this._toUnbind = new lifecycle_1.DisposableStore();
            this._editor = editor;
            this._markers = [];
            this._nextIdx = -1;
            this._ignoreSelectionChange = false;
            this._onCurrentMarkerChanged = new event_1.Emitter();
            this._onMarkerSetChanged = new event_1.Emitter();
            this.setMarkers(markers);
            // listen on editor
            this._toUnbind.add(this._editor.onDidDispose(() => this.dispose()));
            this._toUnbind.add(this._editor.onDidChangeCursorPosition(() => {
                if (this._ignoreSelectionChange) {
                    return;
                }
                if (this.currentMarker && this._editor.getPosition() && range_1.Range.containsPosition(this.currentMarker, this._editor.getPosition())) {
                    return;
                }
                this._nextIdx = -1;
            }));
        }
        get onCurrentMarkerChanged() {
            return this._onCurrentMarkerChanged.event;
        }
        get onMarkerSetChanged() {
            return this._onMarkerSetChanged.event;
        }
        setMarkers(markers) {
            let oldMarker = this._nextIdx >= 0 ? this._markers[this._nextIdx] : undefined;
            this._markers = markers || [];
            this._markers.sort(MarkerNavigationAction.compareMarker);
            if (!oldMarker) {
                this._nextIdx = -1;
            }
            else {
                this._nextIdx = Math.max(-1, arrays_1.binarySearch(this._markers, oldMarker, MarkerNavigationAction.compareMarker));
            }
            this._onMarkerSetChanged.fire(this);
        }
        withoutWatchingEditorPosition(callback) {
            this._ignoreSelectionChange = true;
            try {
                callback();
            }
            finally {
                this._ignoreSelectionChange = false;
            }
        }
        _initIdx(fwd) {
            let found = false;
            const position = this._editor.getPosition();
            for (let i = 0; i < this._markers.length; i++) {
                let range = range_1.Range.lift(this._markers[i]);
                if (range.isEmpty() && this._editor.getModel()) {
                    const word = this._editor.getModel().getWordAtPosition(range.getStartPosition());
                    if (word) {
                        range = new range_1.Range(range.startLineNumber, word.startColumn, range.startLineNumber, word.endColumn);
                    }
                }
                if (position && (range.containsPosition(position) || position.isBeforeOrEqual(range.getStartPosition()))) {
                    this._nextIdx = i;
                    found = true;
                    break;
                }
            }
            if (!found) {
                // after the last change
                this._nextIdx = fwd ? 0 : this._markers.length - 1;
            }
            if (this._nextIdx < 0) {
                this._nextIdx = this._markers.length - 1;
            }
        }
        get currentMarker() {
            return this.canNavigate() ? this._markers[this._nextIdx] : undefined;
        }
        set currentMarker(marker) {
            const idx = this._nextIdx;
            this._nextIdx = -1;
            if (marker) {
                this._nextIdx = this.indexOf(marker);
            }
            if (this._nextIdx !== idx) {
                this._onCurrentMarkerChanged.fire(marker);
            }
        }
        move(fwd, inCircles) {
            if (!this.canNavigate()) {
                this._onCurrentMarkerChanged.fire(undefined);
                return !inCircles;
            }
            let oldIdx = this._nextIdx;
            let atEdge = false;
            if (this._nextIdx === -1) {
                this._initIdx(fwd);
            }
            else if (fwd) {
                if (inCircles || this._nextIdx + 1 < this._markers.length) {
                    this._nextIdx = (this._nextIdx + 1) % this._markers.length;
                }
                else {
                    atEdge = true;
                }
            }
            else if (!fwd) {
                if (inCircles || this._nextIdx > 0) {
                    this._nextIdx = (this._nextIdx - 1 + this._markers.length) % this._markers.length;
                }
                else {
                    atEdge = true;
                }
            }
            if (oldIdx !== this._nextIdx) {
                const marker = this._markers[this._nextIdx];
                this._onCurrentMarkerChanged.fire(marker);
            }
            return atEdge;
        }
        canNavigate() {
            return this._markers.length > 0;
        }
        findMarkerAtPosition(pos) {
            return arrays_1.find(this._markers, marker => range_1.Range.containsPosition(marker, pos));
        }
        get total() {
            return this._markers.length;
        }
        indexOf(marker) {
            return 1 + this._markers.indexOf(marker);
        }
        dispose() {
            this._toUnbind.dispose();
        }
    }
    let MarkerController = class MarkerController {
        constructor(editor, _markerService, _contextKeyService, _themeService, _editorService, _keybindingService) {
            this._markerService = _markerService;
            this._contextKeyService = _contextKeyService;
            this._themeService = _themeService;
            this._editorService = _editorService;
            this._keybindingService = _keybindingService;
            this._model = null;
            this._widget = null;
            this._disposeOnClose = new lifecycle_1.DisposableStore();
            this._editor = editor;
            this._widgetVisible = CONTEXT_MARKERS_NAVIGATION_VISIBLE.bindTo(this._contextKeyService);
        }
        static get(editor) {
            return editor.getContribution(MarkerController.ID);
        }
        dispose() {
            this._cleanUp();
            this._disposeOnClose.dispose();
        }
        _cleanUp() {
            this._widgetVisible.reset();
            this._disposeOnClose.clear();
            this._widget = null;
            this._model = null;
        }
        getOrCreateModel() {
            if (this._model) {
                return this._model;
            }
            const markers = this._getMarkers();
            this._model = new MarkerModel(this._editor, markers);
            this._markerService.onMarkerChanged(this._onMarkerChanged, this, this._disposeOnClose);
            const prevMarkerKeybinding = this._keybindingService.lookupKeybinding(PrevMarkerAction.ID);
            const nextMarkerKeybinding = this._keybindingService.lookupKeybinding(NextMarkerAction.ID);
            const actions = [
                new actions_2.Action(PrevMarkerAction.ID, PrevMarkerAction.LABEL + (prevMarkerKeybinding ? ` (${prevMarkerKeybinding.getLabel()})` : ''), 'show-previous-problem codicon-chevron-up', this._model.canNavigate(), async () => { if (this._model) {
                    this._model.move(false, true);
                } }),
                new actions_2.Action(NextMarkerAction.ID, NextMarkerAction.LABEL + (nextMarkerKeybinding ? ` (${nextMarkerKeybinding.getLabel()})` : ''), 'show-next-problem codicon-chevron-down', this._model.canNavigate(), async () => { if (this._model) {
                    this._model.move(true, true);
                } })
            ];
            this._widget = new gotoErrorWidget_1.MarkerNavigationWidget(this._editor, actions, this._themeService);
            this._widgetVisible.set(true);
            this._widget.onDidClose(() => this._cleanUp(), this, this._disposeOnClose);
            this._disposeOnClose.add(this._model);
            this._disposeOnClose.add(this._widget);
            for (const action of actions) {
                this._disposeOnClose.add(action);
            }
            this._disposeOnClose.add(this._widget.onDidSelectRelatedInformation(related => {
                this._editorService.openCodeEditor({
                    resource: related.resource,
                    options: { pinned: true, revealIfOpened: true, selection: range_1.Range.lift(related).collapseToStart() }
                }, this._editor).then(undefined, errors_1.onUnexpectedError);
                this.closeMarkersNavigation(false);
            }));
            this._disposeOnClose.add(this._editor.onDidChangeModel(() => this._cleanUp()));
            this._disposeOnClose.add(this._model.onCurrentMarkerChanged(marker => {
                if (!marker || !this._model) {
                    this._cleanUp();
                }
                else {
                    this._model.withoutWatchingEditorPosition(() => {
                        if (!this._widget || !this._model) {
                            return;
                        }
                        this._widget.showAtMarker(marker, this._model.indexOf(marker), this._model.total);
                    });
                }
            }));
            this._disposeOnClose.add(this._model.onMarkerSetChanged(() => {
                if (!this._widget || !this._widget.position || !this._model) {
                    return;
                }
                const marker = this._model.findMarkerAtPosition(this._widget.position);
                if (marker) {
                    this._widget.updateMarker(marker);
                }
                else {
                    this._widget.showStale();
                }
            }));
            return this._model;
        }
        closeMarkersNavigation(focusEditor = true) {
            this._cleanUp();
            if (focusEditor) {
                this._editor.focus();
            }
        }
        show(marker) {
            const model = this.getOrCreateModel();
            model.currentMarker = marker;
        }
        _onMarkerChanged(changedResources) {
            const editorModel = this._editor.getModel();
            if (!editorModel) {
                return;
            }
            if (!this._model) {
                return;
            }
            if (!changedResources.some(r => resources_1.isEqual(editorModel.uri, r))) {
                return;
            }
            this._model.setMarkers(this._getMarkers());
        }
        _getMarkers() {
            let model = this._editor.getModel();
            if (!model) {
                return [];
            }
            return this._markerService.read({
                resource: model.uri,
                severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning | markers_1.MarkerSeverity.Info
            });
        }
    };
    MarkerController.ID = 'editor.contrib.markerController';
    MarkerController = __decorate([
        __param(1, markers_1.IMarkerService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, themeService_1.IThemeService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, keybinding_1.IKeybindingService)
    ], MarkerController);
    exports.MarkerController = MarkerController;
    class MarkerNavigationAction extends editorExtensions_1.EditorAction {
        constructor(next, multiFile, opts) {
            super(opts);
            this._isNext = next;
            this._multiFile = multiFile;
        }
        run(accessor, editor) {
            const markerService = accessor.get(markers_1.IMarkerService);
            const editorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const controller = MarkerController.get(editor);
            if (!controller) {
                return Promise.resolve(undefined);
            }
            const model = controller.getOrCreateModel();
            const atEdge = model.move(this._isNext, !this._multiFile);
            if (!atEdge || !this._multiFile) {
                return Promise.resolve(undefined);
            }
            // try with the next/prev file
            let markers = markerService.read({ severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning | markers_1.MarkerSeverity.Info }).sort(MarkerNavigationAction.compareMarker);
            if (markers.length === 0) {
                return Promise.resolve(undefined);
            }
            const editorModel = editor.getModel();
            if (!editorModel) {
                return Promise.resolve(undefined);
            }
            let oldMarker = model.currentMarker || { resource: editorModel.uri, severity: markers_1.MarkerSeverity.Error, startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 };
            let idx = arrays_1.binarySearch(markers, oldMarker, MarkerNavigationAction.compareMarker);
            if (idx < 0) {
                // find best match...
                idx = ~idx;
                idx %= markers.length;
            }
            else if (this._isNext) {
                idx = (idx + 1) % markers.length;
            }
            else {
                idx = (idx + markers.length - 1) % markers.length;
            }
            let newMarker = markers[idx];
            if (resources_1.isEqual(newMarker.resource, editorModel.uri)) {
                // the next `resource` is this resource which
                // means we cycle within this file
                model.move(this._isNext, true);
                return Promise.resolve(undefined);
            }
            // close the widget for this editor-instance, open the resource
            // for the next marker and re-start marker navigation in there
            controller.closeMarkersNavigation();
            return editorService.openCodeEditor({
                resource: newMarker.resource,
                options: { pinned: false, revealIfOpened: true, revealInCenterIfOutsideViewport: true, selection: newMarker }
            }, editor).then(editor => {
                if (!editor) {
                    return undefined;
                }
                return editor.getAction(this.id).run();
            });
        }
        static compareMarker(a, b) {
            let res = strings_1.compare(a.resource.toString(), b.resource.toString());
            if (res === 0) {
                res = markers_1.MarkerSeverity.compare(a.severity, b.severity);
            }
            if (res === 0) {
                res = range_1.Range.compareRangesUsingStarts(a, b);
            }
            return res;
        }
    }
    class NextMarkerAction extends MarkerNavigationAction {
        constructor() {
            super(true, false, {
                id: NextMarkerAction.ID,
                label: NextMarkerAction.LABEL,
                alias: 'Go to Next Problem (Error, Warning, Info)',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: { kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus, primary: 512 /* Alt */ | 66 /* F8 */, weight: keybindingsRegistry_1.KeybindingWeight.EditorContrib }
            });
        }
    }
    exports.NextMarkerAction = NextMarkerAction;
    NextMarkerAction.ID = 'editor.action.marker.next';
    NextMarkerAction.LABEL = nls.localize('markerAction.next.label', "Go to Next Problem (Error, Warning, Info)");
    class PrevMarkerAction extends MarkerNavigationAction {
        constructor() {
            super(false, false, {
                id: PrevMarkerAction.ID,
                label: PrevMarkerAction.LABEL,
                alias: 'Go to Previous Problem (Error, Warning, Info)',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: { kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus, primary: 1024 /* Shift */ | 512 /* Alt */ | 66 /* F8 */, weight: keybindingsRegistry_1.KeybindingWeight.EditorContrib }
            });
        }
    }
    PrevMarkerAction.ID = 'editor.action.marker.prev';
    PrevMarkerAction.LABEL = nls.localize('markerAction.previous.label', "Go to Previous Problem (Error, Warning, Info)");
    class NextMarkerInFilesAction extends MarkerNavigationAction {
        constructor() {
            super(true, true, {
                id: 'editor.action.marker.nextInFiles',
                label: nls.localize('markerAction.nextInFiles.label', "Go to Next Problem in Files (Error, Warning, Info)"),
                alias: 'Go to Next Problem in Files (Error, Warning, Info)',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 66 /* F8 */,
                    weight: keybindingsRegistry_1.KeybindingWeight.EditorContrib
                }
            });
        }
    }
    class PrevMarkerInFilesAction extends MarkerNavigationAction {
        constructor() {
            super(false, true, {
                id: 'editor.action.marker.prevInFiles',
                label: nls.localize('markerAction.previousInFiles.label', "Go to Previous Problem in Files (Error, Warning, Info)"),
                alias: 'Go to Previous Problem in Files (Error, Warning, Info)',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 1024 /* Shift */ | 66 /* F8 */,
                    weight: keybindingsRegistry_1.KeybindingWeight.EditorContrib
                }
            });
        }
    }
    editorExtensions_1.registerEditorContribution(MarkerController.ID, MarkerController);
    editorExtensions_1.registerEditorAction(NextMarkerAction);
    editorExtensions_1.registerEditorAction(PrevMarkerAction);
    editorExtensions_1.registerEditorAction(NextMarkerInFilesAction);
    editorExtensions_1.registerEditorAction(PrevMarkerInFilesAction);
    const CONTEXT_MARKERS_NAVIGATION_VISIBLE = new contextkey_1.RawContextKey('markersNavigationVisible', false);
    const MarkerCommand = editorExtensions_1.EditorCommand.bindToContribution(MarkerController.get);
    editorExtensions_1.registerEditorCommand(new MarkerCommand({
        id: 'closeMarkersNavigation',
        precondition: CONTEXT_MARKERS_NAVIGATION_VISIBLE,
        handler: x => x.closeMarkersNavigation(),
        kbOpts: {
            weight: keybindingsRegistry_1.KeybindingWeight.EditorContrib + 50,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 9 /* Escape */,
            secondary: [1024 /* Shift */ | 9 /* Escape */]
        }
    }));
    // Go to menu
    actions_1.MenuRegistry.appendMenuItem(16 /* MenubarGoMenu */, {
        group: '6_problem_nav',
        command: {
            id: 'editor.action.marker.nextInFiles',
            title: nls.localize({ key: 'miGotoNextProblem', comment: ['&& denotes a mnemonic'] }, "Next &&Problem")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(16 /* MenubarGoMenu */, {
        group: '6_problem_nav',
        command: {
            id: 'editor.action.marker.prevInFiles',
            title: nls.localize({ key: 'miGotoPreviousProblem', comment: ['&& denotes a mnemonic'] }, "Previous &&Problem")
        },
        order: 2
    });
});
//# sourceMappingURL=gotoError.js.map