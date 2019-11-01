/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/services/modelService", "vs/editor/common/services/modelServiceImpl", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/workbench/contrib/search/browser/searchActions", "vs/workbench/contrib/search/common/searchModel", "vs/workbench/contrib/search/test/browser/mockSearchTree"], function (require, exports, assert, platform_1, uri_1, modelService_1, modelServiceImpl_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, keybinding_1, usLayoutResolvedKeybinding_1, searchActions_1, searchModel_1, mockSearchTree_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Search Actions', () => {
        let instantiationService;
        let counter;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(modelService_1.IModelService, stubModelService(instantiationService));
            instantiationService.stub(keybinding_1.IKeybindingService, {});
            instantiationService.stub(keybinding_1.IKeybindingService, 'resolveKeybinding', (keybinding) => [new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(keybinding, platform_1.OS)]);
            instantiationService.stub(keybinding_1.IKeybindingService, 'lookupKeybinding', (id) => null);
            counter = 0;
        });
        test('get next element to focus after removing a match when it has next sibling file', function () {
            const fileMatch1 = aFileMatch();
            const fileMatch2 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1), aMatch(fileMatch1), fileMatch2, aMatch(fileMatch2), aMatch(fileMatch2)];
            const tree = aTree(data);
            const target = data[2];
            const testObject = instantiationService.createInstance(searchActions_1.ReplaceAction, tree, target, null);
            const actual = testObject.getElementToFocusAfterRemoved(tree, target);
            assert.equal(data[4], actual);
        });
        test('get next element to focus after removing a match when it does not have next sibling match', function () {
            const fileMatch1 = aFileMatch();
            const fileMatch2 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1), aMatch(fileMatch1), fileMatch2, aMatch(fileMatch2), aMatch(fileMatch2)];
            const tree = aTree(data);
            const target = data[5];
            const testObject = instantiationService.createInstance(searchActions_1.ReplaceAction, tree, target, null);
            const actual = testObject.getElementToFocusAfterRemoved(tree, target);
            assert.equal(data[4], actual);
        });
        test('get next element to focus after removing a match when it does not have next sibling match and previous match is file match', function () {
            const fileMatch1 = aFileMatch();
            const fileMatch2 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1), aMatch(fileMatch1), fileMatch2, aMatch(fileMatch2)];
            const tree = aTree(data);
            const target = data[4];
            const testObject = instantiationService.createInstance(searchActions_1.ReplaceAction, tree, target, null);
            const actual = testObject.getElementToFocusAfterRemoved(tree, target);
            assert.equal(data[2], actual);
        });
        test('get next element to focus after removing a match when it is the only match', function () {
            const fileMatch1 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1)];
            const tree = aTree(data);
            const target = data[1];
            const testObject = instantiationService.createInstance(searchActions_1.ReplaceAction, tree, target, null);
            const actual = testObject.getElementToFocusAfterRemoved(tree, target);
            assert.equal(undefined, actual);
        });
        test('get next element to focus after removing a file match when it has next sibling', function () {
            const fileMatch1 = aFileMatch();
            const fileMatch2 = aFileMatch();
            const fileMatch3 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1), fileMatch2, aMatch(fileMatch2), fileMatch3, aMatch(fileMatch3)];
            const tree = aTree(data);
            const target = data[2];
            const testObject = instantiationService.createInstance(searchActions_1.ReplaceAction, tree, target, null);
            const actual = testObject.getElementToFocusAfterRemoved(tree, target);
            assert.equal(data[4], actual);
        });
        test('get next element to focus after removing a file match when it has no next sibling', function () {
            const fileMatch1 = aFileMatch();
            const fileMatch2 = aFileMatch();
            const fileMatch3 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1), fileMatch2, aMatch(fileMatch2), fileMatch3, aMatch(fileMatch3)];
            const tree = aTree(data);
            const target = data[4];
            const testObject = instantiationService.createInstance(searchActions_1.ReplaceAction, tree, target, null);
            const actual = testObject.getElementToFocusAfterRemoved(tree, target);
            assert.equal(data[3], actual);
        });
        test('get next element to focus after removing a file match when it is only match', function () {
            const fileMatch1 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1)];
            const tree = aTree(data);
            const target = data[0];
            const testObject = instantiationService.createInstance(searchActions_1.ReplaceAction, tree, target, null);
            const actual = testObject.getElementToFocusAfterRemoved(tree, target);
            assert.equal(undefined, actual);
        });
        function aFileMatch() {
            const rawMatch = {
                resource: uri_1.URI.file('somepath' + ++counter),
                results: []
            };
            return instantiationService.createInstance(searchModel_1.FileMatch, null, null, null, null, rawMatch);
        }
        function aMatch(fileMatch) {
            const line = ++counter;
            const match = new searchModel_1.Match(fileMatch, ['some match'], {
                startLineNumber: 0,
                startColumn: 0,
                endLineNumber: 0,
                endColumn: 2
            }, {
                startLineNumber: line,
                startColumn: 0,
                endLineNumber: line,
                endColumn: 2
            });
            fileMatch.add(match);
            return match;
        }
        function aTree(elements) {
            return new mockSearchTree_1.MockObjectTree(elements);
        }
        function stubModelService(instantiationService) {
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            return instantiationService.createInstance(modelServiceImpl_1.ModelServiceImpl);
        }
    });
});
//# sourceMappingURL=searchActions.test.js.map