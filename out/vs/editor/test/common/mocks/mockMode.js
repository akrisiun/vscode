/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MockMode extends lifecycle_1.Disposable {
        constructor(languageIdentifier) {
            super();
            this._languageIdentifier = languageIdentifier;
        }
        getId() {
            return this._languageIdentifier.language;
        }
        getLanguageIdentifier() {
            return this._languageIdentifier;
        }
    }
    exports.MockMode = MockMode;
    class StaticLanguageSelector {
        constructor(languageIdentifier) {
            this.languageIdentifier = languageIdentifier;
            this.onDidChange = event_1.Event.None;
        }
        dispose() { }
    }
    exports.StaticLanguageSelector = StaticLanguageSelector;
});
//# sourceMappingURL=mockMode.js.map