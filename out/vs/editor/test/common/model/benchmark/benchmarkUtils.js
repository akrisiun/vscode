/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder"], function (require, exports, pieceTreeTextBufferBuilder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function doBenchmark(id, ts, fn) {
        let columns = [id];
        for (const t of ts) {
            let start = process.hrtime();
            fn(t);
            let diff = process.hrtime(start);
            columns.push(`${(diff[0] * 1000 + diff[1] / 1000000).toFixed(3)} ms`);
        }
        console.log('|' + columns.join('\t|') + '|');
    }
    exports.doBenchmark = doBenchmark;
    class BenchmarkSuite {
        constructor(suiteOptions) {
            this.name = suiteOptions.name;
            this.iterations = suiteOptions.iterations;
            this.benchmarks = [];
        }
        add(benchmark) {
            this.benchmarks.push(benchmark);
        }
        run() {
            console.log(`|${this.name}\t|line buffer\t|piece table\t|edcore\t`);
            console.log('|---|---|---|---|');
            for (const benchmark of this.benchmarks) {
                let columns = [benchmark.name];
                [new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder()].forEach((builder) => {
                    let timeDiffTotal = 0;
                    for (let j = 0; j < this.iterations; j++) {
                        let factory = benchmark.buildBuffer(builder);
                        let buffer = factory.create(1 /* LF */);
                        benchmark.preCycle(buffer);
                        let start = process.hrtime();
                        benchmark.fn(buffer);
                        let diff = process.hrtime(start);
                        timeDiffTotal += (diff[0] * 1000 * 1000 + diff[1] / 1000);
                    }
                    columns.push(`${(timeDiffTotal / 1000 / this.iterations).toFixed(3)} ms`);
                });
                console.log('|' + columns.join('\t|') + '|');
            }
            console.log('\n');
        }
    }
    exports.BenchmarkSuite = BenchmarkSuite;
});
//# sourceMappingURL=benchmarkUtils.js.map