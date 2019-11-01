/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/test/common/model/benchmark/benchmarkUtils", "vs/editor/test/common/model/linesTextBuffer/textBufferAutoTestUtils"], function (require, exports, range_1, benchmarkUtils_1, textBufferAutoTestUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let fileSizes = [1, 1000, 64 * 1000, 32 * 1000 * 1000];
    let editTypes = [
        {
            id: 'random edits',
            generateEdits: textBufferAutoTestUtils_1.generateRandomEdits
        },
        {
            id: 'sequential inserts',
            generateEdits: textBufferAutoTestUtils_1.generateSequentialInserts
        }
    ];
    for (let fileSize of fileSizes) {
        let chunks = [];
        let chunkCnt = Math.floor(fileSize / (64 * 1000));
        if (chunkCnt === 0) {
            chunks.push(textBufferAutoTestUtils_1.generateRandomChunkWithLF(fileSize, fileSize));
        }
        else {
            let chunk = textBufferAutoTestUtils_1.generateRandomChunkWithLF(64 * 1000, 64 * 1000);
            // try to avoid OOM
            for (let j = 0; j < chunkCnt; j++) {
                chunks.push(Buffer.from(chunk + j).toString());
            }
        }
        for (let editType of editTypes) {
            const edits = editType.generateEdits(chunks, 1000);
            let editsSuite = new benchmarkUtils_1.BenchmarkSuite({
                name: `File Size: ${fileSize}Byte, ${editType.id}`,
                iterations: 10
            });
            editsSuite.add({
                name: `apply 1000 edits`,
                buildBuffer: (textBufferBuilder) => {
                    chunks.forEach(ck => textBufferBuilder.acceptChunk(ck));
                    return textBufferBuilder.finish();
                },
                preCycle: (textBuffer) => {
                    return textBuffer;
                },
                fn: (textBuffer) => {
                    // for line model, this loop doesn't reflect the real situation.
                    for (const edit of edits) {
                        textBuffer.applyEdits([edit], false);
                    }
                }
            });
            editsSuite.add({
                name: `Read all lines after 1000 edits`,
                buildBuffer: (textBufferBuilder) => {
                    chunks.forEach(ck => textBufferBuilder.acceptChunk(ck));
                    return textBufferBuilder.finish();
                },
                preCycle: (textBuffer) => {
                    for (const edit of edits) {
                        textBuffer.applyEdits([edit], false);
                    }
                    return textBuffer;
                },
                fn: (textBuffer) => {
                    for (let j = 0, len = textBuffer.getLineCount(); j < len; j++) {
                        let str = textBuffer.getLineContent(j + 1);
                        let firstChar = str.charCodeAt(0);
                        let lastChar = str.charCodeAt(str.length - 1);
                        firstChar = firstChar - lastChar;
                        lastChar = firstChar + lastChar;
                        firstChar = lastChar - firstChar;
                    }
                }
            });
            editsSuite.add({
                name: `Read 10 random windows after 1000 edits`,
                buildBuffer: (textBufferBuilder) => {
                    chunks.forEach(ck => textBufferBuilder.acceptChunk(ck));
                    return textBufferBuilder.finish();
                },
                preCycle: (textBuffer) => {
                    for (const edit of edits) {
                        textBuffer.applyEdits([edit], false);
                    }
                    return textBuffer;
                },
                fn: (textBuffer) => {
                    for (let i = 0; i < 10; i++) {
                        let minLine = 1;
                        let maxLine = textBuffer.getLineCount();
                        let startLine = textBufferAutoTestUtils_1.getRandomInt(minLine, Math.max(minLine, maxLine - 100));
                        let endLine = Math.min(maxLine, startLine + 100);
                        for (let j = startLine; j < endLine; j++) {
                            let str = textBuffer.getLineContent(j + 1);
                            let firstChar = str.charCodeAt(0);
                            let lastChar = str.charCodeAt(str.length - 1);
                            firstChar = firstChar - lastChar;
                            lastChar = firstChar + lastChar;
                            firstChar = lastChar - firstChar;
                        }
                    }
                }
            });
            editsSuite.add({
                name: `save file after 1000 edits`,
                buildBuffer: (textBufferBuilder) => {
                    chunks.forEach(ck => textBufferBuilder.acceptChunk(ck));
                    return textBufferBuilder.finish();
                },
                preCycle: (textBuffer) => {
                    for (const edit of edits) {
                        textBuffer.applyEdits([edit], false);
                    }
                    return textBuffer;
                },
                fn: (textBuffer) => {
                    const lineCount = textBuffer.getLineCount();
                    const fullModelRange = new range_1.Range(1, 1, lineCount, textBuffer.getLineLength(lineCount) + 1);
                    textBuffer.getValueInRange(fullModelRange, 1 /* LF */);
                }
            });
            editsSuite.run();
        }
    }
});
//# sourceMappingURL=operations.benchmark.js.map