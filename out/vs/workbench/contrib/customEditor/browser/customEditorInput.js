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
define(["require", "exports", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/path", "vs/base/common/resources", "vs/platform/dialogs/common/dialogs", "vs/platform/label/common/label", "vs/workbench/contrib/webview/browser/webviewEditorInput", "vs/workbench/contrib/webview/browser/webviewEditorService", "vs/workbench/services/textfile/browser/textFileService", "vs/base/common/network"], function (require, exports, decorators_1, event_1, path_1, resources_1, dialogs_1, label_1, webviewEditorInput_1, webviewEditorService_1, textFileService_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CustomFileEditorInput = class CustomFileEditorInput extends webviewEditorInput_1.WebviewInput {
        constructor(resource, viewType, id, webview, labelService, _webviewEditorService, dialogService) {
            super(id, viewType, '', webview);
            this.labelService = labelService;
            this._webviewEditorService = _webviewEditorService;
            this.dialogService = dialogService;
            this._hasResolved = false;
            this._state = 1 /* Readonly */;
            this._onWillSave = this._register(new event_1.Emitter());
            this.onWillSave = this._onWillSave.event;
            this._editorResource = resource;
        }
        getTypeId() {
            return CustomFileEditorInput.typeId;
        }
        getResource() {
            return this._editorResource;
        }
        getName() {
            if (this.getResource().scheme === network_1.Schemas.data) {
                const metadata = resources_1.DataUri.parseMetaData(this.getResource());
                const label = metadata.get(resources_1.DataUri.META_DATA_LABEL);
                if (typeof label === 'string') {
                    return label;
                }
            }
            return path_1.basename(this.labelService.getUriLabel(this.getResource()));
        }
        getDescription() {
            if (this.getResource().scheme === network_1.Schemas.data) {
                const metadata = resources_1.DataUri.parseMetaData(this.getResource());
                const description = metadata.get(resources_1.DataUri.META_DATA_DESCRIPTION);
                if (typeof description === 'string') {
                    return description;
                }
            }
            return super.getDescription();
        }
        matches(other) {
            return this === other || (other instanceof CustomFileEditorInput
                && this.viewType === other.viewType
                && resources_1.isEqual(this.getResource(), other.getResource()));
        }
        get shortTitle() {
            return this.getName();
        }
        get mediumTitle() {
            if (this.getResource().scheme === network_1.Schemas.data) {
                return this.getName();
            }
            return this.labelService.getUriLabel(this.getResource(), { relative: true });
        }
        get longTitle() {
            if (this.getResource().scheme === network_1.Schemas.data) {
                return this.getName();
            }
            return this.labelService.getUriLabel(this.getResource());
        }
        getTitle(verbosity) {
            switch (verbosity) {
                case 0 /* SHORT */:
                    return this.shortTitle;
                default:
                case 1 /* MEDIUM */:
                    return this.mediumTitle;
                case 2 /* LONG */:
                    return this.longTitle;
            }
        }
        async resolve() {
            if (!this._hasResolved) {
                this._hasResolved = true;
                await this._webviewEditorService.resolveWebview(this);
            }
            return super.resolve();
        }
        setState(newState) {
            this._state = newState;
            this._onDidChangeDirty.fire();
        }
        isDirty() {
            return this._state === 3 /* Dirty */;
        }
        async confirmSave() {
            if (!this.isDirty()) {
                return 1 /* DONT_SAVE */;
            }
            return textFileService_1.promptSave(this.dialogService, [this.getResource()]);
        }
        async save() {
            if (!this.isDirty) {
                return true;
            }
            const waitingOn = [];
            this._onWillSave.fire({
                waitUntil: (thenable) => { waitingOn.push(thenable); },
            });
            const result = await Promise.all(waitingOn);
            return result.every(x => x);
        }
    };
    CustomFileEditorInput.typeId = 'workbench.editors.webviewEditor';
    __decorate([
        decorators_1.memoize
    ], CustomFileEditorInput.prototype, "getName", null);
    __decorate([
        decorators_1.memoize
    ], CustomFileEditorInput.prototype, "getDescription", null);
    __decorate([
        decorators_1.memoize
    ], CustomFileEditorInput.prototype, "shortTitle", null);
    __decorate([
        decorators_1.memoize
    ], CustomFileEditorInput.prototype, "mediumTitle", null);
    __decorate([
        decorators_1.memoize
    ], CustomFileEditorInput.prototype, "longTitle", null);
    CustomFileEditorInput = __decorate([
        __param(4, label_1.ILabelService),
        __param(5, webviewEditorService_1.IWebviewEditorService),
        __param(6, dialogs_1.IDialogService)
    ], CustomFileEditorInput);
    exports.CustomFileEditorInput = CustomFileEditorInput;
});
//# sourceMappingURL=customEditorInput.js.map