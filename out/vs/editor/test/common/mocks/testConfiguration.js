/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/config/commonEditorConfig", "vs/editor/common/config/editorOptions", "vs/editor/common/config/fontInfo"], function (require, exports, commonEditorConfig_1, editorOptions_1, fontInfo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestConfiguration = void 0;
    class TestConfiguration extends commonEditorConfig_1.CommonEditorConfiguration {
        constructor(opts) {
            super(false, opts);
            this._recomputeOptions();
        }
        _getEnvConfiguration() {
            return {
                extraEditorClassName: '',
                outerWidth: 100,
                outerHeight: 100,
                emptySelectionClipboard: true,
                pixelRatio: 1,
                zoomLevel: 0,
                accessibilitySupport: 0 /* Unknown */
            };
        }
        readConfiguration(styling) {
            return new fontInfo_1.FontInfo({
                zoomLevel: 0,
                fontFamily: 'mockFont',
                fontWeight: 'normal',
                fontSize: 14,
                fontFeatureSettings: editorOptions_1.EditorFontLigatures.OFF,
                lineHeight: 19,
                letterSpacing: 1.5,
                isMonospace: true,
                typicalHalfwidthCharacterWidth: 10,
                typicalFullwidthCharacterWidth: 20,
                canUseHalfwidthRightwardsArrow: true,
                spaceWidth: 10,
                middotWidth: 10,
                wsmiddotWidth: 10,
                maxDigitWidth: 10,
            }, true);
        }
    }
    exports.TestConfiguration = TestConfiguration;
});
//# sourceMappingURL=testConfiguration.js.map