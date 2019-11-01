/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/strings", "vs/platform/log/common/log", "vs/workbench/services/search/common/search", "vs/base/common/arrays", "vs/workbench/services/search/common/searchExtTypes"], function (require, exports, strings_1, log_1, search_1, arrays_1, searchExtTypes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function anchorGlob(glob) {
        return strings_1.startsWith(glob, '**') || strings_1.startsWith(glob, '/') ? glob : `/${glob}`;
    }
    exports.anchorGlob = anchorGlob;
    /**
     * Create a vscode.TextSearchMatch by using our internal TextSearchMatch type for its previewOptions logic.
     */
    function createTextSearchResult(uri, text, range, previewOptions) {
        const searchRange = arrays_1.mapArrayOrNot(range, rangeToSearchRange);
        const internalResult = new search_1.TextSearchMatch(text, searchRange, previewOptions);
        const internalPreviewRange = internalResult.preview.matches;
        return {
            ranges: arrays_1.mapArrayOrNot(searchRange, searchRangeToRange),
            uri,
            preview: {
                text: internalResult.preview.text,
                matches: arrays_1.mapArrayOrNot(internalPreviewRange, searchRangeToRange)
            }
        };
    }
    exports.createTextSearchResult = createTextSearchResult;
    function rangeToSearchRange(range) {
        return new search_1.SearchRange(range.start.line, range.start.character, range.end.line, range.end.character);
    }
    function searchRangeToRange(range) {
        return new searchExtTypes.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
    }
    let OutputChannel = class OutputChannel {
        constructor(logService) {
            this.logService = logService;
        }
        appendLine(msg) {
            this.logService.debug('RipgrepSearchEH#search', msg);
        }
    };
    OutputChannel = __decorate([
        __param(0, log_1.ILogService)
    ], OutputChannel);
    exports.OutputChannel = OutputChannel;
});
//# sourceMappingURL=ripgrepSearchUtils.js.map