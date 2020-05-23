/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorCommon", "vs/editor/common/modes", "vs/editor/contrib/rename/onTypeRename", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/editorTestUtils", "vs/editor/browser/controller/coreCommands"], function (require, exports, assert, lifecycle_1, uri_1, position_1, range_1, editorCommon_1, modes, onTypeRename_1, testCodeEditor_1, editorTestUtils_1, coreCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const mockFile = uri_1.URI.parse('test:somefile.ttt');
    const mockFileSelector = { scheme: 'test' };
    const timeout = 30;
    suite('On type rename', () => {
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            disposables.clear();
        });
        teardown(() => {
            disposables.clear();
        });
        function createMockEditor(text) {
            const model = typeof text === 'string'
                ? editorTestUtils_1.createTextModel(text, undefined, undefined, mockFile)
                : editorTestUtils_1.createTextModel(text.join('\n'), undefined, undefined, mockFile);
            const editor = testCodeEditor_1.createTestCodeEditor({ model });
            disposables.add(model);
            disposables.add(editor);
            return editor;
        }
        function testCase(name, initialState, operations, expectedEndText) {
            test(name, async () => {
                disposables.add(modes.OnTypeRenameProviderRegistry.register(mockFileSelector, {
                    stopPattern: initialState.stopPattern || /^\s/,
                    provideOnTypeRenameRanges() {
                        return initialState.ranges;
                    }
                }));
                const editor = createMockEditor(initialState.text);
                const ontypeRenameContribution = editor.registerAndInstantiateContribution(onTypeRename_1.OnTypeRenameContribution.ID, onTypeRename_1.OnTypeRenameContribution);
                await operations(editor, ontypeRenameContribution);
                return new Promise((resolve) => {
                    setTimeout(() => {
                        if (typeof expectedEndText === 'string') {
                            assert.equal(editor.getModel().getValue(), expectedEndText);
                        }
                        else {
                            assert.equal(editor.getModel().getValue(), expectedEndText.join('\n'));
                        }
                        resolve();
                    }, timeout);
                });
            });
        }
        const state = {
            text: '<ooo></ooo>',
            ranges: [
                new range_1.Range(1, 2, 1, 5),
                new range_1.Range(1, 8, 1, 11),
            ]
        };
        /**
         * Simple insertion
         */
        testCase('Simple insert - initial', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 2);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<iooo></iooo>');
        testCase('Simple insert - middle', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 3);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<oioo></oioo>');
        testCase('Simple insert - end', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 5);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<oooi></oooi>');
        /**
         * Simple insertion - end
         */
        testCase('Simple insert end - initial', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 8);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<iooo></iooo>');
        testCase('Simple insert end - middle', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 9);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<oioo></oioo>');
        testCase('Simple insert end - end', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 11);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<oooi></oooi>');
        /**
         * Boundary insertion
         */
        testCase('Simple insert - out of boundary', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 1);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, 'i<ooo></ooo>');
        testCase('Simple insert - out of boundary 2', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 6);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<ooo>i</ooo>');
        testCase('Simple insert - out of boundary 3', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 7);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<ooo><i/ooo>');
        testCase('Simple insert - out of boundary 4', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 12);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<ooo></ooo>i');
        /**
         * Insert + Move
         */
        testCase('Continuous insert', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 2);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<iiooo></iiooo>');
        testCase('Insert - move - insert', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 2);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
            editor.setPosition(new position_1.Position(1, 4));
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<ioioo></ioioo>');
        testCase('Insert - move - insert outside region', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 2);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
            editor.setPosition(new position_1.Position(1, 7));
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<iooo>i</iooo>');
        /**
         * Selection insert
         */
        testCase('Selection insert - simple', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 2);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.setSelection(new range_1.Range(1, 2, 1, 3));
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<ioo></ioo>');
        testCase('Selection insert - whole', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 2);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.setSelection(new range_1.Range(1, 2, 1, 5));
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<i></i>');
        testCase('Selection insert - across boundary', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 2);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.setSelection(new range_1.Range(1, 1, 1, 3));
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, 'ioo></oo>');
        /**
         * @todo
         * Undefined behavior
         */
        // testCase('Selection insert - across two boundary', state, async (editor, ontypeRenameContribution) => {
        // 	const pos = new Position(1, 2);
        // 	editor.setPosition(pos);
        // 	await ontypeRenameContribution.run(pos, true);
        // 	editor.setSelection(new Range(1, 4, 1, 9));
        // 	editor.trigger('keyboard', Handler.Type, { text: 'i' });
        // }, '<ooioo>');
        /**
         * Break out behavior
         */
        testCase('Breakout - type space', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 5);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: ' ' });
        }, '<ooo ></ooo>');
        testCase('Breakout - type space then undo', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 5);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: ' ' });
            coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
        }, '<ooo></ooo>');
        testCase('Breakout - type space in middle', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 4);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: ' ' });
        }, '<oo o></ooo>');
        testCase('Breakout - paste content starting with space', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 5);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Paste, { text: ' i="i"' });
        }, '<ooo i="i"></ooo>');
        testCase('Breakout - paste content starting with space then undo', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 5);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Paste, { text: ' i="i"' });
            coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
        }, '<ooo></ooo>');
        testCase('Breakout - paste content starting with space in middle', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 4);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Paste, { text: ' i' });
        }, '<oo io></ooo>');
        /**
         * Break out with custom stopPattern
         */
        const state3 = Object.assign(Object.assign({}, state), { stopPattern: /^s/ });
        testCase('Breakout with stop pattern - insert', state3, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 2);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, '<iooo></iooo>');
        testCase('Breakout with stop pattern - insert stop char', state3, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 2);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 's' });
        }, '<sooo></ooo>');
        testCase('Breakout with stop pattern - paste char', state3, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 2);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Paste, { text: 's' });
        }, '<sooo></ooo>');
        testCase('Breakout with stop pattern - paste string', state3, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 2);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Paste, { text: 'so' });
        }, '<soooo></ooo>');
        testCase('Breakout with stop pattern - insert at end', state3, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 5);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 's' });
        }, '<ooos></ooo>');
        /**
         * Delete
         */
        testCase('Delete - left char', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 5);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', 'deleteLeft', {});
        }, '<oo></oo>');
        testCase('Delete - left char then undo', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 5);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', 'deleteLeft', {});
            coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
        }, '<ooo></ooo>');
        testCase('Delete - left word', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 5);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', 'deleteWordLeft', {});
        }, '<></>');
        testCase('Delete - left word then undo', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 5);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', 'deleteWordLeft', {});
            coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
        }, '<ooo></ooo>');
        /**
         * Todo: Fix test
         */
        // testCase('Delete - left all', state, async (editor, ontypeRenameContribution) => {
        // 	const pos = new Position(1, 3);
        // 	editor.setPosition(pos);
        // 	await ontypeRenameContribution.run(pos, true);
        // 	editor.trigger('keyboard', 'deleteAllLeft', {});
        // }, '></>');
        /**
         * Todo: Fix test
         */
        // testCase('Delete - left all then undo', state, async (editor, ontypeRenameContribution) => {
        // 	const pos = new Position(1, 5);
        // 	editor.setPosition(pos);
        // 	await ontypeRenameContribution.run(pos, true);
        // 	editor.trigger('keyboard', 'deleteAllLeft', {});
        // 	CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
        // }, '></ooo>');
        testCase('Delete - left all then undo twice', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 5);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', 'deleteAllLeft', {});
            coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
            coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
        }, '<ooo></ooo>');
        testCase('Delete - selection', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 5);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.setSelection(new range_1.Range(1, 2, 1, 3));
            editor.trigger('keyboard', 'deleteLeft', {});
        }, '<oo></oo>');
        testCase('Delete - selection across boundary', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 3);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.setSelection(new range_1.Range(1, 1, 1, 3));
            editor.trigger('keyboard', 'deleteLeft', {});
        }, 'oo></oo>');
        /**
         * Undo / redo
         */
        testCase('Undo/redo - simple undo', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 2);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
            coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
            coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
        }, '<ooo></ooo>');
        testCase('Undo/redo - simple undo/redo', state, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 2);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
            coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
            coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
        }, '<iooo></iooo>');
        /**
         * Multi line
         */
        const state2 = {
            text: [
                '<ooo>',
                '</ooo>'
            ],
            ranges: [
                new range_1.Range(1, 2, 1, 5),
                new range_1.Range(2, 3, 2, 6),
            ]
        };
        testCase('Multiline insert', state2, async (editor, ontypeRenameContribution) => {
            const pos = new position_1.Position(1, 2);
            editor.setPosition(pos);
            await ontypeRenameContribution.run(pos, true);
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'i' });
        }, [
            '<iooo>',
            '</iooo>'
        ]);
    });
});
//# sourceMappingURL=onTypeRename.test.js.map