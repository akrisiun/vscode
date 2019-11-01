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
define(["require", "exports", "assert", "vs/workbench/api/browser/mainThreadSaveParticipant", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/test/workbenchTestServices", "vs/base/test/common/utils", "vs/editor/common/services/modelService", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, assert, mainThreadSaveParticipant_1, testConfigurationService_1, workbenchTestServices_1, utils_1, modelService_1, range_1, selection_1, textFileEditorModel_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ServiceAccessor = class ServiceAccessor {
        constructor(textFileService, modelService) {
            this.textFileService = textFileService;
            this.modelService = modelService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, textfiles_1.ITextFileService), __param(1, modelService_1.IModelService)
    ], ServiceAccessor);
    suite('MainThreadSaveParticipant', function () {
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
        });
        teardown(() => {
            accessor.textFileService.models.clear();
            textFileEditorModel_1.TextFileEditorModel.setSaveParticipant(null); // reset any set participant
        });
        test('insert final new line', async function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/final_new_line.txt'), 'utf8', undefined);
            await model.load();
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('files', { 'insertFinalNewline': true });
            const participant = new mainThreadSaveParticipant_1.FinalNewLineParticipant(configService, undefined);
            // No new line for empty lines
            let lineContent = '';
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* EXPLICIT */ });
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), lineContent);
            // No new line if last line already empty
            lineContent = `Hello New Line${model.textEditorModel.getEOL()}`;
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* EXPLICIT */ });
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), lineContent);
            // New empty line added (single line)
            lineContent = 'Hello New Line';
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* EXPLICIT */ });
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), `${lineContent}${model.textEditorModel.getEOL()}`);
            // New empty line added (multi line)
            lineContent = `Hello New Line${model.textEditorModel.getEOL()}Hello New Line${model.textEditorModel.getEOL()}Hello New Line`;
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* EXPLICIT */ });
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), `${lineContent}${model.textEditorModel.getEOL()}`);
        });
        test('trim final new lines', async function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/trim_final_new_line.txt'), 'utf8', undefined);
            await model.load();
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('files', { 'trimFinalNewlines': true });
            const participant = new mainThreadSaveParticipant_1.TrimFinalNewLinesParticipant(configService, undefined);
            const textContent = 'Trim New Line';
            const eol = `${model.textEditorModel.getEOL()}`;
            // No new line removal if last line is not new line
            let lineContent = `${textContent}`;
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* EXPLICIT */ });
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), lineContent);
            // No new line removal if last line is single new line
            lineContent = `${textContent}${eol}`;
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* EXPLICIT */ });
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), lineContent);
            // Remove new line (single line with two new lines)
            lineContent = `${textContent}${eol}${eol}`;
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* EXPLICIT */ });
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), `${textContent}${eol}`);
            // Remove new lines (multiple lines with multiple new lines)
            lineContent = `${textContent}${eol}${textContent}${eol}${eol}${eol}`;
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* EXPLICIT */ });
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), `${textContent}${eol}${textContent}${eol}`);
        });
        test('trim final new lines bug#39750', async function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/trim_final_new_line.txt'), 'utf8', undefined);
            await model.load();
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('files', { 'trimFinalNewlines': true });
            const participant = new mainThreadSaveParticipant_1.TrimFinalNewLinesParticipant(configService, undefined);
            const textContent = 'Trim New Line';
            // single line
            let lineContent = `${textContent}`;
            model.textEditorModel.setValue(lineContent);
            // apply edits and push to undo stack.
            let textEdits = [{ range: new range_1.Range(1, 14, 1, 14), text: '.', forceMoveMarkers: false }];
            model.textEditorModel.pushEditOperations([new selection_1.Selection(1, 14, 1, 14)], textEdits, () => { return [new selection_1.Selection(1, 15, 1, 15)]; });
            // undo
            model.textEditorModel.undo();
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), `${textContent}`);
            // trim final new lines should not mess the undo stack
            await participant.participate(model, { reason: 1 /* EXPLICIT */ });
            model.textEditorModel.redo();
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), `${textContent}.`);
        });
        test('trim final new lines bug#46075', async function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/trim_final_new_line.txt'), 'utf8', undefined);
            await model.load();
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('files', { 'trimFinalNewlines': true });
            const participant = new mainThreadSaveParticipant_1.TrimFinalNewLinesParticipant(configService, undefined);
            const textContent = 'Test';
            const eol = `${model.textEditorModel.getEOL()}`;
            let content = `${textContent}${eol}${eol}`;
            model.textEditorModel.setValue(content);
            // save many times
            for (let i = 0; i < 10; i++) {
                await participant.participate(model, { reason: 1 /* EXPLICIT */ });
            }
            // confirm trimming
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), `${textContent}${eol}`);
            // undo should go back to previous content immediately
            model.textEditorModel.undo();
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), `${textContent}${eol}${eol}`);
            model.textEditorModel.redo();
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), `${textContent}${eol}`);
        });
    });
});
//# sourceMappingURL=mainThreadSaveParticipant.test.js.map