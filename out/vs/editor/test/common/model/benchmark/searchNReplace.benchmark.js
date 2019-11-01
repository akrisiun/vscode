/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/test/common/model/benchmark/benchmarkUtils", "vs/editor/test/common/model/linesTextBuffer/textBufferAutoTestUtils"], function (require, exports, benchmarkUtils_1, textBufferAutoTestUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let fileSizes = [1, 1000, 64 * 1000, 32 * 1000 * 1000];
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
        let replaceSuite = new benchmarkUtils_1.BenchmarkSuite({
            name: `File Size: ${fileSize}Byte`,
            iterations: 10
        });
        let edits = textBufferAutoTestUtils_1.generateRandomReplaces(chunks, 500, 5, 10);
        for (let i of [10, 100, 500]) {
            replaceSuite.add({
                name: `replace ${i} occurrences`,
                buildBuffer: (textBufferBuilder) => {
                    chunks.forEach(ck => textBufferBuilder.acceptChunk(ck));
                    return textBufferBuilder.finish();
                },
                preCycle: (textBuffer) => {
                    return textBuffer;
                },
                fn: (textBuffer) => {
                    textBuffer.applyEdits(edits.slice(0, i), false);
                }
            });
        }
        replaceSuite.run();
    }
});
//# sourceMappingURL=searchNReplace.benchmark.js.map