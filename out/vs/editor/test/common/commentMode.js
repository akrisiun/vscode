/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/modes", "vs/editor/common/modes/languageConfigurationRegistry", "vs/editor/test/common/mocks/mockMode"], function (require, exports, modes_1, languageConfigurationRegistry_1, mockMode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CommentMode extends mockMode_1.MockMode {
        constructor(commentsConfig) {
            super(CommentMode._id);
            this._register(languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(this.getLanguageIdentifier(), {
                comments: commentsConfig
            }));
        }
    }
    exports.CommentMode = CommentMode;
    CommentMode._id = new modes_1.LanguageIdentifier('commentMode', 3);
});
//# sourceMappingURL=commentMode.js.map