/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/model/textModel", "vs/editor/common/viewModel/viewModelImpl", "vs/editor/test/common/mocks/testConfiguration"], function (require, exports, textModel_1, viewModelImpl_1, testConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function testViewModel(text, options, callback) {
        const EDITOR_ID = 1;
        let configuration = new testConfiguration_1.TestConfiguration(options);
        let model = textModel_1.TextModel.createFromString(text.join('\n'));
        let viewModel = new viewModelImpl_1.ViewModel(EDITOR_ID, configuration, model, null);
        callback(viewModel, model);
        viewModel.dispose();
        model.dispose();
        configuration.dispose();
    }
    exports.testViewModel = testViewModel;
});
//# sourceMappingURL=testViewModel.js.map