/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/common/model/textModel", "vs/editor/test/browser/editorTestServices", "vs/editor/test/common/mocks/testConfiguration", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService"], function (require, exports, codeEditorService_1, codeEditorWidget_1, textModel_1, editorTestServices_1, testConfiguration_1, commands_1, contextkey_1, instantiationService_1, serviceCollection_1, mockKeybindingService_1, notification_1, testNotificationService_1, themeService_1, testThemeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestCodeEditor extends codeEditorWidget_1.CodeEditorWidget {
        //#region testing overrides
        _createConfiguration(options) {
            return new testConfiguration_1.TestConfiguration(options);
        }
        _createView(viewModel, cursor) {
            // Never create a view
            return [null, false];
        }
        //#endregion
        //#region Testing utils
        getCursor() {
            return this._modelData ? this._modelData.cursor : undefined;
        }
        registerAndInstantiateContribution(ctor) {
            let r = this._instantiationService.createInstance(ctor, this);
            this._contributions[r.getId()] = r;
            return r;
        }
        dispose() {
            super.dispose();
            if (this._modelData) {
                this._modelData.model.dispose();
            }
        }
    }
    exports.TestCodeEditor = TestCodeEditor;
    class TestEditorDomElement {
        constructor() {
            this.parentElement = null;
        }
        setAttribute(attr, value) { }
        removeAttribute(attr) { }
        hasAttribute(attr) { return false; }
        getAttribute(attr) { return undefined; }
        addEventListener(event) { }
        removeEventListener(event) { }
    }
    function withTestCodeEditor(text, options, callback) {
        // create a model if necessary and remember it in order to dispose it.
        if (!options.model) {
            if (typeof text === 'string') {
                options.model = textModel_1.TextModel.createFromString(text);
            }
            else if (text) {
                options.model = textModel_1.TextModel.createFromString(text.join('\n'));
            }
        }
        let editor = createTestCodeEditor(options);
        callback(editor, editor.getCursor());
        editor.dispose();
    }
    exports.withTestCodeEditor = withTestCodeEditor;
    function createTestCodeEditor(options) {
        const model = options.model;
        delete options.model;
        const services = options.serviceCollection || new serviceCollection_1.ServiceCollection();
        delete options.serviceCollection;
        const instantiationService = new instantiationService_1.InstantiationService(services);
        if (!services.has(codeEditorService_1.ICodeEditorService)) {
            services.set(codeEditorService_1.ICodeEditorService, new editorTestServices_1.TestCodeEditorService());
        }
        if (!services.has(contextkey_1.IContextKeyService)) {
            services.set(contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService());
        }
        if (!services.has(notification_1.INotificationService)) {
            services.set(notification_1.INotificationService, new testNotificationService_1.TestNotificationService());
        }
        if (!services.has(commands_1.ICommandService)) {
            services.set(commands_1.ICommandService, new editorTestServices_1.TestCommandService(instantiationService));
        }
        if (!services.has(themeService_1.IThemeService)) {
            services.set(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
        }
        const codeEditorWidgetOptions = {
            contributions: []
        };
        const editor = instantiationService.createInstance(TestCodeEditor, new TestEditorDomElement(), options, codeEditorWidgetOptions);
        editor.setModel(model);
        return editor;
    }
    exports.createTestCodeEditor = createTestCodeEditor;
});
//# sourceMappingURL=testCodeEditor.js.map