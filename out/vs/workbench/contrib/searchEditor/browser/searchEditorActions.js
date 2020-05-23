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
define(["require", "exports", "vs/base/common/actions", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/telemetry/common/telemetry", "vs/workbench/common/views", "vs/workbench/contrib/search/browser/searchActions", "vs/workbench/contrib/searchEditor/browser/constants", "vs/workbench/contrib/searchEditor/browser/searchEditorInput", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/search/browser/searchIcons", "vs/css!./media/searchEditor"], function (require, exports, actions_1, editorBrowser_1, nls_1, configuration_1, instantiation_1, label_1, telemetry_1, views_1, searchActions_1, Constants, searchEditorInput_1, searchEditorSerialization_1, editorService_1, searchIcons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createEditorFromSearchResult = exports.FocusQueryEditorWidgetAction = exports.RerunSearchEditorSearchAction = exports.OpenResultsInEditorAction = exports.OpenSearchEditorToSideAction = exports.OpenSearchEditorAction = exports.selectAllSearchEditorMatchesCommand = exports.modifySearchEditorContextLinesCommand = exports.toggleSearchEditorContextLinesCommand = exports.toggleSearchEditorRegexCommand = exports.toggleSearchEditorWholeWordCommand = exports.toggleSearchEditorCaseSensitiveCommand = void 0;
    exports.toggleSearchEditorCaseSensitiveCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleCaseSensitive();
        }
    };
    exports.toggleSearchEditorWholeWordCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleWholeWords();
        }
    };
    exports.toggleSearchEditorRegexCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleRegex();
        }
    };
    exports.toggleSearchEditorContextLinesCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleContextLines();
        }
    };
    exports.modifySearchEditorContextLinesCommand = (accessor, increase) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.modifyContextLines(increase);
        }
    };
    exports.selectAllSearchEditorMatchesCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.focusAllResults();
        }
    };
    let OpenSearchEditorAction = /** @class */ (() => {
        let OpenSearchEditorAction = class OpenSearchEditorAction extends actions_1.Action {
            constructor(id, label, instantiationService) {
                super(id, label, searchIcons_1.searchNewEditorIcon.classNames);
                this.instantiationService = instantiationService;
            }
            update() {
                // pass
            }
            get enabled() {
                return true;
            }
            async run() {
                await this.instantiationService.invokeFunction(openNewSearchEditor);
            }
        };
        OpenSearchEditorAction.ID = Constants.OpenNewEditorCommandId;
        OpenSearchEditorAction.LABEL = nls_1.localize('search.openNewEditor', "Open New Search Editor");
        OpenSearchEditorAction = __decorate([
            __param(2, instantiation_1.IInstantiationService)
        ], OpenSearchEditorAction);
        return OpenSearchEditorAction;
    })();
    exports.OpenSearchEditorAction = OpenSearchEditorAction;
    let OpenSearchEditorToSideAction = /** @class */ (() => {
        let OpenSearchEditorToSideAction = class OpenSearchEditorToSideAction extends actions_1.Action {
            constructor(id, label, instantiationService) {
                super(id, label, searchIcons_1.searchNewEditorIcon.classNames);
                this.instantiationService = instantiationService;
            }
            async run() {
                await this.instantiationService.invokeFunction(openNewSearchEditor, true);
            }
        };
        OpenSearchEditorToSideAction.ID = Constants.OpenNewEditorToSideCommandId;
        OpenSearchEditorToSideAction.LABEL = nls_1.localize('search.openNewEditorToSide', "Open New Search Editor to Side");
        OpenSearchEditorToSideAction = __decorate([
            __param(2, instantiation_1.IInstantiationService)
        ], OpenSearchEditorToSideAction);
        return OpenSearchEditorToSideAction;
    })();
    exports.OpenSearchEditorToSideAction = OpenSearchEditorToSideAction;
    let OpenResultsInEditorAction = /** @class */ (() => {
        let OpenResultsInEditorAction = class OpenResultsInEditorAction extends actions_1.Action {
            constructor(id, label, viewsService, instantiationService) {
                super(id, label, searchIcons_1.searchGotoFileIcon.classNames);
                this.viewsService = viewsService;
                this.instantiationService = instantiationService;
            }
            get enabled() {
                const searchView = searchActions_1.getSearchView(this.viewsService);
                return !!searchView && searchView.hasSearchResults();
            }
            update() {
                this._setEnabled(this.enabled);
            }
            async run() {
                const searchView = searchActions_1.getSearchView(this.viewsService);
                if (searchView) {
                    await this.instantiationService.invokeFunction(exports.createEditorFromSearchResult, searchView.searchResult, searchView.searchIncludePattern.getValue(), searchView.searchExcludePattern.getValue());
                }
            }
        };
        OpenResultsInEditorAction.ID = Constants.OpenInEditorCommandId;
        OpenResultsInEditorAction.LABEL = nls_1.localize('search.openResultsInEditor', "Open Results in Editor");
        OpenResultsInEditorAction = __decorate([
            __param(2, views_1.IViewsService),
            __param(3, instantiation_1.IInstantiationService)
        ], OpenResultsInEditorAction);
        return OpenResultsInEditorAction;
    })();
    exports.OpenResultsInEditorAction = OpenResultsInEditorAction;
    let RerunSearchEditorSearchAction = /** @class */ (() => {
        let RerunSearchEditorSearchAction = class RerunSearchEditorSearchAction extends actions_1.Action {
            constructor(id, label, editorService) {
                super(id, label, searchIcons_1.searchRefreshIcon.classNames);
                this.editorService = editorService;
            }
            async run() {
                const input = this.editorService.activeEditor;
                if (input instanceof searchEditorInput_1.SearchEditorInput) {
                    this.editorService.activeEditorPane.triggerSearch({ resetCursor: false });
                }
            }
        };
        RerunSearchEditorSearchAction.ID = Constants.RerunSearchEditorSearchCommandId;
        RerunSearchEditorSearchAction.LABEL = nls_1.localize('search.rerunSearchInEditor', "Search Again");
        RerunSearchEditorSearchAction = __decorate([
            __param(2, editorService_1.IEditorService)
        ], RerunSearchEditorSearchAction);
        return RerunSearchEditorSearchAction;
    })();
    exports.RerunSearchEditorSearchAction = RerunSearchEditorSearchAction;
    let FocusQueryEditorWidgetAction = /** @class */ (() => {
        let FocusQueryEditorWidgetAction = class FocusQueryEditorWidgetAction extends actions_1.Action {
            constructor(id, label, editorService) {
                super(id, label);
                this.editorService = editorService;
            }
            async run() {
                const input = this.editorService.activeEditor;
                if (input instanceof searchEditorInput_1.SearchEditorInput) {
                    this.editorService.activeEditorPane.focusSearchInput();
                }
            }
        };
        FocusQueryEditorWidgetAction.ID = Constants.FocusQueryEditorWidgetCommandId;
        FocusQueryEditorWidgetAction.LABEL = nls_1.localize('search.action.focusQueryEditorWidget', "Focus Search Editor Input");
        FocusQueryEditorWidgetAction = __decorate([
            __param(2, editorService_1.IEditorService)
        ], FocusQueryEditorWidgetAction);
        return FocusQueryEditorWidgetAction;
    })();
    exports.FocusQueryEditorWidgetAction = FocusQueryEditorWidgetAction;
    const openNewSearchEditor = async (accessor, toSide = false) => {
        var _a, _b;
        const editorService = accessor.get(editorService_1.IEditorService);
        const telemetryService = accessor.get(telemetry_1.ITelemetryService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const activeEditorControl = editorService.activeTextEditorControl;
        let activeModel;
        let selected = '';
        if (activeEditorControl) {
            if (editorBrowser_1.isDiffEditor(activeEditorControl)) {
                if (activeEditorControl.getOriginalEditor().hasTextFocus()) {
                    activeModel = activeEditorControl.getOriginalEditor();
                }
                else {
                    activeModel = activeEditorControl.getModifiedEditor();
                }
            }
            else {
                activeModel = activeEditorControl;
            }
            const selection = activeModel === null || activeModel === void 0 ? void 0 : activeModel.getSelection();
            selected = (_b = (selection && ((_a = activeModel === null || activeModel === void 0 ? void 0 : activeModel.getModel()) === null || _a === void 0 ? void 0 : _a.getValueInRange(selection)))) !== null && _b !== void 0 ? _b : '';
        }
        else {
            if (editorService.activeEditor instanceof searchEditorInput_1.SearchEditorInput) {
                const active = editorService.activeEditorPane;
                selected = active.getSelected();
            }
        }
        telemetryService.publicLog2('searchEditor/openNewSearchEditor');
        const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { config: { query: selected }, text: '' });
        const editor = await editorService.openEditor(input, { pinned: true }, toSide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
        if (selected && configurationService.getValue('search').searchOnType) {
            editor.triggerSearch();
        }
    };
    exports.createEditorFromSearchResult = async (accessor, searchResult, rawIncludePattern, rawExcludePattern) => {
        if (!searchResult.query) {
            console.error('Expected searchResult.query to be defined. Got', searchResult);
            return;
        }
        const editorService = accessor.get(editorService_1.IEditorService);
        const telemetryService = accessor.get(telemetry_1.ITelemetryService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const labelService = accessor.get(label_1.ILabelService);
        telemetryService.publicLog2('searchEditor/createEditorFromSearchResult');
        const labelFormatter = (uri) => labelService.getUriLabel(uri, { relative: true });
        const { text, matchRanges, config } = searchEditorSerialization_1.serializeSearchResultForEditor(searchResult, rawIncludePattern, rawExcludePattern, 0, labelFormatter);
        const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { text, config });
        await editorService.openEditor(input, { pinned: true });
        input.setMatchRanges(matchRanges);
    };
});
//# sourceMappingURL=searchEditorActions.js.map