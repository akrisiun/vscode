/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/browser/part", "vs/base/common/types", "vs/platform/theme/test/common/testThemeService", "vs/base/browser/dom", "vs/workbench/test/workbenchTestServices"], function (require, exports, assert, part_1, Types, testThemeService_1, dom_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SimplePart extends part_1.Part {
        constructor() {
            super(...arguments);
            this.minimumWidth = 50;
            this.maximumWidth = 50;
            this.minimumHeight = 50;
            this.maximumHeight = 50;
        }
        layout(width, height) {
            throw new Error('Method not implemented.');
        }
        toJSON() {
            throw new Error('Method not implemented.');
        }
    }
    class MyPart extends SimplePart {
        constructor(expectedParent) {
            super('myPart', { hasTitle: true }, new testThemeService_1.TestThemeService(), new workbenchTestServices_1.TestStorageService(), new workbenchTestServices_1.TestLayoutService());
            this.expectedParent = expectedParent;
        }
        createTitleArea(parent) {
            assert.strictEqual(parent, this.expectedParent);
            return super.createTitleArea(parent);
        }
        createContentArea(parent) {
            assert.strictEqual(parent, this.expectedParent);
            return super.createContentArea(parent);
        }
        getMemento(scope) {
            return super.getMemento(scope);
        }
        saveState() {
            return super.saveState();
        }
    }
    class MyPart2 extends SimplePart {
        constructor() {
            super('myPart2', { hasTitle: true }, new testThemeService_1.TestThemeService(), new workbenchTestServices_1.TestStorageService(), new workbenchTestServices_1.TestLayoutService());
        }
        createTitleArea(parent) {
            const titleContainer = dom_1.append(parent, dom_1.$('div'));
            const titleLabel = dom_1.append(titleContainer, dom_1.$('span'));
            titleLabel.id = 'myPart.title';
            titleLabel.innerHTML = 'Title';
            return titleContainer;
        }
        createContentArea(parent) {
            const contentContainer = dom_1.append(parent, dom_1.$('div'));
            const contentSpan = dom_1.append(contentContainer, dom_1.$('span'));
            contentSpan.id = 'myPart.content';
            contentSpan.innerHTML = 'Content';
            return contentContainer;
        }
    }
    class MyPart3 extends SimplePart {
        constructor() {
            super('myPart2', { hasTitle: false }, new testThemeService_1.TestThemeService(), new workbenchTestServices_1.TestStorageService(), new workbenchTestServices_1.TestLayoutService());
        }
        createTitleArea(parent) {
            return null;
        }
        createContentArea(parent) {
            const contentContainer = dom_1.append(parent, dom_1.$('div'));
            const contentSpan = dom_1.append(contentContainer, dom_1.$('span'));
            contentSpan.id = 'myPart.content';
            contentSpan.innerHTML = 'Content';
            return contentContainer;
        }
    }
    suite('Workbench parts', () => {
        let fixture;
        let fixtureId = 'workbench-part-fixture';
        setup(() => {
            fixture = document.createElement('div');
            fixture.id = fixtureId;
            document.body.appendChild(fixture);
        });
        teardown(() => {
            document.body.removeChild(fixture);
        });
        test('Creation', () => {
            let b = document.createElement('div');
            document.getElementById(fixtureId).appendChild(b);
            dom_1.hide(b);
            let part = new MyPart(b);
            part.create(b);
            assert.strictEqual(part.getId(), 'myPart');
            // Memento
            let memento = part.getMemento(0 /* GLOBAL */);
            assert(memento);
            memento.foo = 'bar';
            memento.bar = [1, 2, 3];
            part.saveState();
            // Re-Create to assert memento contents
            part = new MyPart(b);
            memento = part.getMemento(0 /* GLOBAL */);
            assert(memento);
            assert.strictEqual(memento.foo, 'bar');
            assert.strictEqual(memento.bar.length, 3);
            // Empty Memento stores empty object
            delete memento.foo;
            delete memento.bar;
            part.saveState();
            part = new MyPart(b);
            memento = part.getMemento(0 /* GLOBAL */);
            assert(memento);
            assert.strictEqual(Types.isEmptyObject(memento), true);
        });
        test('Part Layout with Title and Content', function () {
            let b = document.createElement('div');
            document.getElementById(fixtureId).appendChild(b);
            dom_1.hide(b);
            let part = new MyPart2();
            part.create(b);
            assert(document.getElementById('myPart.title'));
            assert(document.getElementById('myPart.content'));
        });
        test('Part Layout with Content only', function () {
            let b = document.createElement('div');
            document.getElementById(fixtureId).appendChild(b);
            dom_1.hide(b);
            let part = new MyPart3();
            part.create(b);
            assert(!document.getElementById('myPart.title'));
            assert(document.getElementById('myPart.content'));
        });
    });
});
//# sourceMappingURL=part.test.js.map