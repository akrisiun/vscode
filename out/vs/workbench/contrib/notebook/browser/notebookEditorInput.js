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
define(["require", "exports", "vs/workbench/common/editor", "vs/base/common/event", "vs/workbench/contrib/notebook/browser/notebookService", "vs/base/common/resources", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService"], function (require, exports, editor_1, event_1, notebookService_1, resources_1, workingCopyService_1, filesConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorInput = exports.NotebookEditorModel = void 0;
    class NotebookEditorModel extends editor_1.EditorModel {
        constructor(_notebook) {
            super();
            this._notebook = _notebook;
            this._dirty = false;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeCells = new event_1.Emitter();
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            if (_notebook && _notebook.onDidChangeCells) {
                this._register(_notebook.onDidChangeContent(() => {
                    this._dirty = true;
                    this._onDidChangeDirty.fire();
                    this._onDidChangeContent.fire();
                }));
                this._register(_notebook.onDidChangeCells((e) => {
                    this._onDidChangeCells.fire(e);
                }));
            }
        }
        get onDidChangeCells() { return this._onDidChangeCells.event; }
        get notebook() {
            return this._notebook;
        }
        isDirty() {
            return this._dirty;
        }
        getNotebook() {
            return this._notebook;
        }
        insertCell(cell, index) {
            let notebook = this.getNotebook();
            if (notebook) {
                this.notebook.insertNewCell(index, [cell]);
                this._dirty = true;
                this._onDidChangeDirty.fire();
            }
        }
        deleteCell(index) {
            let notebook = this.getNotebook();
            if (notebook) {
                this.notebook.removeCell(index);
            }
        }
        moveCellToIdx(index, newIdx) {
            this.notebook.moveCellToIdx(index, newIdx);
        }
        async save() {
            if (this._notebook) {
                this._dirty = false;
                this._onDidChangeDirty.fire();
                // todo, flush all states
                return true;
            }
            return false;
        }
    }
    exports.NotebookEditorModel = NotebookEditorModel;
    let NotebookEditorInput = /** @class */ (() => {
        let NotebookEditorInput = class NotebookEditorInput extends editor_1.EditorInput {
            constructor(resource, name, viewType, notebookService, workingCopyService, filesConfigurationService) {
                super();
                this.resource = resource;
                this.name = name;
                this.viewType = viewType;
                this.notebookService = notebookService;
                this.workingCopyService = workingCopyService;
                this.filesConfigurationService = filesConfigurationService;
                this.promise = null;
                this.textModel = null;
                this._onDidChangeContent = this._register(new event_1.Emitter());
                this.onDidChangeContent = this._onDidChangeContent.event;
                const input = this;
                const workingCopyAdapter = new class {
                    constructor() {
                        this.resource = input.resource.with({ scheme: 'vscode-notebook' });
                        this.capabilities = input.isUntitled() ? 2 /* Untitled */ : 0;
                        this.onDidChangeDirty = input.onDidChangeDirty;
                        this.onDidChangeContent = input.onDidChangeContent;
                    }
                    get name() { return input.getName(); }
                    isDirty() { return input.isDirty(); }
                    backup() { return input.backup(); }
                    save(options) { return input.save(0, options).then(editor => !!editor); }
                    revert(options) { return input.revert(0, options); }
                };
                this._register(this.workingCopyService.registerWorkingCopy(workingCopyAdapter));
            }
            static getOrCreate(instantiationService, resource, name, viewType) {
                const key = resource.toString() + viewType;
                let input = NotebookEditorInput._instances.get(key);
                if (!input) {
                    input = instantiationService.createInstance(class extends NotebookEditorInput {
                        dispose() {
                            NotebookEditorInput._instances.delete(key);
                            super.dispose();
                        }
                    }, resource, name, viewType);
                    NotebookEditorInput._instances.set(key, input);
                }
                return input;
            }
            getTypeId() {
                return NotebookEditorInput.ID;
            }
            getName() {
                return this.name;
            }
            isDirty() {
                var _a;
                return ((_a = this.textModel) === null || _a === void 0 ? void 0 : _a.isDirty()) || false;
            }
            isReadonly() {
                return false;
            }
            isSaving() {
                if (this.isUntitled()) {
                    return false; // untitled is never saving automatically
                }
                if (!this.isDirty()) {
                    return false; // the editor needs to be dirty for being saved
                }
                if (this.filesConfigurationService.getAutoSaveMode() === 1 /* AFTER_SHORT_DELAY */) {
                    return true; // a short auto save is configured, treat this as being saved
                }
                return false;
            }
            async save(group, options) {
                if (this.textModel) {
                    await this.notebookService.save(this.textModel.notebook.viewType, this.textModel.notebook.uri);
                    await this.textModel.save();
                    return this;
                }
                return undefined;
            }
            async revert(group, options) {
                if (this.textModel) {
                    // TODO@rebornix we need hashing
                    await this.textModel.save();
                }
            }
            async resolve() {
                if (this.textModel) {
                    return this.textModel;
                }
                if (!this.promise) {
                    if (!await this.notebookService.canResolve(this.viewType)) {
                        throw new Error(`Cannot open notebook of type '${this.viewType}'`);
                    }
                    this.promise = this.notebookService.resolveNotebook(this.viewType, this.resource).then(notebook => {
                        this.textModel = new NotebookEditorModel(notebook);
                        this.textModel.onDidChangeDirty(() => this._onDidChangeDirty.fire());
                        this.textModel.onDidChangeContent(() => {
                            this._onDidChangeContent.fire();
                        });
                        return this.textModel;
                    });
                }
                return this.promise;
            }
            async backup() {
                throw new Error();
            }
            matches(otherInput) {
                if (this === otherInput) {
                    return true;
                }
                if (otherInput instanceof NotebookEditorInput) {
                    return this.viewType === otherInput.viewType
                        && resources_1.isEqual(this.resource, otherInput.resource);
                }
                return false;
            }
            dispose() {
                if (this.textModel) {
                    this.notebookService.destoryNotebookDocument(this.textModel.notebook.viewType, this.textModel.notebook);
                }
                super.dispose();
            }
        };
        NotebookEditorInput._instances = new Map();
        NotebookEditorInput.ID = 'workbench.input.notebook';
        NotebookEditorInput = __decorate([
            __param(3, notebookService_1.INotebookService),
            __param(4, workingCopyService_1.IWorkingCopyService),
            __param(5, filesConfigurationService_1.IFilesConfigurationService)
        ], NotebookEditorInput);
        return NotebookEditorInput;
    })();
    exports.NotebookEditorInput = NotebookEditorInput;
});
//# sourceMappingURL=notebookEditorInput.js.map