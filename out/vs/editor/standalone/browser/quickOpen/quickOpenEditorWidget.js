/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/parts/quickopen/browser/quickOpenWidget", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler"], function (require, exports, dom_1, quickOpenWidget_1, colorRegistry_1, styler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class QuickOpenEditorWidget {
        constructor(codeEditor, onOk, onCancel, onType, configuration, themeService) {
            this.codeEditor = codeEditor;
            this.themeService = themeService;
            this.visible = false;
            this.domNode = document.createElement('div');
            this.quickOpenWidget = new quickOpenWidget_1.QuickOpenWidget(this.domNode, {
                onOk: onOk,
                onCancel: onCancel,
                onType: onType
            }, {
                inputPlaceHolder: undefined,
                inputAriaLabel: configuration.inputAriaLabel,
                keyboardSupport: true
            });
            this.styler = styler_1.attachQuickOpenStyler(this.quickOpenWidget, this.themeService, {
                pickerGroupForeground: colorRegistry_1.foreground
            });
            this.quickOpenWidget.create();
            this.codeEditor.addOverlayWidget(this);
        }
        setInput(model, focus) {
            this.quickOpenWidget.setInput(model, focus);
        }
        getId() {
            return QuickOpenEditorWidget.ID;
        }
        getDomNode() {
            return this.domNode;
        }
        destroy() {
            this.codeEditor.removeOverlayWidget(this);
            this.quickOpenWidget.dispose();
            this.styler.dispose();
        }
        isVisible() {
            return !!this.visible;
        }
        show(value) {
            this.visible = true;
            const editorLayout = this.codeEditor.getLayoutInfo();
            if (editorLayout) {
                this.quickOpenWidget.layout(new dom_1.Dimension(editorLayout.width, editorLayout.height));
            }
            this.quickOpenWidget.show(value);
            this.codeEditor.layoutOverlayWidget(this);
        }
        hide() {
            this.visible = false;
            this.quickOpenWidget.hide();
            this.codeEditor.layoutOverlayWidget(this);
        }
        getPosition() {
            if (this.visible) {
                return {
                    preference: 2 /* TOP_CENTER */
                };
            }
            return null;
        }
    }
    exports.QuickOpenEditorWidget = QuickOpenEditorWidget;
    QuickOpenEditorWidget.ID = 'editor.contrib.quickOpenEditorWidget';
});
//# sourceMappingURL=quickOpenEditorWidget.js.map