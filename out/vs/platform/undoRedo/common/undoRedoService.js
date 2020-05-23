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
define(["require", "exports", "vs/nls", "vs/platform/undoRedo/common/undoRedo", "vs/base/common/errors", "vs/platform/instantiation/common/extensions", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/base/common/network", "vs/platform/notification/common/notification"], function (require, exports, nls, undoRedo_1, errors_1, extensions_1, dialogs_1, severity_1, network_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UndoRedoService = void 0;
    function uriGetComparisonKey(resource) {
        return resource.toString();
    }
    class ResourceStackElement {
        constructor(actual) {
            this.type = 0 /* Resource */;
            this.actual = actual;
            this.label = actual.label;
            this.resource = actual.resource;
            this.strResource = uriGetComparisonKey(this.resource);
            this.resources = [this.resource];
            this.strResources = [this.strResource];
            this.isValid = true;
        }
        setValid(isValid) {
            this.isValid = isValid;
        }
    }
    var RemovedResourceReason;
    (function (RemovedResourceReason) {
        RemovedResourceReason[RemovedResourceReason["ExternalRemoval"] = 0] = "ExternalRemoval";
        RemovedResourceReason[RemovedResourceReason["NoParallelUniverses"] = 1] = "NoParallelUniverses";
    })(RemovedResourceReason || (RemovedResourceReason = {}));
    class ResourceReasonPair {
        constructor(resource, reason) {
            this.resource = resource;
            this.reason = reason;
        }
    }
    class RemovedResources {
        constructor() {
            this.elements = new Map();
        }
        _getPath(resource) {
            return resource.scheme === network_1.Schemas.file ? resource.fsPath : resource.path;
        }
        createMessage() {
            const externalRemoval = [];
            const noParallelUniverses = [];
            for (const [, element] of this.elements) {
                const dest = (element.reason === 0 /* ExternalRemoval */
                    ? externalRemoval
                    : noParallelUniverses);
                dest.push(this._getPath(element.resource));
            }
            let messages = [];
            if (externalRemoval.length > 0) {
                messages.push(nls.localize('externalRemoval', "The following files have been closed: {0}.", externalRemoval.join(', ')));
            }
            if (noParallelUniverses.length > 0) {
                messages.push(nls.localize('noParallelUniverses', "The following files have been modified in an incompatible way: {0}.", noParallelUniverses.join(', ')));
            }
            return messages.join('\n');
        }
        get size() {
            return this.elements.size;
        }
        has(strResource) {
            return this.elements.has(strResource);
        }
        set(strResource, value) {
            this.elements.set(strResource, value);
        }
        delete(strResource) {
            return this.elements.delete(strResource);
        }
    }
    class WorkspaceStackElement {
        constructor(actual) {
            this.type = 1 /* Workspace */;
            this.actual = actual;
            this.label = actual.label;
            this.resources = actual.resources.slice(0);
            this.strResources = this.resources.map(resource => uriGetComparisonKey(resource));
            this.removedResources = null;
            this.invalidatedResources = null;
        }
        removeResource(resource, strResource, reason) {
            if (!this.removedResources) {
                this.removedResources = new RemovedResources();
            }
            if (!this.removedResources.has(strResource)) {
                this.removedResources.set(strResource, new ResourceReasonPair(resource, reason));
            }
        }
        setValid(resource, strResource, isValid) {
            if (isValid) {
                if (this.invalidatedResources) {
                    this.invalidatedResources.delete(strResource);
                    if (this.invalidatedResources.size === 0) {
                        this.invalidatedResources = null;
                    }
                }
            }
            else {
                if (!this.invalidatedResources) {
                    this.invalidatedResources = new RemovedResources();
                }
                if (!this.invalidatedResources.has(strResource)) {
                    this.invalidatedResources.set(strResource, new ResourceReasonPair(resource, 0 /* ExternalRemoval */));
                }
            }
        }
    }
    class ResourceEditStack {
        constructor(resource) {
            this.resource = resource;
            this.past = [];
            this.future = [];
        }
    }
    let UndoRedoService = /** @class */ (() => {
        let UndoRedoService = class UndoRedoService {
            constructor(_dialogService, _notificationService) {
                this._dialogService = _dialogService;
                this._notificationService = _notificationService;
                this._editStacks = new Map();
            }
            pushElement(_element) {
                const element = (_element.type === 0 /* Resource */ ? new ResourceStackElement(_element) : new WorkspaceStackElement(_element));
                for (let i = 0, len = element.resources.length; i < len; i++) {
                    const resource = element.resources[i];
                    const strResource = element.strResources[i];
                    let editStack;
                    if (this._editStacks.has(strResource)) {
                        editStack = this._editStacks.get(strResource);
                    }
                    else {
                        editStack = new ResourceEditStack(resource);
                        this._editStacks.set(strResource, editStack);
                    }
                    // remove the future
                    for (const futureElement of editStack.future) {
                        if (futureElement.type === 1 /* Workspace */) {
                            futureElement.removeResource(resource, strResource, 1 /* NoParallelUniverses */);
                        }
                    }
                    editStack.future = [];
                    if (editStack.past.length > 0) {
                        const lastElement = editStack.past[editStack.past.length - 1];
                        if (lastElement.type === 0 /* Resource */ && !lastElement.isValid) {
                            // clear undo stack
                            editStack.past = [];
                        }
                    }
                    editStack.past.push(element);
                }
            }
            getLastElement(resource) {
                const strResource = uriGetComparisonKey(resource);
                if (this._editStacks.has(strResource)) {
                    const editStack = this._editStacks.get(strResource);
                    if (editStack.future.length > 0) {
                        return null;
                    }
                    if (editStack.past.length === 0) {
                        return null;
                    }
                    return editStack.past[editStack.past.length - 1].actual;
                }
                return null;
            }
            _splitPastWorkspaceElement(toRemove, ignoreResources) {
                const individualArr = toRemove.actual.split();
                const individualMap = new Map();
                for (const _element of individualArr) {
                    const element = new ResourceStackElement(_element);
                    individualMap.set(element.strResource, element);
                }
                for (const strResource of toRemove.strResources) {
                    if (ignoreResources && ignoreResources.has(strResource)) {
                        continue;
                    }
                    const editStack = this._editStacks.get(strResource);
                    for (let j = editStack.past.length - 1; j >= 0; j--) {
                        if (editStack.past[j] === toRemove) {
                            if (individualMap.has(strResource)) {
                                // gets replaced
                                editStack.past[j] = individualMap.get(strResource);
                            }
                            else {
                                // gets deleted
                                editStack.past.splice(j, 1);
                            }
                            break;
                        }
                    }
                }
            }
            _splitFutureWorkspaceElement(toRemove, ignoreResources) {
                const individualArr = toRemove.actual.split();
                const individualMap = new Map();
                for (const _element of individualArr) {
                    const element = new ResourceStackElement(_element);
                    individualMap.set(element.strResource, element);
                }
                for (const strResource of toRemove.strResources) {
                    if (ignoreResources && ignoreResources.has(strResource)) {
                        continue;
                    }
                    const editStack = this._editStacks.get(strResource);
                    for (let j = editStack.future.length - 1; j >= 0; j--) {
                        if (editStack.future[j] === toRemove) {
                            if (individualMap.has(strResource)) {
                                // gets replaced
                                editStack.future[j] = individualMap.get(strResource);
                            }
                            else {
                                // gets deleted
                                editStack.future.splice(j, 1);
                            }
                            break;
                        }
                    }
                }
            }
            removeElements(resource) {
                const strResource = uriGetComparisonKey(resource);
                if (this._editStacks.has(strResource)) {
                    const editStack = this._editStacks.get(strResource);
                    for (const element of editStack.past) {
                        if (element.type === 1 /* Workspace */) {
                            element.removeResource(resource, strResource, 0 /* ExternalRemoval */);
                        }
                    }
                    for (const element of editStack.future) {
                        if (element.type === 1 /* Workspace */) {
                            element.removeResource(resource, strResource, 0 /* ExternalRemoval */);
                        }
                    }
                    this._editStacks.delete(strResource);
                }
            }
            setElementsIsValid(resource, isValid) {
                const strResource = uriGetComparisonKey(resource);
                if (this._editStacks.has(strResource)) {
                    const editStack = this._editStacks.get(strResource);
                    for (const element of editStack.past) {
                        if (element.type === 1 /* Workspace */) {
                            element.setValid(resource, strResource, isValid);
                        }
                        else {
                            element.setValid(isValid);
                        }
                    }
                    for (const element of editStack.future) {
                        if (element.type === 1 /* Workspace */) {
                            element.setValid(resource, strResource, isValid);
                        }
                        else {
                            element.setValid(isValid);
                        }
                    }
                }
            }
            // resource
            hasElements(resource) {
                const strResource = uriGetComparisonKey(resource);
                if (this._editStacks.has(strResource)) {
                    const editStack = this._editStacks.get(strResource);
                    return (editStack.past.length > 0 || editStack.future.length > 0);
                }
                return false;
            }
            getElements(resource) {
                const past = [];
                const future = [];
                const strResource = uriGetComparisonKey(resource);
                if (this._editStacks.has(strResource)) {
                    const editStack = this._editStacks.get(strResource);
                    for (const element of editStack.past) {
                        past.push(element.actual);
                    }
                    for (const element of editStack.future) {
                        future.push(element.actual);
                    }
                }
                return { past, future };
            }
            canUndo(resource) {
                const strResource = uriGetComparisonKey(resource);
                if (this._editStacks.has(strResource)) {
                    const editStack = this._editStacks.get(strResource);
                    return (editStack.past.length > 0);
                }
                return false;
            }
            _onError(err, element) {
                errors_1.onUnexpectedError(err);
                // An error occured while undoing or redoing => drop the undo/redo stack for all affected resources
                for (const resource of element.resources) {
                    this.removeElements(resource);
                }
                this._notificationService.error(err);
            }
            _safeInvoke(element, invoke) {
                let result;
                try {
                    result = invoke();
                }
                catch (err) {
                    return this._onError(err, element);
                }
                if (result) {
                    return result.then(undefined, (err) => this._onError(err, element));
                }
            }
            _workspaceUndo(resource, element) {
                if (element.removedResources) {
                    this._splitPastWorkspaceElement(element, element.removedResources);
                    const message = nls.localize('cannotWorkspaceUndo', "Could not undo '{0}' across all files. {1}", element.label, element.removedResources.createMessage());
                    this._notificationService.info(message);
                    return this.undo(resource);
                }
                if (element.invalidatedResources) {
                    this._splitPastWorkspaceElement(element, element.invalidatedResources);
                    const message = nls.localize('cannotWorkspaceUndo', "Could not undo '{0}' across all files. {1}", element.label, element.invalidatedResources.createMessage());
                    this._notificationService.info(message);
                    return this.undo(resource);
                }
                // this must be the last past element in all the impacted resources!
                let affectedEditStacks = [];
                for (const strResource of element.strResources) {
                    affectedEditStacks.push(this._editStacks.get(strResource));
                }
                let cannotUndoDueToResources = [];
                for (const editStack of affectedEditStacks) {
                    if (editStack.past.length === 0 || editStack.past[editStack.past.length - 1] !== element) {
                        cannotUndoDueToResources.push(editStack.resource);
                    }
                }
                if (cannotUndoDueToResources.length > 0) {
                    this._splitPastWorkspaceElement(element, null);
                    const paths = cannotUndoDueToResources.map(r => r.scheme === network_1.Schemas.file ? r.fsPath : r.path);
                    const message = nls.localize('cannotWorkspaceUndoDueToChanges', "Could not undo '{0}' across all files because changes were made to {1}", element.label, paths.join(', '));
                    this._notificationService.info(message);
                    return this.undo(resource);
                }
                return this._dialogService.show(severity_1.default.Info, nls.localize('confirmWorkspace', "Would you like to undo '{0}' across all files?", element.label), [
                    nls.localize('ok', "Undo in {0} Files", affectedEditStacks.length),
                    nls.localize('nok', "Undo this File"),
                    nls.localize('cancel', "Cancel"),
                ], {
                    cancelId: 2
                }).then((result) => {
                    if (result.choice === 2) {
                        // cancel
                        return;
                    }
                    else if (result.choice === 0) {
                        for (const editStack of affectedEditStacks) {
                            editStack.past.pop();
                            editStack.future.push(element);
                        }
                        return this._safeInvoke(element, () => element.actual.undo());
                    }
                    else {
                        this._splitPastWorkspaceElement(element, null);
                        return this.undo(resource);
                    }
                });
            }
            _resourceUndo(editStack, element) {
                if (!element.isValid) {
                    // invalid element => immediately flush edit stack!
                    editStack.past = [];
                    editStack.future = [];
                    return;
                }
                editStack.past.pop();
                editStack.future.push(element);
                return this._safeInvoke(element, () => element.actual.undo());
            }
            undo(resource) {
                const strResource = uriGetComparisonKey(resource);
                if (!this._editStacks.has(strResource)) {
                    return;
                }
                const editStack = this._editStacks.get(strResource);
                if (editStack.past.length === 0) {
                    return;
                }
                const element = editStack.past[editStack.past.length - 1];
                if (element.type === 1 /* Workspace */) {
                    return this._workspaceUndo(resource, element);
                }
                else {
                    return this._resourceUndo(editStack, element);
                }
            }
            canRedo(resource) {
                const strResource = uriGetComparisonKey(resource);
                if (this._editStacks.has(strResource)) {
                    const editStack = this._editStacks.get(strResource);
                    return (editStack.future.length > 0);
                }
                return false;
            }
            _workspaceRedo(resource, element) {
                if (element.removedResources) {
                    this._splitFutureWorkspaceElement(element, element.removedResources);
                    const message = nls.localize('cannotWorkspaceRedo', "Could not redo '{0}' across all files. {1}", element.label, element.removedResources.createMessage());
                    this._notificationService.info(message);
                    return this.redo(resource);
                }
                if (element.invalidatedResources) {
                    this._splitFutureWorkspaceElement(element, element.invalidatedResources);
                    const message = nls.localize('cannotWorkspaceRedo', "Could not redo '{0}' across all files. {1}", element.label, element.invalidatedResources.createMessage());
                    this._notificationService.info(message);
                    return this.redo(resource);
                }
                // this must be the last future element in all the impacted resources!
                let affectedEditStacks = [];
                for (const strResource of element.strResources) {
                    affectedEditStacks.push(this._editStacks.get(strResource));
                }
                let cannotRedoDueToResources = [];
                for (const editStack of affectedEditStacks) {
                    if (editStack.future.length === 0 || editStack.future[editStack.future.length - 1] !== element) {
                        cannotRedoDueToResources.push(editStack.resource);
                    }
                }
                if (cannotRedoDueToResources.length > 0) {
                    this._splitFutureWorkspaceElement(element, null);
                    const paths = cannotRedoDueToResources.map(r => r.scheme === network_1.Schemas.file ? r.fsPath : r.path);
                    const message = nls.localize('cannotWorkspaceRedoDueToChanges', "Could not redo '{0}' across all files because changes were made to {1}", element.label, paths.join(', '));
                    this._notificationService.info(message);
                    return this.redo(resource);
                }
                for (const editStack of affectedEditStacks) {
                    editStack.future.pop();
                    editStack.past.push(element);
                }
                return this._safeInvoke(element, () => element.actual.redo());
            }
            _resourceRedo(editStack, element) {
                if (!element.isValid) {
                    // invalid element => immediately flush edit stack!
                    editStack.past = [];
                    editStack.future = [];
                    return;
                }
                editStack.future.pop();
                editStack.past.push(element);
                return this._safeInvoke(element, () => element.actual.redo());
            }
            redo(resource) {
                const strResource = uriGetComparisonKey(resource);
                if (!this._editStacks.has(strResource)) {
                    return;
                }
                const editStack = this._editStacks.get(strResource);
                if (editStack.future.length === 0) {
                    return;
                }
                const element = editStack.future[editStack.future.length - 1];
                if (element.type === 1 /* Workspace */) {
                    return this._workspaceRedo(resource, element);
                }
                else {
                    return this._resourceRedo(editStack, element);
                }
            }
        };
        UndoRedoService = __decorate([
            __param(0, dialogs_1.IDialogService),
            __param(1, notification_1.INotificationService)
        ], UndoRedoService);
        return UndoRedoService;
    })();
    exports.UndoRedoService = UndoRedoService;
    extensions_1.registerSingleton(undoRedo_1.IUndoRedoService, UndoRedoService);
});
//# sourceMappingURL=undoRedoService.js.map