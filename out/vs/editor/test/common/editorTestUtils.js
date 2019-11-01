/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/model/textModel"], function (require, exports, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function withEditorModel(text, callback) {
        let model = textModel_1.TextModel.createFromString(text.join('\n'));
        callback(model);
        model.dispose();
    }
    exports.withEditorModel = withEditorModel;
    function createTextModel(text, _options = textModel_1.TextModel.DEFAULT_CREATION_OPTIONS, languageIdentifier = null, uri = null) {
        const options = {
            tabSize: (typeof _options.tabSize === 'undefined' ? textModel_1.TextModel.DEFAULT_CREATION_OPTIONS.tabSize : _options.tabSize),
            indentSize: (typeof _options.indentSize === 'undefined' ? textModel_1.TextModel.DEFAULT_CREATION_OPTIONS.indentSize : _options.indentSize),
            insertSpaces: (typeof _options.insertSpaces === 'undefined' ? textModel_1.TextModel.DEFAULT_CREATION_OPTIONS.insertSpaces : _options.insertSpaces),
            detectIndentation: (typeof _options.detectIndentation === 'undefined' ? textModel_1.TextModel.DEFAULT_CREATION_OPTIONS.detectIndentation : _options.detectIndentation),
            trimAutoWhitespace: (typeof _options.trimAutoWhitespace === 'undefined' ? textModel_1.TextModel.DEFAULT_CREATION_OPTIONS.trimAutoWhitespace : _options.trimAutoWhitespace),
            defaultEOL: (typeof _options.defaultEOL === 'undefined' ? textModel_1.TextModel.DEFAULT_CREATION_OPTIONS.defaultEOL : _options.defaultEOL),
            isForSimpleWidget: (typeof _options.isForSimpleWidget === 'undefined' ? textModel_1.TextModel.DEFAULT_CREATION_OPTIONS.isForSimpleWidget : _options.isForSimpleWidget),
            largeFileOptimizations: (typeof _options.largeFileOptimizations === 'undefined' ? textModel_1.TextModel.DEFAULT_CREATION_OPTIONS.largeFileOptimizations : _options.largeFileOptimizations),
        };
        return textModel_1.TextModel.createFromString(text, options, languageIdentifier, uri);
    }
    exports.createTextModel = createTextModel;
});
//# sourceMappingURL=editorTestUtils.js.map