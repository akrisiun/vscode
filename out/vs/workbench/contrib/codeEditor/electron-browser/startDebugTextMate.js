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
define(["require", "exports", "os", "path", "vs/nls", "vs/editor/common/core/range", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/workbench/services/textMate/common/textMateService", "vs/editor/common/services/modelService", "vs/workbench/services/editor/common/editorService", "vs/base/common/uri", "vs/platform/log/node/spdlogService", "vs/base/common/uuid", "vs/editor/browser/services/codeEditorService", "vs/workbench/services/host/browser/host"], function (require, exports, os, path, nls, range_1, actions_1, actions_2, platform_1, actions_3, textMateService_1, modelService_1, editorService_1, uri_1, spdlogService_1, uuid_1, codeEditorService_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let StartDebugTextMate = /** @class */ (() => {
        let StartDebugTextMate = class StartDebugTextMate extends actions_1.Action {
            constructor(id, label, _textMateService, _modelService, _editorService, _codeEditorService, _hostService) {
                super(id, label);
                this._textMateService = _textMateService;
                this._modelService = _modelService;
                this._editorService = _editorService;
                this._codeEditorService = _codeEditorService;
                this._hostService = _hostService;
            }
            _getOrCreateModel() {
                const model = this._modelService.getModel(StartDebugTextMate.resource);
                if (model) {
                    return model;
                }
                return this._modelService.createModel('', null, StartDebugTextMate.resource);
            }
            _append(model, str) {
                const lineCount = model.getLineCount();
                model.applyEdits([{
                        range: new range_1.Range(lineCount, 1073741824 /* MAX_SAFE_SMALL_INTEGER */, lineCount, 1073741824 /* MAX_SAFE_SMALL_INTEGER */),
                        text: str
                    }]);
            }
            async run() {
                const pathInTemp = path.join(os.tmpdir(), `vcode-tm-log-${uuid_1.generateUuid()}.txt`);
                const logger = spdlogService_1.createRotatingLogger(`tm-log`, pathInTemp, 1024 * 1024 * 30, 1);
                const model = this._getOrCreateModel();
                const append = (str) => {
                    this._append(model, str + '\n');
                    scrollEditor();
                    logger.info(str);
                    logger.flush();
                };
                await this._hostService.openWindow([{ fileUri: uri_1.URI.file(pathInTemp) }], { forceNewWindow: true });
                const textEditorPane = await this._editorService.openEditor({
                    resource: model.uri
                });
                if (!textEditorPane) {
                    return;
                }
                const scrollEditor = () => {
                    const editors = this._codeEditorService.listCodeEditors();
                    for (const editor of editors) {
                        if (editor.hasModel()) {
                            if (editor.getModel().uri.toString() === StartDebugTextMate.resource.toString()) {
                                editor.revealLine(editor.getModel().getLineCount());
                            }
                        }
                    }
                };
                append(`// Open the file you want to test to the side and watch here`);
                append(`// Output mirrored at ${pathInTemp}`);
                this._textMateService.startDebugMode((str) => {
                    this._append(model, str + '\n');
                    scrollEditor();
                    logger.info(str);
                    logger.flush();
                }, () => {
                });
            }
        };
        StartDebugTextMate.resource = uri_1.URI.parse(`inmemory:///tm-log.txt`);
        StartDebugTextMate.ID = 'editor.action.startDebugTextMate';
        StartDebugTextMate.LABEL = nls.localize('startDebugTextMate', "Start Text Mate Syntax Grammar Logging");
        StartDebugTextMate = __decorate([
            __param(2, textMateService_1.ITextMateService),
            __param(3, modelService_1.IModelService),
            __param(4, editorService_1.IEditorService),
            __param(5, codeEditorService_1.ICodeEditorService),
            __param(6, host_1.IHostService)
        ], StartDebugTextMate);
        return StartDebugTextMate;
    })();
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(StartDebugTextMate), 'Start Text Mate Syntax Grammar Logging', nls.localize('developer', "Developer"));
});
//# sourceMappingURL=startDebugTextMate.js.map