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
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/platform/theme/common/themeService", "vs/base/common/cancellation", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/platform/accessibility/common/accessibility", "vs/platform/layout/browser/layoutService", "vs/editor/browser/services/codeEditorService", "vs/platform/quickinput/browser/quickInput", "vs/base/common/functional", "vs/css!./standaloneQuickInput"], function (require, exports, editorExtensions_1, themeService_1, cancellation_1, instantiation_1, contextkey_1, accessibility_1, layoutService_1, codeEditorService_1, quickInput_1, functional_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickInputEditorWidget = exports.QuickInputEditorContribution = exports.StandaloneQuickInputServiceImpl = exports.EditorScopedQuickInputServiceImpl = void 0;
    let EditorScopedQuickInputServiceImpl = /** @class */ (() => {
        let EditorScopedQuickInputServiceImpl = class EditorScopedQuickInputServiceImpl extends quickInput_1.QuickInputService {
            constructor(editor, instantiationService, contextKeyService, themeService, accessibilityService, layoutService) {
                super(instantiationService, contextKeyService, themeService, accessibilityService, layoutService);
                this.host = undefined;
                // Use the passed in code editor as host for the quick input widget
                const contribution = QuickInputEditorContribution.get(editor);
                this.host = {
                    _serviceBrand: undefined,
                    get container() { return contribution.widget.getDomNode(); },
                    get dimension() { return editor.getLayoutInfo(); },
                    get onLayout() { return editor.onDidLayoutChange; },
                    focus: () => editor.focus()
                };
            }
            createController() {
                return super.createController(this.host);
            }
        };
        EditorScopedQuickInputServiceImpl = __decorate([
            __param(1, instantiation_1.IInstantiationService),
            __param(2, contextkey_1.IContextKeyService),
            __param(3, themeService_1.IThemeService),
            __param(4, accessibility_1.IAccessibilityService),
            __param(5, layoutService_1.ILayoutService)
        ], EditorScopedQuickInputServiceImpl);
        return EditorScopedQuickInputServiceImpl;
    })();
    exports.EditorScopedQuickInputServiceImpl = EditorScopedQuickInputServiceImpl;
    let StandaloneQuickInputServiceImpl = /** @class */ (() => {
        let StandaloneQuickInputServiceImpl = class StandaloneQuickInputServiceImpl {
            constructor(instantiationService, codeEditorService) {
                this.instantiationService = instantiationService;
                this.codeEditorService = codeEditorService;
                this.mapEditorToService = new Map();
            }
            get activeService() {
                const editor = this.codeEditorService.getFocusedCodeEditor();
                if (!editor) {
                    throw new Error('Quick input service needs a focused editor to work.');
                }
                // Find the quick input implementation for the focused
                // editor or create it lazily if not yet created
                let quickInputService = this.mapEditorToService.get(editor);
                if (!quickInputService) {
                    const newQuickInputService = quickInputService = this.instantiationService.createInstance(EditorScopedQuickInputServiceImpl, editor);
                    this.mapEditorToService.set(editor, quickInputService);
                    functional_1.once(editor.onDidDispose)(() => {
                        newQuickInputService.dispose();
                        this.mapEditorToService.delete(editor);
                    });
                }
                return quickInputService;
            }
            get quickAccess() { return this.activeService.quickAccess; }
            get backButton() { return this.activeService.backButton; }
            get onShow() { return this.activeService.onShow; }
            get onHide() { return this.activeService.onHide; }
            pick(picks, options = {}, token = cancellation_1.CancellationToken.None) {
                return this.activeService /* TS fail */.pick(picks, options, token);
            }
            input(options, token) {
                return this.activeService.input(options, token);
            }
            createQuickPick() {
                return this.activeService.createQuickPick();
            }
            createInputBox() {
                return this.activeService.createInputBox();
            }
            focus() {
                return this.activeService.focus();
            }
            toggle() {
                return this.activeService.toggle();
            }
            navigate(next, quickNavigate) {
                return this.activeService.navigate(next, quickNavigate);
            }
            accept() {
                return this.activeService.accept();
            }
            back() {
                return this.activeService.back();
            }
            cancel() {
                return this.activeService.cancel();
            }
        };
        StandaloneQuickInputServiceImpl = __decorate([
            __param(0, instantiation_1.IInstantiationService),
            __param(1, codeEditorService_1.ICodeEditorService)
        ], StandaloneQuickInputServiceImpl);
        return StandaloneQuickInputServiceImpl;
    })();
    exports.StandaloneQuickInputServiceImpl = StandaloneQuickInputServiceImpl;
    let QuickInputEditorContribution = /** @class */ (() => {
        class QuickInputEditorContribution {
            constructor(editor) {
                this.editor = editor;
                this.widget = new QuickInputEditorWidget(this.editor);
            }
            static get(editor) {
                return editor.getContribution(QuickInputEditorContribution.ID);
            }
            dispose() {
                this.widget.dispose();
            }
        }
        QuickInputEditorContribution.ID = 'editor.controller.quickInput';
        return QuickInputEditorContribution;
    })();
    exports.QuickInputEditorContribution = QuickInputEditorContribution;
    let QuickInputEditorWidget = /** @class */ (() => {
        class QuickInputEditorWidget {
            constructor(codeEditor) {
                this.codeEditor = codeEditor;
                this.domNode = document.createElement('div');
                this.codeEditor.addOverlayWidget(this);
            }
            getId() {
                return QuickInputEditorWidget.ID;
            }
            getDomNode() {
                return this.domNode;
            }
            getPosition() {
                return { preference: 2 /* TOP_CENTER */ };
            }
            dispose() {
                this.codeEditor.removeOverlayWidget(this);
            }
        }
        QuickInputEditorWidget.ID = 'editor.contrib.quickInputWidget';
        return QuickInputEditorWidget;
    })();
    exports.QuickInputEditorWidget = QuickInputEditorWidget;
    editorExtensions_1.registerEditorContribution(QuickInputEditorContribution.ID, QuickInputEditorContribution);
});
//# sourceMappingURL=standaloneQuickInputServiceImpl.js.map