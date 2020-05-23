/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewContext = exports.EditorTheme = void 0;
    class EditorTheme {
        constructor(theme) {
            this._theme = theme;
        }
        get type() {
            return this._theme.type;
        }
        update(theme) {
            this._theme = theme;
        }
        getColor(color) {
            return this._theme.getColor(color);
        }
    }
    exports.EditorTheme = EditorTheme;
    class ViewContext {
        constructor(configuration, theme, model, privateViewEventBus) {
            this.configuration = configuration;
            this.theme = new EditorTheme(theme);
            this.model = model;
            this.viewLayout = model.viewLayout;
            this.privateViewEventBus = privateViewEventBus;
        }
        addEventHandler(eventHandler) {
            this.privateViewEventBus.addEventHandler(eventHandler);
        }
        removeEventHandler(eventHandler) {
            this.privateViewEventBus.removeEventHandler(eventHandler);
        }
    }
    exports.ViewContext = ViewContext;
});
//# sourceMappingURL=viewContext.js.map