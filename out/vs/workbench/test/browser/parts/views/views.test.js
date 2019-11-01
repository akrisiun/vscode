/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/browser/parts/views/views", "vs/workbench/common/views", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/platform/registry/common/platform", "vs/workbench/test/workbenchTestServices", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/browser/contextKeyService"], function (require, exports, assert, views_1, views_2, lifecycle_1, arrays_1, platform_1, workbenchTestServices_1, contextkey_1, contextKeyService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const container = platform_1.Registry.as(views_2.Extensions.ViewContainersRegistry).registerViewContainer('test');
    const ViewsRegistry = platform_1.Registry.as(views_2.Extensions.ViewsRegistry);
    class ViewDescriptorSequence {
        constructor(model) {
            this.disposables = [];
            this.elements = [...model.visibleViewDescriptors];
            model.onDidAdd(added => added.forEach(({ viewDescriptor, index }) => this.elements.splice(index, 0, viewDescriptor)), null, this.disposables);
            model.onDidRemove(removed => removed.sort((a, b) => b.index - a.index).forEach(({ index }) => this.elements.splice(index, 1)), null, this.disposables);
            model.onDidMove(({ from, to }) => arrays_1.move(this.elements, from.index, to.index), null, this.disposables);
        }
        dispose() {
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    }
    suite('ContributableViewsModel', () => {
        let viewsService;
        let contextKeyService;
        setup(() => {
            const instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            contextKeyService = instantiationService.createInstance(contextKeyService_1.ContextKeyService);
            instantiationService.stub(contextkey_1.IContextKeyService, contextKeyService);
            viewsService = instantiationService.createInstance(views_1.ViewsService);
        });
        teardown(() => {
            ViewsRegistry.deregisterViews(ViewsRegistry.getViews(container), container);
        });
        test('empty model', function () {
            const model = new views_1.ContributableViewsModel(container, viewsService);
            assert.equal(model.visibleViewDescriptors.length, 0);
        });
        test('register/unregister', () => {
            const model = new views_1.ContributableViewsModel(container, viewsService);
            const seq = new ViewDescriptorSequence(model);
            assert.equal(model.visibleViewDescriptors.length, 0);
            assert.equal(seq.elements.length, 0);
            const viewDescriptor = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1'
            };
            ViewsRegistry.registerViews([viewDescriptor], container);
            assert.equal(model.visibleViewDescriptors.length, 1);
            assert.equal(seq.elements.length, 1);
            assert.deepEqual(model.visibleViewDescriptors[0], viewDescriptor);
            assert.deepEqual(seq.elements[0], viewDescriptor);
            ViewsRegistry.deregisterViews([viewDescriptor], container);
            assert.equal(model.visibleViewDescriptors.length, 0);
            assert.equal(seq.elements.length, 0);
        });
        test('when contexts', async function () {
            const model = new views_1.ContributableViewsModel(container, viewsService);
            const seq = new ViewDescriptorSequence(model);
            assert.equal(model.visibleViewDescriptors.length, 0);
            assert.equal(seq.elements.length, 0);
            const viewDescriptor = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1',
                when: contextkey_1.ContextKeyExpr.equals('showview1', true)
            };
            ViewsRegistry.registerViews([viewDescriptor], container);
            assert.equal(model.visibleViewDescriptors.length, 0, 'view should not appear since context isnt in');
            assert.equal(seq.elements.length, 0);
            const key = contextKeyService.createKey('showview1', false);
            assert.equal(model.visibleViewDescriptors.length, 0, 'view should still not appear since showview1 isnt true');
            assert.equal(seq.elements.length, 0);
            key.set(true);
            await new Promise(c => setTimeout(c, 30));
            assert.equal(model.visibleViewDescriptors.length, 1, 'view should appear');
            assert.equal(seq.elements.length, 1);
            assert.deepEqual(model.visibleViewDescriptors[0], viewDescriptor);
            assert.equal(seq.elements[0], viewDescriptor);
            key.set(false);
            await new Promise(c => setTimeout(c, 30));
            assert.equal(model.visibleViewDescriptors.length, 0, 'view should disappear');
            assert.equal(seq.elements.length, 0);
            ViewsRegistry.deregisterViews([viewDescriptor], container);
            assert.equal(model.visibleViewDescriptors.length, 0, 'view should not be there anymore');
            assert.equal(seq.elements.length, 0);
            key.set(true);
            await new Promise(c => setTimeout(c, 30));
            assert.equal(model.visibleViewDescriptors.length, 0, 'view should not be there anymore');
            assert.equal(seq.elements.length, 0);
        });
        test('when contexts - multiple', async function () {
            const model = new views_1.ContributableViewsModel(container, viewsService);
            const seq = new ViewDescriptorSequence(model);
            const view1 = { id: 'view1', ctorDescriptor: null, name: 'Test View 1' };
            const view2 = { id: 'view2', ctorDescriptor: null, name: 'Test View 2', when: contextkey_1.ContextKeyExpr.equals('showview2', true) };
            ViewsRegistry.registerViews([view1, view2], container);
            assert.deepEqual(model.visibleViewDescriptors, [view1], 'only view1 should be visible');
            assert.deepEqual(seq.elements, [view1], 'only view1 should be visible');
            const key = contextKeyService.createKey('showview2', false);
            assert.deepEqual(model.visibleViewDescriptors, [view1], 'still only view1 should be visible');
            assert.deepEqual(seq.elements, [view1], 'still only view1 should be visible');
            key.set(true);
            await new Promise(c => setTimeout(c, 30));
            assert.deepEqual(model.visibleViewDescriptors, [view1, view2], 'both views should be visible');
            assert.deepEqual(seq.elements, [view1, view2], 'both views should be visible');
            ViewsRegistry.deregisterViews([view1, view2], container);
        });
        test('when contexts - multiple 2', async function () {
            const model = new views_1.ContributableViewsModel(container, viewsService);
            const seq = new ViewDescriptorSequence(model);
            const view1 = { id: 'view1', ctorDescriptor: null, name: 'Test View 1', when: contextkey_1.ContextKeyExpr.equals('showview1', true) };
            const view2 = { id: 'view2', ctorDescriptor: null, name: 'Test View 2' };
            ViewsRegistry.registerViews([view1, view2], container);
            assert.deepEqual(model.visibleViewDescriptors, [view2], 'only view2 should be visible');
            assert.deepEqual(seq.elements, [view2], 'only view2 should be visible');
            const key = contextKeyService.createKey('showview1', false);
            assert.deepEqual(model.visibleViewDescriptors, [view2], 'still only view2 should be visible');
            assert.deepEqual(seq.elements, [view2], 'still only view2 should be visible');
            key.set(true);
            await new Promise(c => setTimeout(c, 30));
            assert.deepEqual(model.visibleViewDescriptors, [view1, view2], 'both views should be visible');
            assert.deepEqual(seq.elements, [view1, view2], 'both views should be visible');
            ViewsRegistry.deregisterViews([view1, view2], container);
        });
        test('setVisible', () => {
            const model = new views_1.ContributableViewsModel(container, viewsService);
            const seq = new ViewDescriptorSequence(model);
            const view1 = { id: 'view1', ctorDescriptor: null, name: 'Test View 1', canToggleVisibility: true };
            const view2 = { id: 'view2', ctorDescriptor: null, name: 'Test View 2', canToggleVisibility: true };
            const view3 = { id: 'view3', ctorDescriptor: null, name: 'Test View 3', canToggleVisibility: true };
            ViewsRegistry.registerViews([view1, view2, view3], container);
            assert.deepEqual(model.visibleViewDescriptors, [view1, view2, view3]);
            assert.deepEqual(seq.elements, [view1, view2, view3]);
            model.setVisible('view2', true);
            assert.deepEqual(model.visibleViewDescriptors, [view1, view2, view3], 'nothing should happen');
            assert.deepEqual(seq.elements, [view1, view2, view3]);
            model.setVisible('view2', false);
            assert.deepEqual(model.visibleViewDescriptors, [view1, view3], 'view2 should hide');
            assert.deepEqual(seq.elements, [view1, view3]);
            model.setVisible('view1', false);
            assert.deepEqual(model.visibleViewDescriptors, [view3], 'view1 should hide');
            assert.deepEqual(seq.elements, [view3]);
            model.setVisible('view3', false);
            assert.deepEqual(model.visibleViewDescriptors, [], 'view3 shoud hide');
            assert.deepEqual(seq.elements, []);
            model.setVisible('view1', true);
            assert.deepEqual(model.visibleViewDescriptors, [view1], 'view1 should show');
            assert.deepEqual(seq.elements, [view1]);
            model.setVisible('view3', true);
            assert.deepEqual(model.visibleViewDescriptors, [view1, view3], 'view3 should show');
            assert.deepEqual(seq.elements, [view1, view3]);
            model.setVisible('view2', true);
            assert.deepEqual(model.visibleViewDescriptors, [view1, view2, view3], 'view2 should show');
            assert.deepEqual(seq.elements, [view1, view2, view3]);
            ViewsRegistry.deregisterViews([view1, view2, view3], container);
            assert.deepEqual(model.visibleViewDescriptors, []);
            assert.deepEqual(seq.elements, []);
        });
        test('move', () => {
            const model = new views_1.ContributableViewsModel(container, viewsService);
            const seq = new ViewDescriptorSequence(model);
            const view1 = { id: 'view1', ctorDescriptor: null, name: 'Test View 1' };
            const view2 = { id: 'view2', ctorDescriptor: null, name: 'Test View 2' };
            const view3 = { id: 'view3', ctorDescriptor: null, name: 'Test View 3' };
            ViewsRegistry.registerViews([view1, view2, view3], container);
            assert.deepEqual(model.visibleViewDescriptors, [view1, view2, view3], 'model views should be OK');
            assert.deepEqual(seq.elements, [view1, view2, view3], 'sql views should be OK');
            model.move('view3', 'view1');
            assert.deepEqual(model.visibleViewDescriptors, [view3, view1, view2], 'view3 should go to the front');
            assert.deepEqual(seq.elements, [view3, view1, view2]);
            model.move('view1', 'view2');
            assert.deepEqual(model.visibleViewDescriptors, [view3, view2, view1], 'view1 should go to the end');
            assert.deepEqual(seq.elements, [view3, view2, view1]);
            model.move('view1', 'view3');
            assert.deepEqual(model.visibleViewDescriptors, [view1, view3, view2], 'view1 should go to the front');
            assert.deepEqual(seq.elements, [view1, view3, view2]);
            model.move('view2', 'view3');
            assert.deepEqual(model.visibleViewDescriptors, [view1, view2, view3], 'view2 should go to the middle');
            assert.deepEqual(seq.elements, [view1, view2, view3]);
        });
    });
});
//# sourceMappingURL=views.test.js.map