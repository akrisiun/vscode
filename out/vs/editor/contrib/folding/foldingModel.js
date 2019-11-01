/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "./foldingRanges"], function (require, exports, event_1, foldingRanges_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FoldingModel {
        constructor(textModel, decorationProvider) {
            this._updateEventEmitter = new event_1.Emitter();
            this.onDidChange = this._updateEventEmitter.event;
            this._textModel = textModel;
            this._decorationProvider = decorationProvider;
            this._regions = new foldingRanges_1.FoldingRegions(new Uint32Array(0), new Uint32Array(0));
            this._editorDecorationIds = [];
            this._isInitialized = false;
        }
        get regions() { return this._regions; }
        get textModel() { return this._textModel; }
        get isInitialized() { return this._isInitialized; }
        toggleCollapseState(regions) {
            if (!regions.length) {
                return;
            }
            let processed = {};
            this._decorationProvider.changeDecorations(accessor => {
                for (let region of regions) {
                    let index = region.regionIndex;
                    let editorDecorationId = this._editorDecorationIds[index];
                    if (editorDecorationId && !processed[editorDecorationId]) {
                        processed[editorDecorationId] = true;
                        let newCollapseState = !this._regions.isCollapsed(index);
                        this._regions.setCollapsed(index, newCollapseState);
                        accessor.changeDecorationOptions(editorDecorationId, this._decorationProvider.getDecorationOption(newCollapseState));
                    }
                }
            });
            this._updateEventEmitter.fire({ model: this, collapseStateChanged: regions });
        }
        update(newRegions, blockedLineNumers = []) {
            let newEditorDecorations = [];
            let isBlocked = (startLineNumber, endLineNumber) => {
                for (let blockedLineNumber of blockedLineNumers) {
                    if (startLineNumber < blockedLineNumber && blockedLineNumber <= endLineNumber) { // first line is visible
                        return true;
                    }
                }
                return false;
            };
            let initRange = (index, isCollapsed) => {
                let startLineNumber = newRegions.getStartLineNumber(index);
                if (isCollapsed && isBlocked(startLineNumber, newRegions.getEndLineNumber(index))) {
                    isCollapsed = false;
                }
                newRegions.setCollapsed(index, isCollapsed);
                let maxColumn = this._textModel.getLineMaxColumn(startLineNumber);
                let decorationRange = {
                    startLineNumber: startLineNumber,
                    startColumn: maxColumn,
                    endLineNumber: startLineNumber,
                    endColumn: maxColumn
                };
                newEditorDecorations.push({ range: decorationRange, options: this._decorationProvider.getDecorationOption(isCollapsed) });
            };
            let i = 0;
            let nextCollapsed = () => {
                while (i < this._regions.length) {
                    let isCollapsed = this._regions.isCollapsed(i);
                    i++;
                    if (isCollapsed) {
                        return i - 1;
                    }
                }
                return -1;
            };
            let k = 0;
            let collapsedIndex = nextCollapsed();
            while (collapsedIndex !== -1 && k < newRegions.length) {
                // get the latest range
                let decRange = this._textModel.getDecorationRange(this._editorDecorationIds[collapsedIndex]);
                if (decRange) {
                    let collapsedStartLineNumber = decRange.startLineNumber;
                    if (this._textModel.getLineMaxColumn(collapsedStartLineNumber) === decRange.startColumn) { // test that the decoration is still at the end otherwise it got deleted
                        while (k < newRegions.length) {
                            let startLineNumber = newRegions.getStartLineNumber(k);
                            if (collapsedStartLineNumber >= startLineNumber) {
                                initRange(k, collapsedStartLineNumber === startLineNumber);
                                k++;
                            }
                            else {
                                break;
                            }
                        }
                    }
                }
                collapsedIndex = nextCollapsed();
            }
            while (k < newRegions.length) {
                initRange(k, false);
                k++;
            }
            this._editorDecorationIds = this._decorationProvider.deltaDecorations(this._editorDecorationIds, newEditorDecorations);
            this._regions = newRegions;
            this._isInitialized = true;
            this._updateEventEmitter.fire({ model: this });
        }
        /**
         * Collapse state memento, for persistence only
         */
        getMemento() {
            let collapsedRanges = [];
            for (let i = 0; i < this._regions.length; i++) {
                if (this._regions.isCollapsed(i)) {
                    let range = this._textModel.getDecorationRange(this._editorDecorationIds[i]);
                    if (range) {
                        let startLineNumber = range.startLineNumber;
                        let endLineNumber = range.endLineNumber + this._regions.getEndLineNumber(i) - this._regions.getStartLineNumber(i);
                        collapsedRanges.push({ startLineNumber, endLineNumber });
                    }
                }
            }
            if (collapsedRanges.length > 0) {
                return collapsedRanges;
            }
            return undefined;
        }
        /**
         * Apply persisted state, for persistence only
         */
        applyMemento(state) {
            if (!Array.isArray(state)) {
                return;
            }
            let toToogle = [];
            for (let range of state) {
                let region = this.getRegionAtLine(range.startLineNumber);
                if (region && !region.isCollapsed) {
                    toToogle.push(region);
                }
            }
            this.toggleCollapseState(toToogle);
        }
        dispose() {
            this._decorationProvider.deltaDecorations(this._editorDecorationIds, []);
        }
        getAllRegionsAtLine(lineNumber, filter) {
            let result = [];
            if (this._regions) {
                let index = this._regions.findRange(lineNumber);
                let level = 1;
                while (index >= 0) {
                    let current = this._regions.toRegion(index);
                    if (!filter || filter(current, level)) {
                        result.push(current);
                    }
                    level++;
                    index = current.parentIndex;
                }
            }
            return result;
        }
        getRegionAtLine(lineNumber) {
            if (this._regions) {
                let index = this._regions.findRange(lineNumber);
                if (index >= 0) {
                    return this._regions.toRegion(index);
                }
            }
            return null;
        }
        getRegionsInside(region, filter) {
            let result = [];
            let index = region ? region.regionIndex + 1 : 0;
            let endLineNumber = region ? region.endLineNumber : Number.MAX_VALUE;
            if (filter && filter.length === 2) {
                const levelStack = [];
                for (let i = index, len = this._regions.length; i < len; i++) {
                    let current = this._regions.toRegion(i);
                    if (this._regions.getStartLineNumber(i) < endLineNumber) {
                        while (levelStack.length > 0 && !current.containedBy(levelStack[levelStack.length - 1])) {
                            levelStack.pop();
                        }
                        levelStack.push(current);
                        if (filter(current, levelStack.length)) {
                            result.push(current);
                        }
                    }
                    else {
                        break;
                    }
                }
            }
            else {
                for (let i = index, len = this._regions.length; i < len; i++) {
                    let current = this._regions.toRegion(i);
                    if (this._regions.getStartLineNumber(i) < endLineNumber) {
                        if (!filter || filter(current)) {
                            result.push(current);
                        }
                    }
                    else {
                        break;
                    }
                }
            }
            return result;
        }
    }
    exports.FoldingModel = FoldingModel;
    /**
     * Collapse or expand the regions at the given locations
     * @param levels The number of levels. Use 1 to only impact the regions at the location, use Number.MAX_VALUE for all levels.
     * @param lineNumbers the location of the regions to collapse or expand, or if not set, all regions in the model.
     */
    function toggleCollapseState(foldingModel, levels, lineNumbers) {
        let toToggle = [];
        for (let lineNumber of lineNumbers) {
            let region = foldingModel.getRegionAtLine(lineNumber);
            if (region) {
                const doCollapse = !region.isCollapsed;
                toToggle.push(region);
                if (levels > 1) {
                    let regionsInside = foldingModel.getRegionsInside(region, (r, level) => r.isCollapsed !== doCollapse && level < levels);
                    toToggle.push(...regionsInside);
                }
            }
        }
        foldingModel.toggleCollapseState(toToggle);
    }
    exports.toggleCollapseState = toggleCollapseState;
    /**
     * Collapse or expand the regions at the given locations including all children.
     * @param doCollapse Wheter to collase or expand
     * @param levels The number of levels. Use 1 to only impact the regions at the location, use Number.MAX_VALUE for all levels.
     * @param lineNumbers the location of the regions to collapse or expand, or if not set, all regions in the model.
     */
    function setCollapseStateLevelsDown(foldingModel, doCollapse, levels = Number.MAX_VALUE, lineNumbers) {
        let toToggle = [];
        if (lineNumbers && lineNumbers.length > 0) {
            for (let lineNumber of lineNumbers) {
                let region = foldingModel.getRegionAtLine(lineNumber);
                if (region) {
                    if (region.isCollapsed !== doCollapse) {
                        toToggle.push(region);
                    }
                    if (levels > 1) {
                        let regionsInside = foldingModel.getRegionsInside(region, (r, level) => r.isCollapsed !== doCollapse && level < levels);
                        toToggle.push(...regionsInside);
                    }
                }
            }
        }
        else {
            let regionsInside = foldingModel.getRegionsInside(null, (r, level) => r.isCollapsed !== doCollapse && level < levels);
            toToggle.push(...regionsInside);
        }
        foldingModel.toggleCollapseState(toToggle);
    }
    exports.setCollapseStateLevelsDown = setCollapseStateLevelsDown;
    /**
     * Collapse or expand the regions at the given locations including all parents.
     * @param doCollapse Wheter to collase or expand
     * @param levels The number of levels. Use 1 to only impact the regions at the location, use Number.MAX_VALUE for all levels.
     * @param lineNumbers the location of the regions to collapse or expand, or if not set, all regions in the model.
     */
    function setCollapseStateLevelsUp(foldingModel, doCollapse, levels, lineNumbers) {
        let toToggle = [];
        for (let lineNumber of lineNumbers) {
            let regions = foldingModel.getAllRegionsAtLine(lineNumber, (region, level) => region.isCollapsed !== doCollapse && level <= levels);
            toToggle.push(...regions);
        }
        foldingModel.toggleCollapseState(toToggle);
    }
    exports.setCollapseStateLevelsUp = setCollapseStateLevelsUp;
    /**
     * Folds or unfolds all regions that have a given level, except if they contain one of the blocked lines.
     * @param foldLevel level. Level == 1 is the top level
     * @param doCollapse Wheter to collase or expand
    */
    function setCollapseStateAtLevel(foldingModel, foldLevel, doCollapse, blockedLineNumbers) {
        let filter = (region, level) => level === foldLevel && region.isCollapsed !== doCollapse && !blockedLineNumbers.some(line => region.containsLine(line));
        let toToggle = foldingModel.getRegionsInside(null, filter);
        foldingModel.toggleCollapseState(toToggle);
    }
    exports.setCollapseStateAtLevel = setCollapseStateAtLevel;
    /**
     * Folds all regions for which the lines start with a given regex
     * @param foldingModel the folding model
     */
    function setCollapseStateForMatchingLines(foldingModel, regExp, doCollapse) {
        let editorModel = foldingModel.textModel;
        let regions = foldingModel.regions;
        let toToggle = [];
        for (let i = regions.length - 1; i >= 0; i--) {
            if (doCollapse !== regions.isCollapsed(i)) {
                let startLineNumber = regions.getStartLineNumber(i);
                if (regExp.test(editorModel.getLineContent(startLineNumber))) {
                    toToggle.push(regions.toRegion(i));
                }
            }
        }
        foldingModel.toggleCollapseState(toToggle);
    }
    exports.setCollapseStateForMatchingLines = setCollapseStateForMatchingLines;
    /**
     * Folds all regions of the given type
     * @param foldingModel the folding model
     */
    function setCollapseStateForType(foldingModel, type, doCollapse) {
        let regions = foldingModel.regions;
        let toToggle = [];
        for (let i = regions.length - 1; i >= 0; i--) {
            if (doCollapse !== regions.isCollapsed(i) && type === regions.getType(i)) {
                toToggle.push(regions.toRegion(i));
            }
        }
        foldingModel.toggleCollapseState(toToggle);
    }
    exports.setCollapseStateForType = setCollapseStateForType;
});
//# sourceMappingURL=foldingModel.js.map