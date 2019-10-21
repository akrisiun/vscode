/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/actions/common/actions", "vs/platform/actions/common/menuService", "vs/base/common/lifecycle", "vs/platform/commands/common/commands", "vs/platform/keybinding/test/common/mockKeybindingService"], function (require, exports, assert, actions_1, menuService_1, lifecycle_1, commands_1, mockKeybindingService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // --- service instances
    const contextKeyService = new class extends mockKeybindingService_1.MockContextKeyService {
        contextMatchesRules() {
            return true;
        }
    };
    // --- tests
    suite('MenuService', function () {
        let menuService;
        const disposables = new lifecycle_1.DisposableStore();
        let testMenuId;
        setup(function () {
            menuService = new menuService_1.MenuService(commands_1.NullCommandService);
            testMenuId = Math.PI;
            disposables.clear();
        });
        teardown(function () {
            disposables.clear();
        });
        test('group sorting', function () {
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'one', title: 'FOO' },
                group: '0_hello'
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'two', title: 'FOO' },
                group: 'hello'
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'three', title: 'FOO' },
                group: 'Hello'
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'four', title: 'FOO' },
                group: ''
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'five', title: 'FOO' },
                group: 'navigation'
            }));
            const groups = menuService.createMenu(testMenuId, contextKeyService).getActions();
            assert.equal(groups.length, 5);
            const [one, two, three, four, five] = groups;
            assert.equal(one[0], 'navigation');
            assert.equal(two[0], '0_hello');
            assert.equal(three[0], 'hello');
            assert.equal(four[0], 'Hello');
            assert.equal(five[0], '');
        });
        test('in group sorting, by title', function () {
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'a', title: 'aaa' },
                group: 'Hello'
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'b', title: 'fff' },
                group: 'Hello'
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'c', title: 'zzz' },
                group: 'Hello'
            }));
            const groups = menuService.createMenu(testMenuId, contextKeyService).getActions();
            assert.equal(groups.length, 1);
            const [, actions] = groups[0];
            assert.equal(actions.length, 3);
            const [one, two, three] = actions;
            assert.equal(one.id, 'a');
            assert.equal(two.id, 'b');
            assert.equal(three.id, 'c');
        });
        test('in group sorting, by title and order', function () {
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'a', title: 'aaa' },
                group: 'Hello',
                order: 10
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'b', title: 'fff' },
                group: 'Hello'
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'c', title: 'zzz' },
                group: 'Hello',
                order: -1
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'd', title: 'yyy' },
                group: 'Hello',
                order: -1
            }));
            const groups = menuService.createMenu(testMenuId, contextKeyService).getActions();
            assert.equal(groups.length, 1);
            const [, actions] = groups[0];
            assert.equal(actions.length, 4);
            const [one, two, three, four] = actions;
            assert.equal(one.id, 'd');
            assert.equal(two.id, 'c');
            assert.equal(three.id, 'b');
            assert.equal(four.id, 'a');
        });
        test('in group sorting, special: navigation', function () {
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'a', title: 'aaa' },
                group: 'navigation',
                order: 1.3
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'b', title: 'fff' },
                group: 'navigation',
                order: 1.2
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'c', title: 'zzz' },
                group: 'navigation',
                order: 1.1
            }));
            const groups = menuService.createMenu(testMenuId, contextKeyService).getActions();
            assert.equal(groups.length, 1);
            const [[, actions]] = groups;
            assert.equal(actions.length, 3);
            const [one, two, three] = actions;
            assert.equal(one.id, 'c');
            assert.equal(two.id, 'b');
            assert.equal(three.id, 'a');
        });
        test('special MenuId palette', function () {
            disposables.add(actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
                command: { id: 'a', title: 'Explicit' }
            }));
            actions_1.MenuRegistry.addCommand({ id: 'b', title: 'Implicit' });
            let foundA = false;
            let foundB = false;
            for (const item of actions_1.MenuRegistry.getMenuItems(0 /* CommandPalette */)) {
                if (actions_1.isIMenuItem(item)) {
                    if (item.command.id === 'a') {
                        assert.equal(item.command.title, 'Explicit');
                        foundA = true;
                    }
                    if (item.command.id === 'b') {
                        assert.equal(item.command.title, 'Implicit');
                        foundB = true;
                    }
                }
            }
            assert.equal(foundA, true);
            assert.equal(foundB, true);
        });
    });
});
//# sourceMappingURL=menuService.test.js.map