/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/color", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/strings", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/embeddedCodeEditorWidget", "vs/editor/contrib/zoneWidget/zoneWidget", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/css!./media/peekViewWidget"], function (require, exports, dom, actionbar_1, actions_1, color_1, event_1, objects, strings, codeEditorService_1, embeddedCodeEditorWidget_1, zoneWidget_1, nls, contextkey_1, instantiation_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IPeekViewService = instantiation_1.createDecorator('IPeekViewService');
    extensions_1.registerSingleton(exports.IPeekViewService, class {
        constructor() {
            this._widgets = new Map();
        }
        addExclusiveWidget(editor, widget) {
            const existing = this._widgets.get(editor);
            if (existing) {
                existing.listener.dispose();
                existing.widget.dispose();
            }
            const remove = () => {
                const data = this._widgets.get(editor);
                if (data && data.widget === widget) {
                    data.listener.dispose();
                    this._widgets.delete(editor);
                }
            };
            this._widgets.set(editor, { widget, listener: widget.onDidClose(remove) });
        }
    });
    var PeekContext;
    (function (PeekContext) {
        PeekContext.inPeekEditor = new contextkey_1.RawContextKey('inReferenceSearchEditor', true);
        PeekContext.notInPeekEditor = PeekContext.inPeekEditor.toNegated();
    })(PeekContext = exports.PeekContext || (exports.PeekContext = {}));
    function getOuterEditor(accessor) {
        let editor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
        if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
            return editor.getParentEditor();
        }
        return editor;
    }
    exports.getOuterEditor = getOuterEditor;
    const defaultOptions = {
        headerBackgroundColor: color_1.Color.white,
        primaryHeadingColor: color_1.Color.fromHex('#333333'),
        secondaryHeadingColor: color_1.Color.fromHex('#6c6c6cb3')
    };
    class PeekViewWidget extends zoneWidget_1.ZoneWidget {
        constructor(editor, options = {}) {
            super(editor, options);
            this._onDidClose = new event_1.Emitter();
            objects.mixin(this.options, defaultOptions, false);
        }
        dispose() {
            super.dispose();
            this._onDidClose.fire(this);
        }
        get onDidClose() {
            return this._onDidClose.event;
        }
        style(styles) {
            let options = this.options;
            if (styles.headerBackgroundColor) {
                options.headerBackgroundColor = styles.headerBackgroundColor;
            }
            if (styles.primaryHeadingColor) {
                options.primaryHeadingColor = styles.primaryHeadingColor;
            }
            if (styles.secondaryHeadingColor) {
                options.secondaryHeadingColor = styles.secondaryHeadingColor;
            }
            super.style(styles);
        }
        _applyStyles() {
            super._applyStyles();
            let options = this.options;
            if (this._headElement && options.headerBackgroundColor) {
                this._headElement.style.backgroundColor = options.headerBackgroundColor.toString();
            }
            if (this._primaryHeading && options.primaryHeadingColor) {
                this._primaryHeading.style.color = options.primaryHeadingColor.toString();
            }
            if (this._secondaryHeading && options.secondaryHeadingColor) {
                this._secondaryHeading.style.color = options.secondaryHeadingColor.toString();
            }
            if (this._bodyElement && options.frameColor) {
                this._bodyElement.style.borderColor = options.frameColor.toString();
            }
        }
        _fillContainer(container) {
            this.setCssClass('peekview-widget');
            this._headElement = dom.$('.head');
            this._bodyElement = dom.$('.body');
            this._fillHead(this._headElement);
            this._fillBody(this._bodyElement);
            container.appendChild(this._headElement);
            container.appendChild(this._bodyElement);
        }
        _fillHead(container) {
            const titleElement = dom.$('.peekview-title');
            dom.append(this._headElement, titleElement);
            dom.addStandardDisposableListener(titleElement, 'click', event => this._onTitleClick(event));
            this._fillTitleIcon(titleElement);
            this._primaryHeading = dom.$('span.filename');
            this._secondaryHeading = dom.$('span.dirname');
            this._metaHeading = dom.$('span.meta');
            dom.append(titleElement, this._primaryHeading, this._secondaryHeading, this._metaHeading);
            const actionsContainer = dom.$('.peekview-actions');
            dom.append(this._headElement, actionsContainer);
            const actionBarOptions = this._getActionBarOptions();
            this._actionbarWidget = new actionbar_1.ActionBar(actionsContainer, actionBarOptions);
            this._disposables.add(this._actionbarWidget);
            this._actionbarWidget.push(new actions_1.Action('peekview.close', nls.localize('label.close', "Close"), 'codicon-close', true, () => {
                this.dispose();
                return Promise.resolve();
            }), { label: false, icon: true });
        }
        _fillTitleIcon(container) {
        }
        _getActionBarOptions() {
            return {};
        }
        _onTitleClick(event) {
            // implement me
        }
        setTitle(primaryHeading, secondaryHeading) {
            if (this._primaryHeading && this._secondaryHeading) {
                this._primaryHeading.innerHTML = strings.escape(primaryHeading);
                this._primaryHeading.setAttribute('aria-label', primaryHeading);
                if (secondaryHeading) {
                    this._secondaryHeading.innerHTML = strings.escape(secondaryHeading);
                }
                else {
                    dom.clearNode(this._secondaryHeading);
                }
            }
        }
        setMetaTitle(value) {
            if (this._metaHeading) {
                if (value) {
                    this._metaHeading.innerHTML = strings.escape(value);
                }
                else {
                    dom.clearNode(this._metaHeading);
                }
            }
        }
        _doLayout(heightInPixel, widthInPixel) {
            if (!this._isShowing && heightInPixel < 0) {
                // Looks like the view zone got folded away!
                this.dispose();
                return;
            }
            const headHeight = Math.ceil(this.editor.getOption(45 /* lineHeight */) * 1.2);
            const bodyHeight = Math.round(heightInPixel - (headHeight + 2 /* the border-top/bottom width*/));
            this._doLayoutHead(headHeight, widthInPixel);
            this._doLayoutBody(bodyHeight, widthInPixel);
        }
        _doLayoutHead(heightInPixel, widthInPixel) {
            if (this._headElement) {
                this._headElement.style.height = `${heightInPixel}px`;
                this._headElement.style.lineHeight = this._headElement.style.height;
            }
        }
        _doLayoutBody(heightInPixel, widthInPixel) {
            if (this._bodyElement) {
                this._bodyElement.style.height = `${heightInPixel}px`;
            }
        }
    }
    exports.PeekViewWidget = PeekViewWidget;
});
//# sourceMappingURL=peekViewWidget.js.map