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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/editor/browser/widget/embeddedCodeEditorWidget", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/services/resolverService", "vs/editor/contrib/referenceSearch/referencesTree", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "./peekViewWidget", "./referencesModel", "vs/base/browser/ui/splitview/splitview", "vs/css!./media/referencesWidget"], function (require, exports, dom, color_1, event_1, lifecycle_1, network_1, resources_1, embeddedCodeEditorWidget_1, range_1, textModel_1, resolverService_1, referencesTree_1, nls, contextkey_1, instantiation_1, label_1, listService_1, colorRegistry_1, themeService_1, peekViewWidget_1, referencesModel_1, splitview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DecorationsManager {
        constructor(_editor, _model) {
            this._editor = _editor;
            this._model = _model;
            this._decorations = new Map();
            this._decorationIgnoreSet = new Set();
            this._callOnDispose = new lifecycle_1.DisposableStore();
            this._callOnModelChange = new lifecycle_1.DisposableStore();
            this._callOnDispose.add(this._editor.onDidChangeModel(() => this._onModelChanged()));
            this._onModelChanged();
        }
        dispose() {
            this._callOnModelChange.dispose();
            this._callOnDispose.dispose();
            this.removeDecorations();
        }
        _onModelChanged() {
            this._callOnModelChange.clear();
            const model = this._editor.getModel();
            if (model) {
                for (const ref of this._model.groups) {
                    if (resources_1.isEqual(ref.uri, model.uri)) {
                        this._addDecorations(ref);
                        return;
                    }
                }
            }
        }
        _addDecorations(reference) {
            if (!this._editor.hasModel()) {
                return;
            }
            this._callOnModelChange.add(this._editor.getModel().onDidChangeDecorations((event) => this._onDecorationChanged()));
            const newDecorations = [];
            const newDecorationsActualIndex = [];
            for (let i = 0, len = reference.children.length; i < len; i++) {
                let oneReference = reference.children[i];
                if (this._decorationIgnoreSet.has(oneReference.id)) {
                    continue;
                }
                newDecorations.push({
                    range: oneReference.range,
                    options: DecorationsManager.DecorationOptions
                });
                newDecorationsActualIndex.push(i);
            }
            const decorations = this._editor.deltaDecorations([], newDecorations);
            for (let i = 0; i < decorations.length; i++) {
                this._decorations.set(decorations[i], reference.children[newDecorationsActualIndex[i]]);
            }
        }
        _onDecorationChanged() {
            const toRemove = [];
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            this._decorations.forEach((reference, decorationId) => {
                const newRange = model.getDecorationRange(decorationId);
                if (!newRange) {
                    return;
                }
                let ignore = false;
                if (range_1.Range.equalsRange(newRange, reference.range)) {
                    return;
                }
                else if (range_1.Range.spansMultipleLines(newRange)) {
                    ignore = true;
                }
                else {
                    const lineLength = reference.range.endColumn - reference.range.startColumn;
                    const newLineLength = newRange.endColumn - newRange.startColumn;
                    if (lineLength !== newLineLength) {
                        ignore = true;
                    }
                }
                if (ignore) {
                    this._decorationIgnoreSet.add(reference.id);
                    toRemove.push(decorationId);
                }
                else {
                    reference.range = newRange;
                }
            });
            for (let i = 0, len = toRemove.length; i < len; i++) {
                this._decorations.delete(toRemove[i]);
            }
            this._editor.deltaDecorations(toRemove, []);
        }
        removeDecorations() {
            let toRemove = [];
            this._decorations.forEach((value, key) => {
                toRemove.push(key);
            });
            this._editor.deltaDecorations(toRemove, []);
            this._decorations.clear();
        }
    }
    DecorationsManager.DecorationOptions = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        className: 'reference-decoration'
    });
    class LayoutData {
        constructor() {
            this.ratio = 0.7;
            this.heightInLines = 18;
        }
        static fromJSON(raw) {
            let ratio;
            let heightInLines;
            try {
                const data = JSON.parse(raw);
                ratio = data.ratio;
                heightInLines = data.heightInLines;
            }
            catch (_a) {
                //
            }
            return {
                ratio: ratio || 0.7,
                heightInLines: heightInLines || 18
            };
        }
    }
    exports.LayoutData = LayoutData;
    exports.ctxReferenceWidgetSearchTreeFocused = new contextkey_1.RawContextKey('referenceSearchTreeFocused', true);
    /**
     * ZoneWidget that is shown inside the editor
     */
    let ReferenceWidget = class ReferenceWidget extends peekViewWidget_1.PeekViewWidget {
        constructor(editor, _defaultTreeKeyboardSupport, layoutData, themeService, _textModelResolverService, _instantiationService, _peekViewService, _uriLabel) {
            super(editor, { showFrame: false, showArrow: true, isResizeable: true, isAccessible: true });
            this._defaultTreeKeyboardSupport = _defaultTreeKeyboardSupport;
            this.layoutData = layoutData;
            this._textModelResolverService = _textModelResolverService;
            this._instantiationService = _instantiationService;
            this._peekViewService = _peekViewService;
            this._uriLabel = _uriLabel;
            this._disposeOnNewModel = new lifecycle_1.DisposableStore();
            this._callOnDispose = new lifecycle_1.DisposableStore();
            this._onDidSelectReference = new event_1.Emitter();
            this._dim = { height: 0, width: 0 };
            this._applyTheme(themeService.getTheme());
            this._callOnDispose.add(themeService.onThemeChange(this._applyTheme.bind(this)));
            this._peekViewService.addExclusiveWidget(editor, this);
            this.create();
        }
        dispose() {
            this.setModel(undefined);
            this._callOnDispose.dispose();
            this._disposeOnNewModel.dispose();
            lifecycle_1.dispose(this._preview);
            lifecycle_1.dispose(this._previewNotAvailableMessage);
            lifecycle_1.dispose(this._tree);
            lifecycle_1.dispose(this._previewModelReference);
            this._splitView.dispose();
            super.dispose();
        }
        _applyTheme(theme) {
            const borderColor = theme.getColor(exports.peekViewBorder) || color_1.Color.transparent;
            this.style({
                arrowColor: borderColor,
                frameColor: borderColor,
                headerBackgroundColor: theme.getColor(exports.peekViewTitleBackground) || color_1.Color.transparent,
                primaryHeadingColor: theme.getColor(exports.peekViewTitleForeground),
                secondaryHeadingColor: theme.getColor(exports.peekViewTitleInfoForeground)
            });
        }
        get onDidSelectReference() {
            return this._onDidSelectReference.event;
        }
        show(where) {
            this.editor.revealRangeInCenterIfOutsideViewport(where, 0 /* Smooth */);
            super.show(where, this.layoutData.heightInLines || 18);
        }
        focus() {
            this._tree.domFocus();
        }
        _onTitleClick(e) {
            if (this._preview && this._preview.getModel()) {
                this._onDidSelectReference.fire({
                    element: this._getFocusedReference(),
                    kind: e.ctrlKey || e.metaKey || e.altKey ? 'side' : 'open',
                    source: 'title'
                });
            }
        }
        _fillBody(containerElement) {
            this.setCssClass('reference-zone-widget');
            // message pane
            this._messageContainer = dom.append(containerElement, dom.$('div.messages'));
            dom.hide(this._messageContainer);
            this._splitView = new splitview_1.SplitView(containerElement, { orientation: 1 /* HORIZONTAL */ });
            // editor
            this._previewContainer = dom.append(containerElement, dom.$('div.preview.inline'));
            let options = {
                scrollBeyondLastLine: false,
                scrollbar: {
                    verticalScrollbarSize: 14,
                    horizontal: 'auto',
                    useShadows: true,
                    verticalHasArrows: false,
                    horizontalHasArrows: false
                },
                overviewRulerLanes: 2,
                fixedOverflowWidgets: true,
                minimap: {
                    enabled: false
                }
            };
            this._preview = this._instantiationService.createInstance(embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget, this._previewContainer, options, this.editor);
            dom.hide(this._previewContainer);
            this._previewNotAvailableMessage = textModel_1.TextModel.createFromString(nls.localize('missingPreviewMessage', "no preview available"));
            // tree
            this._treeContainer = dom.append(containerElement, dom.$('div.ref-tree.inline'));
            const treeOptions = {
                ariaLabel: nls.localize('treeAriaLabel', "References"),
                keyboardSupport: this._defaultTreeKeyboardSupport,
                accessibilityProvider: new referencesTree_1.AriaProvider(),
                keyboardNavigationLabelProvider: this._instantiationService.createInstance(referencesTree_1.StringRepresentationProvider),
                identityProvider: new referencesTree_1.IdentityProvider()
            };
            this._tree = this._instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'ReferencesWidget', this._treeContainer, new referencesTree_1.Delegate(), [
                this._instantiationService.createInstance(referencesTree_1.FileReferencesRenderer),
                this._instantiationService.createInstance(referencesTree_1.OneReferenceRenderer),
            ], this._instantiationService.createInstance(referencesTree_1.DataSource), treeOptions);
            exports.ctxReferenceWidgetSearchTreeFocused.bindTo(this._tree.contextKeyService);
            // split stuff
            this._splitView.addView({
                onDidChange: event_1.Event.None,
                element: this._previewContainer,
                minimumSize: 200,
                maximumSize: Number.MAX_VALUE,
                layout: (width) => {
                    this._preview.layout({ height: this._dim.height, width });
                }
            }, splitview_1.Sizing.Distribute);
            this._splitView.addView({
                onDidChange: event_1.Event.None,
                element: this._treeContainer,
                minimumSize: 100,
                maximumSize: Number.MAX_VALUE,
                layout: (width) => {
                    this._treeContainer.style.height = `${this._dim.height}px`;
                    this._treeContainer.style.width = `${width}px`;
                    this._tree.layout(this._dim.height, width);
                }
            }, splitview_1.Sizing.Distribute);
            this._disposables.add(this._splitView.onDidSashChange(() => {
                if (this._dim.width) {
                    this.layoutData.ratio = this._splitView.getViewSize(0) / this._dim.width;
                }
            }, undefined));
            // listen on selection and focus
            let onEvent = (element, kind) => {
                if (element instanceof referencesModel_1.OneReference) {
                    if (kind === 'show') {
                        this._revealReference(element, false);
                    }
                    this._onDidSelectReference.fire({ element, kind, source: 'tree' });
                }
            };
            this._tree.onDidChangeFocus(e => {
                onEvent(e.elements[0], 'show');
            });
            this._tree.onDidOpen(e => {
                const aside = (e.browserEvent instanceof MouseEvent) && (e.browserEvent.ctrlKey || e.browserEvent.metaKey || e.browserEvent.altKey);
                let goto = !e.browserEvent || ((e.browserEvent instanceof MouseEvent) && e.browserEvent.detail === 2);
                if (e.browserEvent instanceof KeyboardEvent) {
                    // todo@joh make this a command
                    goto = true;
                }
                if (aside) {
                    onEvent(e.elements[0], 'side');
                }
                else if (goto) {
                    onEvent(e.elements[0], 'goto');
                }
                else {
                    onEvent(e.elements[0], 'show');
                }
            });
            dom.hide(this._treeContainer);
        }
        _onWidth(width) {
            if (this._dim) {
                this._doLayoutBody(this._dim.height, width);
            }
        }
        _doLayoutBody(heightInPixel, widthInPixel) {
            super._doLayoutBody(heightInPixel, widthInPixel);
            this._dim = { height: heightInPixel, width: widthInPixel };
            this.layoutData.heightInLines = this._viewZone ? this._viewZone.heightInLines : this.layoutData.heightInLines;
            this._splitView.layout(widthInPixel);
            this._splitView.resizeView(0, widthInPixel * this.layoutData.ratio);
        }
        setSelection(selection) {
            return this._revealReference(selection, true).then(() => {
                if (!this._model) {
                    // disposed
                    return;
                }
                // show in tree
                this._tree.setSelection([selection]);
                this._tree.setFocus([selection]);
            });
        }
        setModel(newModel) {
            // clean up
            this._disposeOnNewModel.clear();
            this._model = newModel;
            if (this._model) {
                return this._onNewModel();
            }
            return Promise.resolve();
        }
        _onNewModel() {
            if (!this._model) {
                return Promise.resolve(undefined);
            }
            if (this._model.empty) {
                this.setTitle('');
                this._messageContainer.innerHTML = nls.localize('noResults', "No results");
                dom.show(this._messageContainer);
                return Promise.resolve(undefined);
            }
            dom.hide(this._messageContainer);
            this._decorationsManager = new DecorationsManager(this._preview, this._model);
            this._disposeOnNewModel.add(this._decorationsManager);
            // listen on model changes
            this._disposeOnNewModel.add(this._model.onDidChangeReferenceRange(reference => this._tree.rerender(reference)));
            // listen on editor
            this._disposeOnNewModel.add(this._preview.onMouseDown(e => {
                const { event, target } = e;
                if (event.detail !== 2) {
                    return;
                }
                const element = this._getFocusedReference();
                if (!element) {
                    return;
                }
                this._onDidSelectReference.fire({
                    element: { uri: element.uri, range: target.range },
                    kind: (event.ctrlKey || event.metaKey || event.altKey) ? 'side' : 'open',
                    source: 'editor'
                });
            }));
            // make sure things are rendered
            dom.addClass(this.container, 'results-loaded');
            dom.show(this._treeContainer);
            dom.show(this._previewContainer);
            this._splitView.layout(this._dim.width);
            this.focus();
            // pick input and a reference to begin with
            return this._tree.setInput(this._model.groups.length === 1 ? this._model.groups[0] : this._model);
        }
        _getFocusedReference() {
            const [element] = this._tree.getFocus();
            if (element instanceof referencesModel_1.OneReference) {
                return element;
            }
            else if (element instanceof referencesModel_1.FileReferences) {
                if (element.children.length > 0) {
                    return element.children[0];
                }
            }
            return undefined;
        }
        async _revealReference(reference, revealParent) {
            // check if there is anything to do...
            if (this._revealedReference === reference) {
                return;
            }
            this._revealedReference = reference;
            // Update widget header
            if (reference.uri.scheme !== network_1.Schemas.inMemory) {
                this.setTitle(resources_1.basenameOrAuthority(reference.uri), this._uriLabel.getUriLabel(resources_1.dirname(reference.uri)));
            }
            else {
                this.setTitle(nls.localize('peekView.alternateTitle', "References"));
            }
            const promise = this._textModelResolverService.createModelReference(reference.uri);
            if (this._tree.getInput() === reference.parent) {
                this._tree.reveal(reference);
            }
            else {
                if (revealParent) {
                    this._tree.reveal(reference.parent);
                }
                await this._tree.expand(reference.parent);
                this._tree.reveal(reference);
            }
            const ref = await promise;
            if (!this._model) {
                // disposed
                ref.dispose();
                return;
            }
            lifecycle_1.dispose(this._previewModelReference);
            // show in editor
            const model = ref.object;
            if (model) {
                const scrollType = this._preview.getModel() === model.textEditorModel ? 0 /* Smooth */ : 1 /* Immediate */;
                const sel = range_1.Range.lift(reference.range).collapseToStart();
                this._previewModelReference = ref;
                this._preview.setModel(model.textEditorModel);
                this._preview.setSelection(sel);
                this._preview.revealRangeInCenter(sel, scrollType);
            }
            else {
                this._preview.setModel(this._previewNotAvailableMessage);
                ref.dispose();
            }
        }
    };
    ReferenceWidget = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, peekViewWidget_1.IPeekViewService),
        __param(7, label_1.ILabelService)
    ], ReferenceWidget);
    exports.ReferenceWidget = ReferenceWidget;
    // theming
    exports.peekViewTitleBackground = colorRegistry_1.registerColor('peekViewTitle.background', { dark: '#1E1E1E', light: '#FFFFFF', hc: '#0C141F' }, nls.localize('peekViewTitleBackground', 'Background color of the peek view title area.'));
    exports.peekViewTitleForeground = colorRegistry_1.registerColor('peekViewTitleLabel.foreground', { dark: '#FFFFFF', light: '#333333', hc: '#FFFFFF' }, nls.localize('peekViewTitleForeground', 'Color of the peek view title.'));
    exports.peekViewTitleInfoForeground = colorRegistry_1.registerColor('peekViewTitleDescription.foreground', { dark: '#ccccccb3', light: '#6c6c6cb3', hc: '#FFFFFF99' }, nls.localize('peekViewTitleInfoForeground', 'Color of the peek view title info.'));
    exports.peekViewBorder = colorRegistry_1.registerColor('peekView.border', { dark: '#007acc', light: '#007acc', hc: colorRegistry_1.contrastBorder }, nls.localize('peekViewBorder', 'Color of the peek view borders and arrow.'));
    exports.peekViewResultsBackground = colorRegistry_1.registerColor('peekViewResult.background', { dark: '#252526', light: '#F3F3F3', hc: color_1.Color.black }, nls.localize('peekViewResultsBackground', 'Background color of the peek view result list.'));
    exports.peekViewResultsMatchForeground = colorRegistry_1.registerColor('peekViewResult.lineForeground', { dark: '#bbbbbb', light: '#646465', hc: color_1.Color.white }, nls.localize('peekViewResultsMatchForeground', 'Foreground color for line nodes in the peek view result list.'));
    exports.peekViewResultsFileForeground = colorRegistry_1.registerColor('peekViewResult.fileForeground', { dark: color_1.Color.white, light: '#1E1E1E', hc: color_1.Color.white }, nls.localize('peekViewResultsFileForeground', 'Foreground color for file nodes in the peek view result list.'));
    exports.peekViewResultsSelectionBackground = colorRegistry_1.registerColor('peekViewResult.selectionBackground', { dark: '#3399ff33', light: '#3399ff33', hc: null }, nls.localize('peekViewResultsSelectionBackground', 'Background color of the selected entry in the peek view result list.'));
    exports.peekViewResultsSelectionForeground = colorRegistry_1.registerColor('peekViewResult.selectionForeground', { dark: color_1.Color.white, light: '#6C6C6C', hc: color_1.Color.white }, nls.localize('peekViewResultsSelectionForeground', 'Foreground color of the selected entry in the peek view result list.'));
    exports.peekViewEditorBackground = colorRegistry_1.registerColor('peekViewEditor.background', { dark: '#001F33', light: '#F2F8FC', hc: color_1.Color.black }, nls.localize('peekViewEditorBackground', 'Background color of the peek view editor.'));
    exports.peekViewEditorGutterBackground = colorRegistry_1.registerColor('peekViewEditorGutter.background', { dark: exports.peekViewEditorBackground, light: exports.peekViewEditorBackground, hc: exports.peekViewEditorBackground }, nls.localize('peekViewEditorGutterBackground', 'Background color of the gutter in the peek view editor.'));
    exports.peekViewResultsMatchHighlight = colorRegistry_1.registerColor('peekViewResult.matchHighlightBackground', { dark: '#ea5c004d', light: '#ea5c004d', hc: null }, nls.localize('peekViewResultsMatchHighlight', 'Match highlight color in the peek view result list.'));
    exports.peekViewEditorMatchHighlight = colorRegistry_1.registerColor('peekViewEditor.matchHighlightBackground', { dark: '#ff8f0099', light: '#f5d802de', hc: null }, nls.localize('peekViewEditorMatchHighlight', 'Match highlight color in the peek view editor.'));
    exports.peekViewEditorMatchHighlightBorder = colorRegistry_1.registerColor('peekViewEditor.matchHighlightBorder', { dark: null, light: null, hc: colorRegistry_1.activeContrastBorder }, nls.localize('peekViewEditorMatchHighlightBorder', 'Match highlight border in the peek view editor.'));
    themeService_1.registerThemingParticipant((theme, collector) => {
        const findMatchHighlightColor = theme.getColor(exports.peekViewResultsMatchHighlight);
        if (findMatchHighlightColor) {
            collector.addRule(`.monaco-editor .reference-zone-widget .ref-tree .referenceMatch .highlight { background-color: ${findMatchHighlightColor}; }`);
        }
        const referenceHighlightColor = theme.getColor(exports.peekViewEditorMatchHighlight);
        if (referenceHighlightColor) {
            collector.addRule(`.monaco-editor .reference-zone-widget .preview .reference-decoration { background-color: ${referenceHighlightColor}; }`);
        }
        const referenceHighlightBorder = theme.getColor(exports.peekViewEditorMatchHighlightBorder);
        if (referenceHighlightBorder) {
            collector.addRule(`.monaco-editor .reference-zone-widget .preview .reference-decoration { border: 2px solid ${referenceHighlightBorder}; box-sizing: border-box; }`);
        }
        const hcOutline = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (hcOutline) {
            collector.addRule(`.monaco-editor .reference-zone-widget .ref-tree .referenceMatch .highlight { border: 1px dotted ${hcOutline}; box-sizing: border-box; }`);
        }
        const resultsBackground = theme.getColor(exports.peekViewResultsBackground);
        if (resultsBackground) {
            collector.addRule(`.monaco-editor .reference-zone-widget .ref-tree { background-color: ${resultsBackground}; }`);
        }
        const resultsMatchForeground = theme.getColor(exports.peekViewResultsMatchForeground);
        if (resultsMatchForeground) {
            collector.addRule(`.monaco-editor .reference-zone-widget .ref-tree { color: ${resultsMatchForeground}; }`);
        }
        const resultsFileForeground = theme.getColor(exports.peekViewResultsFileForeground);
        if (resultsFileForeground) {
            collector.addRule(`.monaco-editor .reference-zone-widget .ref-tree .reference-file { color: ${resultsFileForeground}; }`);
        }
        const resultsSelectedBackground = theme.getColor(exports.peekViewResultsSelectionBackground);
        if (resultsSelectedBackground) {
            collector.addRule(`.monaco-editor .reference-zone-widget .ref-tree .monaco-list:focus .monaco-list-rows > .monaco-list-row.selected:not(.highlighted) { background-color: ${resultsSelectedBackground}; }`);
        }
        const resultsSelectedForeground = theme.getColor(exports.peekViewResultsSelectionForeground);
        if (resultsSelectedForeground) {
            collector.addRule(`.monaco-editor .reference-zone-widget .ref-tree .monaco-list:focus .monaco-list-rows > .monaco-list-row.selected:not(.highlighted) { color: ${resultsSelectedForeground} !important; }`);
        }
        const editorBackground = theme.getColor(exports.peekViewEditorBackground);
        if (editorBackground) {
            collector.addRule(`.monaco-editor .reference-zone-widget .preview .monaco-editor .monaco-editor-background,` +
                `.monaco-editor .reference-zone-widget .preview .monaco-editor .inputarea.ime-input {` +
                `	background-color: ${editorBackground};` +
                `}`);
        }
        const editorGutterBackground = theme.getColor(exports.peekViewEditorGutterBackground);
        if (editorGutterBackground) {
            collector.addRule(`.monaco-editor .reference-zone-widget .preview .monaco-editor .margin {` +
                `	background-color: ${editorGutterBackground};` +
                `}`);
        }
    });
});
//# sourceMappingURL=referencesWidget.js.map