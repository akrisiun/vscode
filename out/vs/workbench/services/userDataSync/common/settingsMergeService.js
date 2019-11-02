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
define(["require", "exports", "vs/base/common/objects", "vs/base/common/json", "vs/editor/common/core/editOperation", "vs/editor/common/services/modeService", "vs/base/common/jsonEdit", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/services/modelService", "vs/editor/common/core/position", "vs/platform/instantiation/common/extensions", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/map"], function (require, exports, objects, json_1, editOperation_1, modeService_1, jsonEdit_1, range_1, selection_1, modelService_1, position_1, extensions_1, userDataSync_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SettingsMergeService = class SettingsMergeService {
        constructor(modelService, modeService) {
            this.modelService = modelService;
            this.modeService = modeService;
        }
        async merge(localContent, remoteContent, baseContent, ignoredSettings) {
            const local = json_1.parse(localContent);
            const remote = json_1.parse(remoteContent);
            const base = baseContent ? json_1.parse(baseContent) : null;
            const ignored = ignoredSettings.reduce((set, key) => { set.add(key); return set; }, new Set());
            const localToRemote = this.compare(local, remote, ignored);
            if (localToRemote.added.size === 0 && localToRemote.removed.size === 0 && localToRemote.updated.size === 0) {
                // No changes found between local and remote.
                return { mergeContent: localContent, hasChanges: false, hasConflicts: false };
            }
            const conflicts = new Set();
            const baseToLocal = base ? this.compare(base, local, ignored) : { added: Object.keys(local).reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
            const baseToRemote = base ? this.compare(base, remote, ignored) : { added: Object.keys(remote).reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
            const settingsPreviewModel = this.modelService.createModel(localContent, this.modeService.create('jsonc'));
            // Removed settings in Local
            for (const key of map_1.values(baseToLocal.removed)) {
                // Got updated in remote
                if (baseToRemote.updated.has(key)) {
                    conflicts.add(key);
                }
            }
            // Removed settings in Remote
            for (const key of map_1.values(baseToRemote.removed)) {
                if (conflicts.has(key)) {
                    continue;
                }
                // Got updated in local
                if (baseToLocal.updated.has(key)) {
                    conflicts.add(key);
                }
                else {
                    this.editSetting(settingsPreviewModel, key, undefined);
                }
            }
            // Added settings in Local
            for (const key of map_1.values(baseToLocal.added)) {
                if (conflicts.has(key)) {
                    continue;
                }
                // Got added in remote
                if (baseToRemote.added.has(key)) {
                    // Has different value
                    if (localToRemote.updated.has(key)) {
                        conflicts.add(key);
                    }
                }
            }
            // Added settings in remote
            for (const key of map_1.values(baseToRemote.added)) {
                if (conflicts.has(key)) {
                    continue;
                }
                // Got added in local
                if (baseToLocal.added.has(key)) {
                    // Has different value
                    if (localToRemote.updated.has(key)) {
                        conflicts.add(key);
                    }
                }
                else {
                    this.editSetting(settingsPreviewModel, key, remote[key]);
                }
            }
            // Updated settings in Local
            for (const key of map_1.values(baseToLocal.updated)) {
                if (conflicts.has(key)) {
                    continue;
                }
                // Got updated in remote
                if (baseToRemote.updated.has(key)) {
                    // Has different value
                    if (localToRemote.updated.has(key)) {
                        conflicts.add(key);
                    }
                }
            }
            // Updated settings in Remote
            for (const key of map_1.values(baseToRemote.updated)) {
                if (conflicts.has(key)) {
                    continue;
                }
                // Got updated in local
                if (baseToLocal.updated.has(key)) {
                    // Has different value
                    if (localToRemote.updated.has(key)) {
                        conflicts.add(key);
                    }
                }
                else {
                    this.editSetting(settingsPreviewModel, key, remote[key]);
                }
            }
            for (const key of map_1.values(conflicts)) {
                const tree = json_1.parseTree(settingsPreviewModel.getValue());
                const valueNode = json_1.findNodeAtLocation(tree, [key]);
                const eol = settingsPreviewModel.getEOL();
                const remoteEdit = jsonEdit_1.setProperty(`{${eol}\t${eol}}`, [key], remote[key], { tabSize: 4, insertSpaces: false, eol: eol })[0];
                const remoteContent = remoteEdit ? `${remoteEdit.content.substring(remoteEdit.offset + remoteEdit.length + 1)},${eol}` : '';
                if (valueNode) {
                    // Updated in Local and Remote with different value
                    const keyPosition = settingsPreviewModel.getPositionAt(valueNode.parent.offset);
                    const valuePosition = settingsPreviewModel.getPositionAt(valueNode.offset + valueNode.length);
                    const editOperations = [
                        editOperation_1.EditOperation.insert(new position_1.Position(keyPosition.lineNumber - 1, settingsPreviewModel.getLineMaxColumn(keyPosition.lineNumber - 1)), `${eol}<<<<<<< local`),
                        editOperation_1.EditOperation.insert(new position_1.Position(valuePosition.lineNumber, settingsPreviewModel.getLineMaxColumn(valuePosition.lineNumber)), `${eol}=======${eol}${remoteContent}>>>>>>> remote`)
                    ];
                    settingsPreviewModel.pushEditOperations([new selection_1.Selection(keyPosition.lineNumber, keyPosition.column, keyPosition.lineNumber, keyPosition.column)], editOperations, () => []);
                }
                else {
                    // Removed in Local, but updated in Remote
                    const position = new position_1.Position(settingsPreviewModel.getLineCount() - 1, settingsPreviewModel.getLineMaxColumn(settingsPreviewModel.getLineCount() - 1));
                    const editOperations = [
                        editOperation_1.EditOperation.insert(position, `${eol}<<<<<<< local${eol}=======${eol}${remoteContent}>>>>>>> remote`)
                    ];
                    settingsPreviewModel.pushEditOperations([new selection_1.Selection(position.lineNumber, position.column, position.lineNumber, position.column)], editOperations, () => []);
                }
            }
            return { mergeContent: settingsPreviewModel.getValue(), hasChanges: true, hasConflicts: conflicts.size > 0 };
        }
        async computeRemoteContent(localContent, remoteContent, ignoredSettings) {
            const remote = json_1.parse(remoteContent);
            const remoteModel = this.modelService.createModel(localContent, this.modeService.create('jsonc'));
            const ignored = ignoredSettings.reduce((set, key) => { set.add(key); return set; }, new Set());
            for (const key of Object.keys(ignoredSettings)) {
                if (ignored.has(key)) {
                    this.editSetting(remoteModel, key, undefined);
                    this.editSetting(remoteModel, key, remote[key]);
                }
            }
            return remoteModel.getValue();
        }
        editSetting(model, key, value) {
            const insertSpaces = false;
            const tabSize = 4;
            const eol = model.getEOL();
            const edit = jsonEdit_1.setProperty(model.getValue(), [key], value, { tabSize, insertSpaces, eol })[0];
            if (edit) {
                const startPosition = model.getPositionAt(edit.offset);
                const endPosition = model.getPositionAt(edit.offset + edit.length);
                const range = new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
                let currentText = model.getValueInRange(range);
                if (edit.content !== currentText) {
                    const editOperation = currentText ? editOperation_1.EditOperation.replace(range, edit.content) : editOperation_1.EditOperation.insert(startPosition, edit.content);
                    model.pushEditOperations([new selection_1.Selection(startPosition.lineNumber, startPosition.column, startPosition.lineNumber, startPosition.column)], [editOperation], () => []);
                }
            }
        }
        compare(from, to, ignored) {
            const fromKeys = Object.keys(from).filter(key => !ignored.has(key));
            const toKeys = Object.keys(to).filter(key => !ignored.has(key));
            const added = toKeys.filter(key => fromKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
            const removed = fromKeys.filter(key => toKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
            const updated = new Set();
            for (const key of fromKeys) {
                if (removed.has(key)) {
                    continue;
                }
                const value1 = from[key];
                const value2 = to[key];
                if (!objects.equals(value1, value2)) {
                    updated.add(key);
                }
            }
            return { added, removed, updated };
        }
    };
    SettingsMergeService = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, modeService_1.IModeService)
    ], SettingsMergeService);
    extensions_1.registerSingleton(userDataSync_1.ISettingsMergeService, SettingsMergeService);
});
//# sourceMappingURL=settingsMergeService.js.map