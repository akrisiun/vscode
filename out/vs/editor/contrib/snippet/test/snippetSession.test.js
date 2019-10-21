define(["require", "exports", "assert", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/model/textModel", "vs/editor/contrib/snippet/snippetParser", "vs/editor/contrib/snippet/snippetSession", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, position_1, range_1, selection_1, textModel_1, snippetParser_1, snippetSession_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SnippetSession', function () {
        let editor;
        let model;
        function assertSelections(editor, ...s) {
            for (const selection of editor.getSelections()) {
                const actual = s.shift();
                assert.ok(selection.equalsSelection(actual), `actual=${selection.toString()} <> expected=${actual.toString()}`);
            }
            assert.equal(s.length, 0);
        }
        setup(function () {
            model = textModel_1.TextModel.createFromString('function foo() {\n    console.log(a);\n}');
            editor = testCodeEditor_1.createTestCodeEditor({ model: model });
            editor.setSelections([new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5)]);
            assert.equal(model.getEOL(), '\n');
        });
        teardown(function () {
            model.dispose();
            editor.dispose();
        });
        test('normalize whitespace', function () {
            function assertNormalized(position, input, expected) {
                const snippet = new snippetParser_1.SnippetParser().parse(input);
                snippetSession_1.SnippetSession.adjustWhitespace(model, position, snippet);
                assert.equal(snippet.toTextmateString(), expected);
            }
            assertNormalized(new position_1.Position(1, 1), 'foo', 'foo');
            assertNormalized(new position_1.Position(1, 1), 'foo\rbar', 'foo\nbar');
            assertNormalized(new position_1.Position(1, 1), 'foo\rbar', 'foo\nbar');
            assertNormalized(new position_1.Position(2, 5), 'foo\r\tbar', 'foo\n        bar');
            assertNormalized(new position_1.Position(2, 3), 'foo\r\tbar', 'foo\n      bar');
            assertNormalized(new position_1.Position(2, 5), 'foo\r\tbar\nfoo', 'foo\n        bar\n    foo');
            //Indentation issue with choice elements that span multiple lines #46266
            assertNormalized(new position_1.Position(2, 5), 'a\nb${1|foo,\nbar|}', 'a\n    b${1|foo,\nbar|}');
        });
        test('adjust selection (overwrite[Before|After])', function () {
            let range = snippetSession_1.SnippetSession.adjustSelection(model, new selection_1.Selection(1, 2, 1, 2), 1, 0);
            assert.ok(range.equalsRange(new range_1.Range(1, 1, 1, 2)));
            range = snippetSession_1.SnippetSession.adjustSelection(model, new selection_1.Selection(1, 2, 1, 2), 1111, 0);
            assert.ok(range.equalsRange(new range_1.Range(1, 1, 1, 2)));
            range = snippetSession_1.SnippetSession.adjustSelection(model, new selection_1.Selection(1, 2, 1, 2), 0, 10);
            assert.ok(range.equalsRange(new range_1.Range(1, 2, 1, 12)));
            range = snippetSession_1.SnippetSession.adjustSelection(model, new selection_1.Selection(1, 2, 1, 2), 0, 10111);
            assert.ok(range.equalsRange(new range_1.Range(1, 2, 1, 17)));
        });
        test('text edits & selection', function () {
            const session = new snippetSession_1.SnippetSession(editor, 'foo${1:bar}foo$0');
            session.insert();
            assert.equal(editor.getModel().getValue(), 'foobarfoofunction foo() {\n    foobarfooconsole.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 10), new selection_1.Selection(2, 14, 2, 14));
        });
        test('text edit with reversed selection', function () {
            const session = new snippetSession_1.SnippetSession(editor, '${1:bar}$0');
            editor.setSelections([new selection_1.Selection(2, 5, 2, 5), new selection_1.Selection(1, 1, 1, 1)]);
            session.insert();
            assert.equal(model.getValue(), 'barfunction foo() {\n    barconsole.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(2, 5, 2, 8), new selection_1.Selection(1, 1, 1, 4));
        });
        test('snippets, repeated tabstops', function () {
            const session = new snippetSession_1.SnippetSession(editor, '${1:abc}foo${1:abc}$0');
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 4), new selection_1.Selection(1, 7, 1, 10), new selection_1.Selection(2, 5, 2, 8), new selection_1.Selection(2, 11, 2, 14));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 10), new selection_1.Selection(2, 14, 2, 14));
        });
        test('snippets, just text', function () {
            const session = new snippetSession_1.SnippetSession(editor, 'foobar');
            session.insert();
            assert.equal(model.getValue(), 'foobarfunction foo() {\n    foobarconsole.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(2, 11, 2, 11));
        });
        test('snippets, selections and new text with newlines', () => {
            const session = new snippetSession_1.SnippetSession(editor, 'foo\n\t${1:bar}\n$0');
            session.insert();
            assert.equal(editor.getModel().getValue(), 'foo\n    bar\nfunction foo() {\n    foo\n        bar\n    console.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(2, 5, 2, 8), new selection_1.Selection(5, 9, 5, 12));
            session.next();
            assertSelections(editor, new selection_1.Selection(3, 1, 3, 1), new selection_1.Selection(6, 5, 6, 5));
        });
        test('snippets, newline NO whitespace adjust', () => {
            editor.setSelection(new selection_1.Selection(2, 5, 2, 5));
            const session = new snippetSession_1.SnippetSession(editor, 'abc\n    foo\n        bar\n$0', { overwriteBefore: 0, overwriteAfter: 0, adjustWhitespace: false, clipboardText: undefined });
            session.insert();
            assert.equal(editor.getModel().getValue(), 'function foo() {\n    abc\n    foo\n        bar\nconsole.log(a);\n}');
        });
        test('snippets, selections -> next/prev', () => {
            const session = new snippetSession_1.SnippetSession(editor, 'f$1oo${2:bar}foo$0');
            session.insert();
            // @ $2
            assertSelections(editor, new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(2, 6, 2, 6));
            // @ $1
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
            // @ $2
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(2, 6, 2, 6));
            // @ $1
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
            // @ $0
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 10), new selection_1.Selection(2, 14, 2, 14));
        });
        test('snippets, selections & typing', function () {
            const session = new snippetSession_1.SnippetSession(editor, 'f${1:oo}_$2_$0');
            session.insert();
            editor.trigger('test', 'type', { text: 'X' });
            session.next();
            editor.trigger('test', 'type', { text: 'bar' });
            // go back to ${2:oo} which is now just 'X'
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 2, 1, 3), new selection_1.Selection(2, 6, 2, 7));
            // go forward to $1 which is now 'bar'
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
            // go to final tabstop
            session.next();
            assert.equal(model.getValue(), 'fX_bar_function foo() {\n    fX_bar_console.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(1, 8, 1, 8), new selection_1.Selection(2, 12, 2, 12));
        });
        test('snippets, insert shorter snippet into non-empty selection', function () {
            model.setValue('foo_bar_foo');
            editor.setSelections([new selection_1.Selection(1, 1, 1, 4), new selection_1.Selection(1, 9, 1, 12)]);
            new snippetSession_1.SnippetSession(editor, 'x$0').insert();
            assert.equal(model.getValue(), 'x_bar_x');
            assertSelections(editor, new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(1, 8, 1, 8));
        });
        test('snippets, insert longer snippet into non-empty selection', function () {
            model.setValue('foo_bar_foo');
            editor.setSelections([new selection_1.Selection(1, 1, 1, 4), new selection_1.Selection(1, 9, 1, 12)]);
            new snippetSession_1.SnippetSession(editor, 'LONGER$0').insert();
            assert.equal(model.getValue(), 'LONGER_bar_LONGER');
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(1, 18, 1, 18));
        });
        test('snippets, don\'t grow final tabstop', function () {
            model.setValue('foo_zzz_foo');
            editor.setSelection(new selection_1.Selection(1, 5, 1, 8));
            const session = new snippetSession_1.SnippetSession(editor, '$1bar$0');
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 5, 1, 5));
            editor.trigger('test', 'type', { text: 'foo-' });
            session.next();
            assert.equal(model.getValue(), 'foo_foo-bar_foo');
            assertSelections(editor, new selection_1.Selection(1, 12, 1, 12));
            editor.trigger('test', 'type', { text: 'XXX' });
            assert.equal(model.getValue(), 'foo_foo-barXXX_foo');
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 5, 1, 9));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 15, 1, 15));
        });
        test('snippets, don\'t merge touching tabstops 1/2', function () {
            const session = new snippetSession_1.SnippetSession(editor, '$1$2$3$0');
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            session.prev();
            session.prev();
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            editor.trigger('test', 'type', { text: '111' });
            session.next();
            editor.trigger('test', 'type', { text: '222' });
            session.next();
            editor.trigger('test', 'type', { text: '333' });
            session.next();
            assert.equal(model.getValue(), '111222333function foo() {\n    111222333console.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 10), new selection_1.Selection(2, 14, 2, 14));
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 10), new selection_1.Selection(2, 11, 2, 14));
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 4), new selection_1.Selection(2, 5, 2, 8));
        });
        test('snippets, don\'t merge touching tabstops 2/2', function () {
            const session = new snippetSession_1.SnippetSession(editor, '$1$2$3$0');
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            editor.trigger('test', 'type', { text: '111' });
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(2, 8, 2, 8));
            editor.trigger('test', 'type', { text: '222' });
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(2, 11, 2, 11));
            editor.trigger('test', 'type', { text: '333' });
            session.next();
            assert.equal(session.isAtLastPlaceholder, true);
        });
        test('snippets, gracefully move over final tabstop', function () {
            const session = new snippetSession_1.SnippetSession(editor, '${1}bar$0');
            session.insert();
            assert.equal(session.isAtLastPlaceholder, false);
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            session.next();
            assert.equal(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(2, 8, 2, 8));
            session.next();
            assert.equal(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(2, 8, 2, 8));
        });
        test('snippets, overwriting nested placeholder', function () {
            const session = new snippetSession_1.SnippetSession(editor, 'log(${1:"$2"});$0');
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 5, 1, 7), new selection_1.Selection(2, 9, 2, 11));
            editor.trigger('test', 'type', { text: 'XXX' });
            assert.equal(model.getValue(), 'log(XXX);function foo() {\n    log(XXX);console.log(a);\n}');
            session.next();
            assert.equal(session.isAtLastPlaceholder, false);
            // assertSelections(editor, new Selection(1, 7, 1, 7), new Selection(2, 11, 2, 11));
            session.next();
            assert.equal(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 10), new selection_1.Selection(2, 14, 2, 14));
        });
        test('snippets, selections and snippet ranges', function () {
            const session = new snippetSession_1.SnippetSession(editor, '${1:foo}farboo${2:bar}$0');
            session.insert();
            assert.equal(model.getValue(), 'foofarboobarfunction foo() {\n    foofarboobarconsole.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 4), new selection_1.Selection(2, 5, 2, 8));
            assert.equal(session.isSelectionWithinPlaceholders(), true);
            editor.setSelections([new selection_1.Selection(1, 1, 1, 1)]);
            assert.equal(session.isSelectionWithinPlaceholders(), false);
            editor.setSelections([new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(2, 10, 2, 10)]);
            assert.equal(session.isSelectionWithinPlaceholders(), false); // in snippet, outside placeholder
            editor.setSelections([new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(2, 10, 2, 10), new selection_1.Selection(1, 1, 1, 1)]);
            assert.equal(session.isSelectionWithinPlaceholders(), false); // in snippet, outside placeholder
            editor.setSelections([new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(2, 10, 2, 10), new selection_1.Selection(2, 20, 2, 21)]);
            assert.equal(session.isSelectionWithinPlaceholders(), false);
            // reset selection to placeholder
            session.next();
            assert.equal(session.isSelectionWithinPlaceholders(), true);
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 13), new selection_1.Selection(2, 14, 2, 17));
            // reset selection to placeholder
            session.next();
            assert.equal(session.isSelectionWithinPlaceholders(), true);
            assert.equal(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 13, 1, 13), new selection_1.Selection(2, 17, 2, 17));
        });
        test('snippets, nested sessions', function () {
            model.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const first = new snippetSession_1.SnippetSession(editor, 'foo${2:bar}foo$0');
            first.insert();
            assert.equal(model.getValue(), 'foobarfoo');
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7));
            const second = new snippetSession_1.SnippetSession(editor, 'ba${1:zzzz}$0');
            second.insert();
            assert.equal(model.getValue(), 'foobazzzzfoo');
            assertSelections(editor, new selection_1.Selection(1, 6, 1, 10));
            second.next();
            assert.equal(second.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 10));
            first.next();
            assert.equal(first.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 13, 1, 13));
        });
        test('snippets, typing at final tabstop', function () {
            const session = new snippetSession_1.SnippetSession(editor, 'farboo$0');
            session.insert();
            assert.equal(session.isAtLastPlaceholder, true);
            assert.equal(session.isSelectionWithinPlaceholders(), false);
            editor.trigger('test', 'type', { text: 'XXX' });
            assert.equal(session.isSelectionWithinPlaceholders(), false);
        });
        test('snippets, typing at beginning', function () {
            editor.setSelection(new selection_1.Selection(1, 2, 1, 2));
            const session = new snippetSession_1.SnippetSession(editor, 'farboo$0');
            session.insert();
            editor.setSelection(new selection_1.Selection(1, 2, 1, 2));
            assert.equal(session.isSelectionWithinPlaceholders(), false);
            assert.equal(session.isAtLastPlaceholder, true);
            editor.trigger('test', 'type', { text: 'XXX' });
            assert.equal(model.getLineContent(1), 'fXXXfarboounction foo() {');
            assert.equal(session.isSelectionWithinPlaceholders(), false);
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 11, 1, 11));
        });
        test('snippets, typing with nested placeholder', function () {
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, 'This ${1:is ${2:nested}}.$0');
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 6, 1, 15));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 9, 1, 15));
            editor.trigger('test', 'cut', {});
            assertSelections(editor, new selection_1.Selection(1, 9, 1, 9));
            editor.trigger('test', 'type', { text: 'XXX' });
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 6, 1, 12));
        });
        test('snippets, snippet with variables', function () {
            const session = new snippetSession_1.SnippetSession(editor, '@line=$TM_LINE_NUMBER$0');
            session.insert();
            assert.equal(model.getValue(), '@line=1function foo() {\n    @line=2console.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(1, 8, 1, 8), new selection_1.Selection(2, 12, 2, 12));
        });
        test('snippets, merge', function () {
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, 'This ${1:is ${2:nested}}.$0');
            session.insert();
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 9, 1, 15));
            session.merge('really ${1:nested}$0');
            assertSelections(editor, new selection_1.Selection(1, 16, 1, 22));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 22, 1, 22));
            assert.equal(session.isAtLastPlaceholder, false);
            session.next();
            assert.equal(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 23, 1, 23));
            session.prev();
            editor.trigger('test', 'type', { text: 'AAA' });
            // back to `really ${1:nested}`
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 16, 1, 22));
            // back to `${1:is ...}` which now grew
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 6, 1, 25));
        });
        test('snippets, transform', function () {
            editor.getModel().setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, '${1/foo/bar/}$0');
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1));
            editor.trigger('test', 'type', { text: 'foo' });
            session.next();
            assert.equal(model.getValue(), 'bar');
            assert.equal(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 4));
        });
        test('snippets, multi placeholder same index one transform', function () {
            editor.getModel().setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, '$1 baz ${1/foo/bar/}$0');
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(1, 6, 1, 6));
            editor.trigger('test', 'type', { text: 'foo' });
            session.next();
            assert.equal(model.getValue(), 'foo baz bar');
            assert.equal(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 12, 1, 12));
        });
        test('snippets, transform example', function () {
            editor.getModel().setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, '${1:name} : ${2:type}${3/\\s:=(.*)/${1:+ :=}${1}/};\n$0');
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 5));
            editor.trigger('test', 'type', { text: 'clk' });
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 11));
            editor.trigger('test', 'type', { text: 'std_logic' });
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 16, 1, 16));
            session.next();
            assert.equal(model.getValue(), 'clk : std_logic;\n');
            assert.equal(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(2, 1, 2, 1));
        });
        test('snippets, transform with indent', function () {
            const snippet = [
                'private readonly ${1} = new Emitter<$2>();',
                'readonly ${1/^_(.*)/$1/}: Event<$2> = this.$1.event;',
                '$0'
            ].join('\n');
            const expected = [
                '{',
                '\tprivate readonly _prop = new Emitter<string>();',
                '\treadonly prop: Event<string> = this._prop.event;',
                '\t',
                '}'
            ].join('\n');
            const base = [
                '{',
                '\t',
                '}'
            ].join('\n');
            editor.getModel().setValue(base);
            editor.getModel().updateOptions({ insertSpaces: false });
            editor.setSelection(new selection_1.Selection(2, 2, 2, 2));
            const session = new snippetSession_1.SnippetSession(editor, snippet);
            session.insert();
            assertSelections(editor, new selection_1.Selection(2, 19, 2, 19), new selection_1.Selection(3, 11, 3, 11), new selection_1.Selection(3, 28, 3, 28));
            editor.trigger('test', 'type', { text: '_prop' });
            session.next();
            assertSelections(editor, new selection_1.Selection(2, 39, 2, 39), new selection_1.Selection(3, 23, 3, 23));
            editor.trigger('test', 'type', { text: 'string' });
            session.next();
            assert.equal(model.getValue(), expected);
            assert.equal(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(4, 2, 4, 2));
        });
        test('snippets, transform example hit if', function () {
            editor.getModel().setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, '${1:name} : ${2:type}${3/\\s:=(.*)/${1:+ :=}${1}/};\n$0');
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 5));
            editor.trigger('test', 'type', { text: 'clk' });
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 11));
            editor.trigger('test', 'type', { text: 'std_logic' });
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 16, 1, 16));
            editor.trigger('test', 'type', { text: ' := \'1\'' });
            session.next();
            assert.equal(model.getValue(), 'clk : std_logic := \'1\';\n');
            assert.equal(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(2, 1, 2, 1));
        });
        test('Snippet placeholder index incorrect after using 2+ snippets in a row that each end with a placeholder, #30769', function () {
            editor.getModel().setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, 'test ${1:replaceme}');
            session.insert();
            editor.trigger('test', 'type', { text: '1' });
            editor.trigger('test', 'type', { text: '\n' });
            assert.equal(editor.getModel().getValue(), 'test 1\n');
            session.merge('test ${1:replaceme}');
            editor.trigger('test', 'type', { text: '2' });
            editor.trigger('test', 'type', { text: '\n' });
            assert.equal(editor.getModel().getValue(), 'test 1\ntest 2\n');
            session.merge('test ${1:replaceme}');
            editor.trigger('test', 'type', { text: '3' });
            editor.trigger('test', 'type', { text: '\n' });
            assert.equal(editor.getModel().getValue(), 'test 1\ntest 2\ntest 3\n');
            session.merge('test ${1:replaceme}');
            editor.trigger('test', 'type', { text: '4' });
            editor.trigger('test', 'type', { text: '\n' });
            assert.equal(editor.getModel().getValue(), 'test 1\ntest 2\ntest 3\ntest 4\n');
        });
        test('Snippet variable text isn\'t whitespace normalised, #31124', function () {
            editor.getModel().setValue([
                'start',
                '\t\t-one',
                '\t\t-two',
                'end'
            ].join('\n'));
            editor.getModel().updateOptions({ insertSpaces: false });
            editor.setSelection(new selection_1.Selection(2, 2, 3, 7));
            new snippetSession_1.SnippetSession(editor, '<div>\n\t$TM_SELECTED_TEXT\n</div>$0').insert();
            let expected = [
                'start',
                '\t<div>',
                '\t\t\t-one',
                '\t\t\t-two',
                '\t</div>',
                'end'
            ].join('\n');
            assert.equal(editor.getModel().getValue(), expected);
            editor.getModel().setValue([
                'start',
                '\t\t-one',
                '\t-two',
                'end'
            ].join('\n'));
            editor.getModel().updateOptions({ insertSpaces: false });
            editor.setSelection(new selection_1.Selection(2, 2, 3, 7));
            new snippetSession_1.SnippetSession(editor, '<div>\n\t$TM_SELECTED_TEXT\n</div>$0').insert();
            expected = [
                'start',
                '\t<div>',
                '\t\t\t-one',
                '\t\t-two',
                '\t</div>',
                'end'
            ].join('\n');
            assert.equal(editor.getModel().getValue(), expected);
        });
        test('Selecting text from left to right, and choosing item messes up code, #31199', function () {
            const model = editor.getModel();
            model.setValue('console.log');
            let actual = snippetSession_1.SnippetSession.adjustSelection(model, new selection_1.Selection(1, 12, 1, 9), 3, 0);
            assert.ok(actual.equalsSelection(new selection_1.Selection(1, 9, 1, 6)));
            actual = snippetSession_1.SnippetSession.adjustSelection(model, new selection_1.Selection(1, 9, 1, 12), 3, 0);
            assert.ok(actual.equalsSelection(new selection_1.Selection(1, 9, 1, 12)));
            editor.setSelections([new selection_1.Selection(1, 9, 1, 12)]);
            new snippetSession_1.SnippetSession(editor, 'far', { overwriteBefore: 3, overwriteAfter: 0, adjustWhitespace: true, clipboardText: undefined }).insert();
            assert.equal(model.getValue(), 'console.far');
        });
    });
});
//# sourceMappingURL=snippetSession.test.js.map