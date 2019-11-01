/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "vs/editor/common/modes/supports/tokenization"], function (require, exports, assert, fs, tokenization_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function parseTest(fileName) {
        const testContents = fs.readFileSync(fileName).toString();
        const lines = testContents.split(/\r\n|\n/);
        const magicToken = lines[0];
        let currentElement = {
            line: lines[1],
            assertions: []
        };
        let parsedTest = [];
        for (let i = 2; i < lines.length; i++) {
            let line = lines[i];
            if (line.substr(0, magicToken.length) === magicToken) {
                // this is an assertion line
                let m1 = line.substr(magicToken.length).match(/^( +)([\^]+) (\w+)\\?$/);
                if (m1) {
                    currentElement.assertions.push({
                        testLineNumber: i + 1,
                        startOffset: magicToken.length + m1[1].length,
                        length: m1[2].length,
                        expectedTokenType: tokenization_1.toStandardTokenType(m1[3])
                    });
                }
                else {
                    let m2 = line.substr(magicToken.length).match(/^( +)<(-+) (\w+)\\?$/);
                    if (m2) {
                        currentElement.assertions.push({
                            testLineNumber: i + 1,
                            startOffset: 0,
                            length: m2[2].length,
                            expectedTokenType: tokenization_1.toStandardTokenType(m2[3])
                        });
                    }
                    else {
                        throw new Error(`Invalid test line at line number ${i + 1}.`);
                    }
                }
            }
            else {
                // this is a line to be parsed
                parsedTest.push(currentElement);
                currentElement = {
                    line: line,
                    assertions: []
                };
            }
        }
        parsedTest.push(currentElement);
        let assertions = [];
        let offset = 0;
        for (let i = 0; i < parsedTest.length; i++) {
            const parsedTestLine = parsedTest[i];
            for (let j = 0; j < parsedTestLine.assertions.length; j++) {
                const assertion = parsedTestLine.assertions[j];
                assertions.push({
                    testLineNumber: assertion.testLineNumber,
                    startOffset: offset + assertion.startOffset,
                    length: assertion.length,
                    tokenType: assertion.expectedTokenType
                });
            }
            offset += parsedTestLine.line.length + 1;
        }
        let content = parsedTest.map(parsedTestLine => parsedTestLine.line).join('\n');
        return { content, assertions };
    }
    // @ts-ignore
    function executeTest(fileName, parseFunc) {
        const { content, assertions } = parseTest(fileName);
        const actual = parseFunc(content);
        let actualIndex = 0, actualCount = actual.length / 3;
        for (let i = 0; i < assertions.length; i++) {
            const assertion = assertions[i];
            while (actualIndex < actualCount && actual[3 * actualIndex] + actual[3 * actualIndex + 1] <= assertion.startOffset) {
                actualIndex++;
            }
            assert.ok(actual[3 * actualIndex] <= assertion.startOffset, `Line ${assertion.testLineNumber} : startOffset : ${actual[3 * actualIndex]} <= ${assertion.startOffset}`);
            assert.ok(actual[3 * actualIndex] + actual[3 * actualIndex + 1] >= assertion.startOffset + assertion.length, `Line ${assertion.testLineNumber} : length : ${actual[3 * actualIndex]} + ${actual[3 * actualIndex + 1]} >= ${assertion.startOffset} + ${assertion.length}.`);
            assert.equal(actual[3 * actualIndex + 2], assertion.tokenType, `Line ${assertion.testLineNumber} : tokenType`);
        }
    }
    suite('Classification', () => {
        test('TypeScript', () => {
            // executeTest(getPathFromAmdModule(require, 'vs/editor/test/node/classification/typescript-test.ts').replace(/\bout\b/, 'src'), parse);
        });
    });
});
//# sourceMappingURL=typescript.test.js.map