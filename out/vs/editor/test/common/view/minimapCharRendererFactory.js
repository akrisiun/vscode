/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/view/minimapCharRenderer"], function (require, exports, minimapCharRenderer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var InternalConstants;
    (function (InternalConstants) {
        InternalConstants[InternalConstants["CA_CHANNELS_CNT"] = 2] = "CA_CHANNELS_CNT";
    })(InternalConstants || (InternalConstants = {}));
    class MinimapCharRendererFactory {
        static create(source) {
            const expectedLength = (16 /* SAMPLED_CHAR_HEIGHT */ * 10 /* SAMPLED_CHAR_WIDTH */ * 4 /* RGBA_CHANNELS_CNT */ * 95 /* CHAR_COUNT */);
            if (source.length !== expectedLength) {
                throw new Error('Unexpected source in MinimapCharRenderer');
            }
            let x2CharData = this.toGrayscale(MinimapCharRendererFactory._downsample2x(source));
            let x1CharData = this.toGrayscale(MinimapCharRendererFactory._downsample1x(source));
            return new minimapCharRenderer_1.MinimapCharRenderer(x2CharData, x1CharData);
        }
        static toGrayscale(charData) {
            let newLength = charData.length / 2;
            let result = new Uint8ClampedArray(newLength);
            let sourceOffset = 0;
            for (let i = 0; i < newLength; i++) {
                let color = charData[sourceOffset];
                let alpha = charData[sourceOffset + 1];
                let newColor = Math.round((color * alpha) / 255);
                result[i] = newColor;
                sourceOffset += 2;
            }
            return result;
        }
        static _extractSampledChar(source, charIndex, dest) {
            let destOffset = 0;
            for (let i = 0; i < 16 /* SAMPLED_CHAR_HEIGHT */; i++) {
                let sourceOffset = (10 /* SAMPLED_CHAR_WIDTH */ * 4 /* RGBA_CHANNELS_CNT */ * 95 /* CHAR_COUNT */ * i
                    + 10 /* SAMPLED_CHAR_WIDTH */ * 4 /* RGBA_CHANNELS_CNT */ * charIndex);
                for (let j = 0; j < 10 /* SAMPLED_CHAR_WIDTH */; j++) {
                    for (let c = 0; c < 4 /* RGBA_CHANNELS_CNT */; c++) {
                        dest[destOffset] = source[sourceOffset];
                        sourceOffset++;
                        destOffset++;
                    }
                }
            }
        }
        static _downsample2xChar(source, dest) {
            // chars are 2 x 4px (width x height)
            const resultLen = 4 /* x2_CHAR_HEIGHT */ * 2 /* x2_CHAR_WIDTH */ * 2 /* CA_CHANNELS_CNT */;
            const result = new Uint16Array(resultLen);
            for (let i = 0; i < resultLen; i++) {
                result[i] = 0;
            }
            let inputOffset = 0, globalOutputOffset = 0;
            for (let i = 0; i < 16 /* SAMPLED_CHAR_HEIGHT */; i++) {
                let outputOffset = globalOutputOffset;
                let color = 0;
                let alpha = 0;
                for (let j = 0; j < 5 /* SAMPLED_HALF_CHAR_WIDTH */; j++) {
                    color += source[inputOffset]; // R
                    alpha += source[inputOffset + 3]; // A
                    inputOffset += 4 /* RGBA_CHANNELS_CNT */;
                }
                result[outputOffset] += color;
                result[outputOffset + 1] += alpha;
                outputOffset += 2 /* CA_CHANNELS_CNT */;
                color = 0;
                alpha = 0;
                for (let j = 0; j < 5 /* SAMPLED_HALF_CHAR_WIDTH */; j++) {
                    color += source[inputOffset]; // R
                    alpha += source[inputOffset + 3]; // A
                    inputOffset += 4 /* RGBA_CHANNELS_CNT */;
                }
                result[outputOffset] += color;
                result[outputOffset + 1] += alpha;
                outputOffset += 2 /* CA_CHANNELS_CNT */;
                if (i === 2 || i === 5 || i === 8) {
                    globalOutputOffset = outputOffset;
                }
            }
            for (let i = 0; i < resultLen; i++) {
                dest[i] = result[i] / 12; // 15 it should be
            }
        }
        static _downsample2x(data) {
            const resultLen = 4 /* x2_CHAR_HEIGHT */ * 2 /* x2_CHAR_WIDTH */ * 2 /* CA_CHANNELS_CNT */ * 95 /* CHAR_COUNT */;
            const result = new Uint8ClampedArray(resultLen);
            const sampledChar = new Uint8ClampedArray(16 /* SAMPLED_CHAR_HEIGHT */ * 10 /* SAMPLED_CHAR_WIDTH */ * 4 /* RGBA_CHANNELS_CNT */);
            const downsampledChar = new Uint8ClampedArray(4 /* x2_CHAR_HEIGHT */ * 2 /* x2_CHAR_WIDTH */ * 2 /* CA_CHANNELS_CNT */);
            for (let charIndex = 0; charIndex < 95 /* CHAR_COUNT */; charIndex++) {
                this._extractSampledChar(data, charIndex, sampledChar);
                this._downsample2xChar(sampledChar, downsampledChar);
                let resultOffset = (4 /* x2_CHAR_HEIGHT */ * 2 /* x2_CHAR_WIDTH */ * 2 /* CA_CHANNELS_CNT */ * charIndex);
                for (let i = 0; i < downsampledChar.length; i++) {
                    result[resultOffset + i] = downsampledChar[i];
                }
            }
            return result;
        }
        static _downsample1xChar(source, dest) {
            // chars are 1 x 2px (width x height)
            const resultLen = 2 /* x1_CHAR_HEIGHT */ * 1 /* x1_CHAR_WIDTH */ * 2 /* CA_CHANNELS_CNT */;
            const result = new Uint16Array(resultLen);
            for (let i = 0; i < resultLen; i++) {
                result[i] = 0;
            }
            let inputOffset = 0, globalOutputOffset = 0;
            for (let i = 0; i < 16 /* SAMPLED_CHAR_HEIGHT */; i++) {
                let outputOffset = globalOutputOffset;
                let color = 0;
                let alpha = 0;
                for (let j = 0; j < 10 /* SAMPLED_CHAR_WIDTH */; j++) {
                    color += source[inputOffset]; // R
                    alpha += source[inputOffset + 3]; // A
                    inputOffset += 4 /* RGBA_CHANNELS_CNT */;
                }
                result[outputOffset] += color;
                result[outputOffset + 1] += alpha;
                outputOffset += 2 /* CA_CHANNELS_CNT */;
                if (i === 5) {
                    globalOutputOffset = outputOffset;
                }
            }
            for (let i = 0; i < resultLen; i++) {
                dest[i] = result[i] / 50; // 60 it should be
            }
        }
        static _downsample1x(data) {
            const resultLen = 2 /* x1_CHAR_HEIGHT */ * 1 /* x1_CHAR_WIDTH */ * 2 /* CA_CHANNELS_CNT */ * 95 /* CHAR_COUNT */;
            const result = new Uint8ClampedArray(resultLen);
            const sampledChar = new Uint8ClampedArray(16 /* SAMPLED_CHAR_HEIGHT */ * 10 /* SAMPLED_CHAR_WIDTH */ * 4 /* RGBA_CHANNELS_CNT */);
            const downsampledChar = new Uint8ClampedArray(2 /* x1_CHAR_HEIGHT */ * 1 /* x1_CHAR_WIDTH */ * 2 /* CA_CHANNELS_CNT */);
            for (let charIndex = 0; charIndex < 95 /* CHAR_COUNT */; charIndex++) {
                this._extractSampledChar(data, charIndex, sampledChar);
                this._downsample1xChar(sampledChar, downsampledChar);
                let resultOffset = (2 /* x1_CHAR_HEIGHT */ * 1 /* x1_CHAR_WIDTH */ * 2 /* CA_CHANNELS_CNT */ * charIndex);
                for (let i = 0; i < downsampledChar.length; i++) {
                    result[resultOffset + i] = downsampledChar[i];
                }
            }
            return result;
        }
    }
    exports.MinimapCharRendererFactory = MinimapCharRendererFactory;
});
//# sourceMappingURL=minimapCharRendererFactory.js.map