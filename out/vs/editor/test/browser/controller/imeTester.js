/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/fastDomNode", "vs/editor/browser/controller/textAreaInput", "vs/editor/browser/controller/textAreaState", "vs/editor/common/core/range"], function (require, exports, browser, fastDomNode_1, textAreaInput_1, textAreaState_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // To run this test, open imeTester.html
    class SingleLineTestModel {
        constructor(line) {
            this._line = line;
        }
        _setText(text) {
            this._line = text;
        }
        getLineMaxColumn(lineNumber) {
            return this._line.length + 1;
        }
        getValueInRange(range, eol) {
            return this._line.substring(range.startColumn - 1, range.endColumn - 1);
        }
        getModelLineContent(lineNumber) {
            return this._line;
        }
        getLineCount() {
            return 1;
        }
    }
    class TestView {
        constructor(model) {
            this._model = model;
        }
        paint(output) {
            let r = '';
            for (let i = 1; i <= this._model.getLineCount(); i++) {
                let content = this._model.getModelLineContent(i);
                r += content + '<br/>';
            }
            output.innerHTML = r;
        }
    }
    function doCreateTest(description, inputStr, expectedStr) {
        let cursorOffset = 0;
        let cursorLength = 0;
        let container = document.createElement('div');
        container.className = 'container';
        let title = document.createElement('div');
        title.className = 'title';
        title.innerHTML = description + '. Type <strong>' + inputStr + '</strong>';
        container.appendChild(title);
        let startBtn = document.createElement('button');
        startBtn.innerHTML = 'Start';
        container.appendChild(startBtn);
        let input = document.createElement('textarea');
        input.setAttribute('rows', '10');
        input.setAttribute('cols', '40');
        container.appendChild(input);
        let model = new SingleLineTestModel('some  text');
        const textAreaInputHost = {
            getPlainTextToCopy: () => '',
            getHTMLToCopy: () => '',
            getScreenReaderContent: (currentState) => {
                if (browser.isIPad) {
                    // Do not place anything in the textarea for the iPad
                    return textAreaState_1.TextAreaState.EMPTY;
                }
                const selection = new range_1.Range(1, 1 + cursorOffset, 1, 1 + cursorOffset + cursorLength);
                return textAreaState_1.PagedScreenReaderStrategy.fromEditorSelection(currentState, model, selection, true);
            },
            deduceModelPosition: (viewAnchorPosition, deltaOffset, lineFeedCnt) => {
                return null;
            }
        };
        let handler = new textAreaInput_1.TextAreaInput(textAreaInputHost, fastDomNode_1.createFastDomNode(input));
        let output = document.createElement('pre');
        output.className = 'output';
        container.appendChild(output);
        let check = document.createElement('pre');
        check.className = 'check';
        container.appendChild(check);
        let br = document.createElement('br');
        br.style.clear = 'both';
        container.appendChild(br);
        let view = new TestView(model);
        let updatePosition = (off, len) => {
            cursorOffset = off;
            cursorLength = len;
            handler.writeScreenReaderContent('selection changed');
            handler.focusTextArea();
        };
        let updateModelAndPosition = (text, off, len) => {
            model._setText(text);
            updatePosition(off, len);
            view.paint(output);
            let expected = 'some ' + expectedStr + ' text';
            if (text === expected) {
                check.innerHTML = '[GOOD]';
                check.className = 'check good';
            }
            else {
                check.innerHTML = '[BAD]';
                check.className = 'check bad';
            }
            check.innerHTML += expected;
        };
        handler.onType((e) => {
            console.log('type text: ' + e.text + ', replaceCharCnt: ' + e.replaceCharCnt);
            let text = model.getModelLineContent(1);
            let preText = text.substring(0, cursorOffset - e.replaceCharCnt);
            let postText = text.substring(cursorOffset + cursorLength);
            let midText = e.text;
            updateModelAndPosition(preText + midText + postText, (preText + midText).length, 0);
        });
        view.paint(output);
        startBtn.onclick = function () {
            updateModelAndPosition('some  text', 5, 0);
            input.focus();
        };
        return container;
    }
    const TESTS = [
        { description: 'Japanese IME 1', in: 'sennsei [Enter]', out: 'せんせい' },
        { description: 'Japanese IME 2', in: 'konnichiha [Enter]', out: 'こんいちは' },
        { description: 'Japanese IME 3', in: 'mikann [Enter]', out: 'みかん' },
        { description: 'Korean IME 1', in: 'gksrmf [Space]', out: '한글 ' },
        { description: 'Chinese IME 1', in: '.,', out: '。，' },
        { description: 'Chinese IME 2', in: 'ni [Space] hao [Space]', out: '你好' },
        { description: 'Chinese IME 3', in: 'hazni [Space]', out: '哈祝你' },
        { description: 'Mac dead key 1', in: '`.', out: '`.' },
        { description: 'Mac hold key 1', in: 'e long press and 1', out: 'é' }
    ];
    TESTS.forEach((t) => {
        document.body.appendChild(doCreateTest(t.description, t.in, t.out));
    });
});
//# sourceMappingURL=imeTester.js.map