/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/view/dynamicViewOverlay", "vs/editor/common/view/editorColorRegistry", "vs/platform/theme/common/themeService", "vs/css!./currentLineMarginHighlight"], function (require, exports, dynamicViewOverlay_1, editorColorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CurrentLineMarginHighlightOverlay extends dynamicViewOverlay_1.DynamicViewOverlay {
        constructor(context) {
            super();
            this._context = context;
            const options = this._context.configuration.options;
            const layoutInfo = options.get(101 /* layoutInfo */);
            this._lineHeight = options.get(45 /* lineHeight */);
            this._renderLineHighlight = options.get(67 /* renderLineHighlight */);
            this._contentLeft = layoutInfo.contentLeft;
            this._selectionIsEmpty = true;
            this._primaryCursorLineNumber = 1;
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(101 /* layoutInfo */);
            this._lineHeight = options.get(45 /* lineHeight */);
            this._renderLineHighlight = options.get(67 /* renderLineHighlight */);
            this._contentLeft = layoutInfo.contentLeft;
            return true;
        }
        onCursorStateChanged(e) {
            let hasChanged = false;
            const primaryCursorLineNumber = e.selections[0].positionLineNumber;
            if (this._primaryCursorLineNumber !== primaryCursorLineNumber) {
                this._primaryCursorLineNumber = primaryCursorLineNumber;
                hasChanged = true;
            }
            const selectionIsEmpty = e.selections[0].isEmpty();
            if (this._selectionIsEmpty !== selectionIsEmpty) {
                this._selectionIsEmpty = selectionIsEmpty;
                return true;
            }
            return hasChanged;
        }
        onFlushed(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        prepareRender(ctx) {
        }
        render(startLineNumber, lineNumber) {
            if (lineNumber === this._primaryCursorLineNumber) {
                let className = 'current-line';
                if (this._shouldShowCurrentLine()) {
                    const paintedInContent = this._willRenderContentCurrentLine();
                    className = 'current-line current-line-margin' + (paintedInContent ? ' current-line-margin-both' : '');
                }
                return ('<div class="'
                    + className
                    + '" style="width:'
                    + String(this._contentLeft)
                    + 'px; height:'
                    + String(this._lineHeight)
                    + 'px;"></div>');
            }
            return '';
        }
        _shouldShowCurrentLine() {
            return ((this._renderLineHighlight === 'gutter' || this._renderLineHighlight === 'all'));
        }
        _willRenderContentCurrentLine() {
            return ((this._renderLineHighlight === 'line' || this._renderLineHighlight === 'all')
                && this._selectionIsEmpty);
        }
    }
    exports.CurrentLineMarginHighlightOverlay = CurrentLineMarginHighlightOverlay;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const lineHighlight = theme.getColor(editorColorRegistry_1.editorLineHighlight);
        if (lineHighlight) {
            collector.addRule(`.monaco-editor .margin-view-overlays .current-line-margin { background-color: ${lineHighlight}; border: none; }`);
        }
        else {
            const lineHighlightBorder = theme.getColor(editorColorRegistry_1.editorLineHighlightBorder);
            if (lineHighlightBorder) {
                collector.addRule(`.monaco-editor .margin-view-overlays .current-line-margin { border: 2px solid ${lineHighlightBorder}; }`);
            }
            if (theme.type === 'hc') {
                collector.addRule(`.monaco-editor .margin-view-overlays .current-line-margin { border-width: 1px; }`);
            }
        }
    });
});
//# sourceMappingURL=currentLineMarginHighlight.js.map