/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/test/workbenchTestServices", "vs/workbench/common/editor/dataUriEditorInput"], function (require, exports, assert, uri_1, workbenchTestServices_1, dataUriEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('DataUriEditorInput', () => {
        let instantiationService;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
        });
        test('simple', () => {
            const resource = uri_1.URI.parse('data:image/png;label:SomeLabel;description:SomeDescription;size:1024;base64,77+9UE5');
            const input = instantiationService.createInstance(dataUriEditorInput_1.DataUriEditorInput, undefined, undefined, resource);
            assert.equal(input.getName(), 'SomeLabel');
            assert.equal(input.getDescription(), 'SomeDescription');
            return input.resolve().then((model) => {
                assert.ok(model);
                assert.equal(model.getSize(), 1024);
                assert.equal(model.getMime(), 'image/png');
            });
        });
    });
});
//# sourceMappingURL=dataUriEditorInput.test.js.map