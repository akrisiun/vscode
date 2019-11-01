/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/node/decoder"], function (require, exports, assert, decoder) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Decoder', () => {
        test('decoding', () => {
            const lineDecoder = new decoder.LineDecoder();
            let res = lineDecoder.write(Buffer.from('hello'));
            assert.equal(res.length, 0);
            res = lineDecoder.write(Buffer.from('\nworld'));
            assert.equal(res[0], 'hello');
            assert.equal(res.length, 1);
            assert.equal(lineDecoder.end(), 'world');
        });
    });
});
//# sourceMappingURL=decoder.test.js.map