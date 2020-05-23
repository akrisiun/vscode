/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/editor/browser/services/abstractCodeEditorService", "vs/platform/commands/common/commands"], function (require, exports, event_1, abstractCodeEditorService_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestCommandService = exports.TestCodeEditorService = void 0;
    class TestCodeEditorService extends abstractCodeEditorService_1.AbstractCodeEditorService {
        getActiveCodeEditor() { return null; }
        openCodeEditor(input, source, sideBySide) {
            this.lastInput = input;
            return Promise.resolve(null);
        }
        registerDecorationType(key, options, parentTypeKey) { }
        removeDecorationType(key) { }
        resolveDecorationOptions(decorationTypeKey, writable) { return {}; }
    }
    exports.TestCodeEditorService = TestCodeEditorService;
    class TestCommandService {
        constructor(instantiationService) {
            this._onWillExecuteCommand = new event_1.Emitter();
            this.onWillExecuteCommand = this._onWillExecuteCommand.event;
            this._onDidExecuteCommand = new event_1.Emitter();
            this.onDidExecuteCommand = this._onDidExecuteCommand.event;
            this._instantiationService = instantiationService;
        }
        executeCommand(id, ...args) {
            const command = commands_1.CommandsRegistry.getCommand(id);
            if (!command) {
                return Promise.reject(new Error(`command '${id}' not found`));
            }
            try {
                this._onWillExecuteCommand.fire({ commandId: id, args });
                const result = this._instantiationService.invokeFunction.apply(this._instantiationService, [command.handler, ...args]);
                this._onDidExecuteCommand.fire({ commandId: id, args });
                return Promise.resolve(result);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    }
    exports.TestCommandService = TestCommandService;
});
//# sourceMappingURL=editorTestServices.js.map