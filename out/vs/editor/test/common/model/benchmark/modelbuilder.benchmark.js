/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder", "vs/editor/test/common/model/benchmark/benchmarkUtils", "vs/editor/test/common/model/linesTextBuffer/textBufferAutoTestUtils"], function (require, exports, pieceTreeTextBufferBuilder_1, benchmarkUtils_1, textBufferAutoTestUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let pieceTreeTextBufferBuilder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
    let chunks = [];
    for (let i = 0; i < 100; i++) {
        chunks.push(textBufferAutoTestUtils_1.generateRandomChunkWithLF(16 * 1000, 64 * 1000));
    }
    let modelBuildBenchmark = function (id, builders, chunkCnt) {
        benchmarkUtils_1.doBenchmark(id, builders, builder => {
            for (let i = 0, len = Math.min(chunkCnt, chunks.length); i < len; i++) {
                builder.acceptChunk(chunks[i]);
            }
            builder.finish();
        });
    };
    console.log(`|model builder\t|line buffer\t|piece table\t|`);
    console.log('|---|---|---|');
    for (let i of [10, 100]) {
        modelBuildBenchmark(`${i} random chunks`, [pieceTreeTextBufferBuilder], i);
    }
});
//# sourceMappingURL=modelbuilder.benchmark.js.map