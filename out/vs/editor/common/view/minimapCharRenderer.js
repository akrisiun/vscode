/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/editor/common/core/rgba", "vs/editor/common/modes"], function (require, exports, event_1, rgba_1, modes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MinimapTokensColorTracker {
        constructor() {
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._updateColorMap();
            modes_1.TokenizationRegistry.onDidChange((e) => {
                if (e.changedColorMap) {
                    this._updateColorMap();
                }
            });
        }
        static getInstance() {
            if (!this._INSTANCE) {
                this._INSTANCE = new MinimapTokensColorTracker();
            }
            return this._INSTANCE;
        }
        _updateColorMap() {
            const colorMap = modes_1.TokenizationRegistry.getColorMap();
            if (!colorMap) {
                this._colors = [rgba_1.RGBA8.Empty];
                this._backgroundIsLight = true;
                return;
            }
            this._colors = [rgba_1.RGBA8.Empty];
            for (let colorId = 1; colorId < colorMap.length; colorId++) {
                const source = colorMap[colorId].rgba;
                // Use a VM friendly data-type
                this._colors[colorId] = new rgba_1.RGBA8(source.r, source.g, source.b, Math.round(source.a * 255));
            }
            let backgroundLuminosity = colorMap[2 /* DefaultBackground */].getRelativeLuminance();
            this._backgroundIsLight = (backgroundLuminosity >= 0.5);
            this._onDidChange.fire(undefined);
        }
        getColor(colorId) {
            if (colorId < 1 || colorId >= this._colors.length) {
                // background color (basically invisible)
                colorId = 2 /* DefaultBackground */;
            }
            return this._colors[colorId];
        }
        backgroundIsLight() {
            return this._backgroundIsLight;
        }
    }
    exports.MinimapTokensColorTracker = MinimapTokensColorTracker;
    MinimapTokensColorTracker._INSTANCE = null;
    var Constants;
    (function (Constants) {
        Constants[Constants["START_CH_CODE"] = 32] = "START_CH_CODE";
        Constants[Constants["END_CH_CODE"] = 126] = "END_CH_CODE";
        Constants[Constants["CHAR_COUNT"] = 95] = "CHAR_COUNT";
        Constants[Constants["SAMPLED_CHAR_HEIGHT"] = 16] = "SAMPLED_CHAR_HEIGHT";
        Constants[Constants["SAMPLED_CHAR_WIDTH"] = 10] = "SAMPLED_CHAR_WIDTH";
        Constants[Constants["SAMPLED_HALF_CHAR_WIDTH"] = 5] = "SAMPLED_HALF_CHAR_WIDTH";
        Constants[Constants["x2_CHAR_HEIGHT"] = 4] = "x2_CHAR_HEIGHT";
        Constants[Constants["x2_CHAR_WIDTH"] = 2] = "x2_CHAR_WIDTH";
        Constants[Constants["x1_CHAR_HEIGHT"] = 2] = "x1_CHAR_HEIGHT";
        Constants[Constants["x1_CHAR_WIDTH"] = 1] = "x1_CHAR_WIDTH";
        Constants[Constants["RGBA_CHANNELS_CNT"] = 4] = "RGBA_CHANNELS_CNT";
    })(Constants = exports.Constants || (exports.Constants = {}));
    class MinimapCharRenderer {
        constructor(x2CharData, x1CharData) {
            const x2ExpectedLen = 4 /* x2_CHAR_HEIGHT */ * 2 /* x2_CHAR_WIDTH */ * 95 /* CHAR_COUNT */;
            if (x2CharData.length !== x2ExpectedLen) {
                throw new Error('Invalid x2CharData');
            }
            const x1ExpectedLen = 2 /* x1_CHAR_HEIGHT */ * 1 /* x1_CHAR_WIDTH */ * 95 /* CHAR_COUNT */;
            if (x1CharData.length !== x1ExpectedLen) {
                throw new Error('Invalid x1CharData');
            }
            this.x2charData = x2CharData;
            this.x1charData = x1CharData;
            this.x2charDataLight = MinimapCharRenderer.soften(x2CharData, 12 / 15);
            this.x1charDataLight = MinimapCharRenderer.soften(x1CharData, 50 / 60);
        }
        static soften(input, ratio) {
            let result = new Uint8ClampedArray(input.length);
            for (let i = 0, len = input.length; i < len; i++) {
                result[i] = input[i] * ratio;
            }
            return result;
        }
        static _getChIndex(chCode) {
            chCode -= 32 /* START_CH_CODE */;
            if (chCode < 0) {
                chCode += 95 /* CHAR_COUNT */;
            }
            return (chCode % 95 /* CHAR_COUNT */);
        }
        x2RenderChar(target, dx, dy, chCode, color, backgroundColor, useLighterFont) {
            if (dx + 2 /* x2_CHAR_WIDTH */ > target.width || dy + 4 /* x2_CHAR_HEIGHT */ > target.height) {
                console.warn('bad render request outside image data');
                return;
            }
            const x2CharData = useLighterFont ? this.x2charDataLight : this.x2charData;
            const chIndex = MinimapCharRenderer._getChIndex(chCode);
            const outWidth = target.width * 4 /* RGBA_CHANNELS_CNT */;
            const backgroundR = backgroundColor.r;
            const backgroundG = backgroundColor.g;
            const backgroundB = backgroundColor.b;
            const deltaR = color.r - backgroundR;
            const deltaG = color.g - backgroundG;
            const deltaB = color.b - backgroundB;
            const dest = target.data;
            const sourceOffset = chIndex * 4 /* x2_CHAR_HEIGHT */ * 2 /* x2_CHAR_WIDTH */;
            let destOffset = dy * outWidth + dx * 4 /* RGBA_CHANNELS_CNT */;
            {
                const c = x2CharData[sourceOffset] / 255;
                dest[destOffset + 0] = backgroundR + deltaR * c;
                dest[destOffset + 1] = backgroundG + deltaG * c;
                dest[destOffset + 2] = backgroundB + deltaB * c;
            }
            {
                const c = x2CharData[sourceOffset + 1] / 255;
                dest[destOffset + 4] = backgroundR + deltaR * c;
                dest[destOffset + 5] = backgroundG + deltaG * c;
                dest[destOffset + 6] = backgroundB + deltaB * c;
            }
            destOffset += outWidth;
            {
                const c = x2CharData[sourceOffset + 2] / 255;
                dest[destOffset + 0] = backgroundR + deltaR * c;
                dest[destOffset + 1] = backgroundG + deltaG * c;
                dest[destOffset + 2] = backgroundB + deltaB * c;
            }
            {
                const c = x2CharData[sourceOffset + 3] / 255;
                dest[destOffset + 4] = backgroundR + deltaR * c;
                dest[destOffset + 5] = backgroundG + deltaG * c;
                dest[destOffset + 6] = backgroundB + deltaB * c;
            }
            destOffset += outWidth;
            {
                const c = x2CharData[sourceOffset + 4] / 255;
                dest[destOffset + 0] = backgroundR + deltaR * c;
                dest[destOffset + 1] = backgroundG + deltaG * c;
                dest[destOffset + 2] = backgroundB + deltaB * c;
            }
            {
                const c = x2CharData[sourceOffset + 5] / 255;
                dest[destOffset + 4] = backgroundR + deltaR * c;
                dest[destOffset + 5] = backgroundG + deltaG * c;
                dest[destOffset + 6] = backgroundB + deltaB * c;
            }
            destOffset += outWidth;
            {
                const c = x2CharData[sourceOffset + 6] / 255;
                dest[destOffset + 0] = backgroundR + deltaR * c;
                dest[destOffset + 1] = backgroundG + deltaG * c;
                dest[destOffset + 2] = backgroundB + deltaB * c;
            }
            {
                const c = x2CharData[sourceOffset + 7] / 255;
                dest[destOffset + 4] = backgroundR + deltaR * c;
                dest[destOffset + 5] = backgroundG + deltaG * c;
                dest[destOffset + 6] = backgroundB + deltaB * c;
            }
        }
        x1RenderChar(target, dx, dy, chCode, color, backgroundColor, useLighterFont) {
            if (dx + 1 /* x1_CHAR_WIDTH */ > target.width || dy + 2 /* x1_CHAR_HEIGHT */ > target.height) {
                console.warn('bad render request outside image data');
                return;
            }
            const x1CharData = useLighterFont ? this.x1charDataLight : this.x1charData;
            const chIndex = MinimapCharRenderer._getChIndex(chCode);
            const outWidth = target.width * 4 /* RGBA_CHANNELS_CNT */;
            const backgroundR = backgroundColor.r;
            const backgroundG = backgroundColor.g;
            const backgroundB = backgroundColor.b;
            const deltaR = color.r - backgroundR;
            const deltaG = color.g - backgroundG;
            const deltaB = color.b - backgroundB;
            const dest = target.data;
            const sourceOffset = chIndex * 2 /* x1_CHAR_HEIGHT */ * 1 /* x1_CHAR_WIDTH */;
            let destOffset = dy * outWidth + dx * 4 /* RGBA_CHANNELS_CNT */;
            {
                const c = x1CharData[sourceOffset] / 255;
                dest[destOffset + 0] = backgroundR + deltaR * c;
                dest[destOffset + 1] = backgroundG + deltaG * c;
                dest[destOffset + 2] = backgroundB + deltaB * c;
            }
            destOffset += outWidth;
            {
                const c = x1CharData[sourceOffset + 1] / 255;
                dest[destOffset + 0] = backgroundR + deltaR * c;
                dest[destOffset + 1] = backgroundG + deltaG * c;
                dest[destOffset + 2] = backgroundB + deltaB * c;
            }
        }
        x2BlockRenderChar(target, dx, dy, color, backgroundColor, useLighterFont) {
            if (dx + 2 /* x2_CHAR_WIDTH */ > target.width || dy + 4 /* x2_CHAR_HEIGHT */ > target.height) {
                console.warn('bad render request outside image data');
                return;
            }
            const outWidth = target.width * 4 /* RGBA_CHANNELS_CNT */;
            const c = 0.5;
            const backgroundR = backgroundColor.r;
            const backgroundG = backgroundColor.g;
            const backgroundB = backgroundColor.b;
            const deltaR = color.r - backgroundR;
            const deltaG = color.g - backgroundG;
            const deltaB = color.b - backgroundB;
            const colorR = backgroundR + deltaR * c;
            const colorG = backgroundG + deltaG * c;
            const colorB = backgroundB + deltaB * c;
            const dest = target.data;
            let destOffset = dy * outWidth + dx * 4 /* RGBA_CHANNELS_CNT */;
            {
                dest[destOffset + 0] = colorR;
                dest[destOffset + 1] = colorG;
                dest[destOffset + 2] = colorB;
            }
            {
                dest[destOffset + 4] = colorR;
                dest[destOffset + 5] = colorG;
                dest[destOffset + 6] = colorB;
            }
            destOffset += outWidth;
            {
                dest[destOffset + 0] = colorR;
                dest[destOffset + 1] = colorG;
                dest[destOffset + 2] = colorB;
            }
            {
                dest[destOffset + 4] = colorR;
                dest[destOffset + 5] = colorG;
                dest[destOffset + 6] = colorB;
            }
            destOffset += outWidth;
            {
                dest[destOffset + 0] = colorR;
                dest[destOffset + 1] = colorG;
                dest[destOffset + 2] = colorB;
            }
            {
                dest[destOffset + 4] = colorR;
                dest[destOffset + 5] = colorG;
                dest[destOffset + 6] = colorB;
            }
            destOffset += outWidth;
            {
                dest[destOffset + 0] = colorR;
                dest[destOffset + 1] = colorG;
                dest[destOffset + 2] = colorB;
            }
            {
                dest[destOffset + 4] = colorR;
                dest[destOffset + 5] = colorG;
                dest[destOffset + 6] = colorB;
            }
        }
        x1BlockRenderChar(target, dx, dy, color, backgroundColor, useLighterFont) {
            if (dx + 1 /* x1_CHAR_WIDTH */ > target.width || dy + 2 /* x1_CHAR_HEIGHT */ > target.height) {
                console.warn('bad render request outside image data');
                return;
            }
            const outWidth = target.width * 4 /* RGBA_CHANNELS_CNT */;
            const c = 0.5;
            const backgroundR = backgroundColor.r;
            const backgroundG = backgroundColor.g;
            const backgroundB = backgroundColor.b;
            const deltaR = color.r - backgroundR;
            const deltaG = color.g - backgroundG;
            const deltaB = color.b - backgroundB;
            const colorR = backgroundR + deltaR * c;
            const colorG = backgroundG + deltaG * c;
            const colorB = backgroundB + deltaB * c;
            const dest = target.data;
            let destOffset = dy * outWidth + dx * 4 /* RGBA_CHANNELS_CNT */;
            {
                dest[destOffset + 0] = colorR;
                dest[destOffset + 1] = colorG;
                dest[destOffset + 2] = colorB;
            }
            destOffset += outWidth;
            {
                dest[destOffset + 0] = colorR;
                dest[destOffset + 1] = colorG;
                dest[destOffset + 2] = colorB;
            }
        }
    }
    exports.MinimapCharRenderer = MinimapCharRenderer;
});
//# sourceMappingURL=minimapCharRenderer.js.map