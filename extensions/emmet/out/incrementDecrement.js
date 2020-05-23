"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.locate = exports.update = exports.incrementDecrement = void 0;
/* Based on @sergeche's work in his emmet plugin */
const vscode = require("vscode");
const reNumber = /[0-9]/;
/**
 * Incerement number under caret of given editor
 */
function incrementDecrement(delta) {
    if (!vscode.window.activeTextEditor) {
        vscode.window.showInformationMessage('No editor is active');
        return;
    }
    const editor = vscode.window.activeTextEditor;
    return editor.edit(editBuilder => {
        editor.selections.forEach(selection => {
            let rangeToReplace = locate(editor.document, selection.isReversed ? selection.anchor : selection.active);
            if (!rangeToReplace) {
                return;
            }
            const text = editor.document.getText(rangeToReplace);
            if (isValidNumber(text)) {
                editBuilder.replace(rangeToReplace, update(text, delta));
            }
        });
    });
}
exports.incrementDecrement = incrementDecrement;
/**
 * Updates given number with `delta` and returns string formatted according
 * to original string format
 */
function update(numString, delta) {
    let m;
    let decimals = (m = numString.match(/\.(\d+)$/)) ? m[1].length : 1;
    let output = String((parseFloat(numString) + delta).toFixed(decimals)).replace(/\.0+$/, '');
    if (m = numString.match(/^\-?(0\d+)/)) {
        // padded number: preserve padding
        output = output.replace(/^(\-?)(\d+)/, (_, minus, prefix) => minus + '0'.repeat(Math.max(0, (m ? m[1].length : 0) - prefix.length)) + prefix);
    }
    if (/^\-?\./.test(numString)) {
        // omit integer part
        output = output.replace(/^(\-?)0+/, '$1');
    }
    return output;
}
exports.update = update;
/**
 * Locates number from given position in the document
 *
 * @return Range of number or `undefined` if not found
 */
function locate(document, pos) {
    const line = document.lineAt(pos.line).text;
    let start = pos.character;
    let end = pos.character;
    let hadDot = false, hadMinus = false;
    let ch;
    while (start > 0) {
        ch = line[--start];
        if (ch === '-') {
            hadMinus = true;
            break;
        }
        else if (ch === '.' && !hadDot) {
            hadDot = true;
        }
        else if (!reNumber.test(ch)) {
            start++;
            break;
        }
    }
    if (line[end] === '-' && !hadMinus) {
        end++;
    }
    while (end < line.length) {
        ch = line[end++];
        if (ch === '.' && !hadDot && reNumber.test(line[end])) {
            // A dot must be followed by a number. Otherwise stop parsing
            hadDot = true;
        }
        else if (!reNumber.test(ch)) {
            end--;
            break;
        }
    }
    // ensure that found range contains valid number
    if (start !== end && isValidNumber(line.slice(start, end))) {
        return new vscode.Range(pos.line, start, pos.line, end);
    }
    return;
}
exports.locate = locate;
/**
 * Check if given string contains valid number
 */
function isValidNumber(str) {
    return str ? !isNaN(parseFloat(str)) : false;
}
//# sourceMappingURL=incrementDecrement.js.map