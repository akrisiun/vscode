/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/common/memento", "vs/workbench/test/workbenchTestServices"], function (require, exports, assert, memento_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Memento', () => {
        let context = undefined;
        let storage;
        setup(() => {
            storage = new workbenchTestServices_1.TestStorageService();
        });
        test('Loading and Saving Memento with Scopes', () => {
            let myMemento = new memento_1.Memento('memento.test', storage);
            // Global
            let memento = myMemento.getMemento(0 /* GLOBAL */);
            memento.foo = [1, 2, 3];
            let globalMemento = myMemento.getMemento(0 /* GLOBAL */);
            assert.deepEqual(globalMemento, memento);
            // Workspace
            memento = myMemento.getMemento(1 /* WORKSPACE */);
            assert(memento);
            memento.foo = 'Hello World';
            myMemento.saveMemento();
            // Global
            memento = myMemento.getMemento(0 /* GLOBAL */);
            assert.deepEqual(memento, { foo: [1, 2, 3] });
            globalMemento = myMemento.getMemento(0 /* GLOBAL */);
            assert.deepEqual(globalMemento, memento);
            // Workspace
            memento = myMemento.getMemento(1 /* WORKSPACE */);
            assert.deepEqual(memento, { foo: 'Hello World' });
            // Assert the Mementos are stored properly in storage
            assert.deepEqual(JSON.parse(storage.get('memento/memento.test', 0 /* GLOBAL */)), { foo: [1, 2, 3] });
            assert.deepEqual(JSON.parse(storage.get('memento/memento.test', 1 /* WORKSPACE */)), { foo: 'Hello World' });
            // Delete Global
            memento = myMemento.getMemento(context);
            delete memento.foo;
            // Delete Workspace
            memento = myMemento.getMemento(1 /* WORKSPACE */);
            delete memento.foo;
            myMemento.saveMemento();
            // Global
            memento = myMemento.getMemento(context);
            assert.deepEqual(memento, {});
            // Workspace
            memento = myMemento.getMemento(1 /* WORKSPACE */);
            assert.deepEqual(memento, {});
            // Assert the Mementos are also removed from storage
            assert.strictEqual(storage.get('memento/memento.test', 0 /* GLOBAL */, null), null);
            assert.strictEqual(storage.get('memento/memento.test', 1 /* WORKSPACE */, null), null);
        });
        test('Save and Load', () => {
            let myMemento = new memento_1.Memento('memento.test', storage);
            // Global
            let memento = myMemento.getMemento(context);
            memento.foo = [1, 2, 3];
            // Workspace
            memento = myMemento.getMemento(1 /* WORKSPACE */);
            assert(memento);
            memento.foo = 'Hello World';
            myMemento.saveMemento();
            // Global
            memento = myMemento.getMemento(context);
            assert.deepEqual(memento, { foo: [1, 2, 3] });
            let globalMemento = myMemento.getMemento(0 /* GLOBAL */);
            assert.deepEqual(globalMemento, memento);
            // Workspace
            memento = myMemento.getMemento(1 /* WORKSPACE */);
            assert.deepEqual(memento, { foo: 'Hello World' });
            // Global
            memento = myMemento.getMemento(context);
            memento.foo = [4, 5, 6];
            // Workspace
            memento = myMemento.getMemento(1 /* WORKSPACE */);
            assert(memento);
            memento.foo = 'World Hello';
            myMemento.saveMemento();
            // Global
            memento = myMemento.getMemento(context);
            assert.deepEqual(memento, { foo: [4, 5, 6] });
            globalMemento = myMemento.getMemento(0 /* GLOBAL */);
            assert.deepEqual(globalMemento, memento);
            // Workspace
            memento = myMemento.getMemento(1 /* WORKSPACE */);
            assert.deepEqual(memento, { foo: 'World Hello' });
            // Delete Global
            memento = myMemento.getMemento(context);
            delete memento.foo;
            // Delete Workspace
            memento = myMemento.getMemento(1 /* WORKSPACE */);
            delete memento.foo;
            myMemento.saveMemento();
            // Global
            memento = myMemento.getMemento(context);
            assert.deepEqual(memento, {});
            // Workspace
            memento = myMemento.getMemento(1 /* WORKSPACE */);
            assert.deepEqual(memento, {});
        });
        test('Save and Load - 2 Components with same id', () => {
            let myMemento = new memento_1.Memento('memento.test', storage);
            let myMemento2 = new memento_1.Memento('memento.test', storage);
            // Global
            let memento = myMemento.getMemento(context);
            memento.foo = [1, 2, 3];
            memento = myMemento2.getMemento(context);
            memento.bar = [1, 2, 3];
            // Workspace
            memento = myMemento.getMemento(1 /* WORKSPACE */);
            assert(memento);
            memento.foo = 'Hello World';
            memento = myMemento2.getMemento(1 /* WORKSPACE */);
            assert(memento);
            memento.bar = 'Hello World';
            myMemento.saveMemento();
            myMemento2.saveMemento();
            // Global
            memento = myMemento.getMemento(context);
            assert.deepEqual(memento, { foo: [1, 2, 3], bar: [1, 2, 3] });
            let globalMemento = myMemento.getMemento(0 /* GLOBAL */);
            assert.deepEqual(globalMemento, memento);
            memento = myMemento2.getMemento(context);
            assert.deepEqual(memento, { foo: [1, 2, 3], bar: [1, 2, 3] });
            globalMemento = myMemento2.getMemento(0 /* GLOBAL */);
            assert.deepEqual(globalMemento, memento);
            // Workspace
            memento = myMemento.getMemento(1 /* WORKSPACE */);
            assert.deepEqual(memento, { foo: 'Hello World', bar: 'Hello World' });
            memento = myMemento2.getMemento(1 /* WORKSPACE */);
            assert.deepEqual(memento, { foo: 'Hello World', bar: 'Hello World' });
        });
    });
});
//# sourceMappingURL=memento.test.js.map