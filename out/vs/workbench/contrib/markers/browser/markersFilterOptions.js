/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/markers/browser/messages", "vs/base/common/filters", "vs/base/common/glob", "vs/base/common/strings", "vs/base/common/resources"], function (require, exports, messages_1, filters_1, glob_1, strings, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FilterOptions {
        constructor(filter = '', filesExclude = []) {
            this.filter = filter;
            this.filterErrors = false;
            this.filterWarnings = false;
            this.filterInfos = false;
            this.textFilter = '';
            filter = filter.trim();
            const filesExcludeByRoot = Array.isArray(filesExclude) ? filesExclude : [];
            const excludesExpression = Array.isArray(filesExclude) ? glob_1.getEmptyExpression() : filesExclude;
            const includeExpression = glob_1.getEmptyExpression();
            if (filter) {
                const filters = glob_1.splitGlobAware(filter, ',').map(s => s.trim()).filter(s => !!s.length);
                for (const f of filters) {
                    this.filterErrors = this.filterErrors || this.matches(f, messages_1.default.MARKERS_PANEL_FILTER_ERRORS);
                    this.filterWarnings = this.filterWarnings || this.matches(f, messages_1.default.MARKERS_PANEL_FILTER_WARNINGS);
                    this.filterInfos = this.filterInfos || this.matches(f, messages_1.default.MARKERS_PANEL_FILTER_INFOS);
                    if (strings.startsWith(f, '!')) {
                        this.setPattern(excludesExpression, strings.ltrim(f, '!'));
                    }
                    else {
                        this.setPattern(includeExpression, f);
                        this.textFilter += ` ${f}`;
                    }
                }
            }
            this.excludesMatcher = new resources_1.ResourceGlobMatcher(excludesExpression, filesExcludeByRoot);
            this.includesMatcher = new resources_1.ResourceGlobMatcher(includeExpression, []);
            this.textFilter = this.textFilter.trim();
        }
        setPattern(expression, pattern) {
            if (pattern[0] === '.') {
                pattern = '*' + pattern; // convert ".js" to "*.js"
            }
            expression[`**/${pattern}/**`] = true;
            expression[`**/${pattern}`] = true;
        }
        matches(prefix, word) {
            const result = filters_1.matchesPrefix(prefix, word);
            return !!(result && result.length > 0);
        }
    }
    exports.FilterOptions = FilterOptions;
    FilterOptions._filter = filters_1.matchesFuzzy2;
    FilterOptions._messageFilter = filters_1.matchesFuzzy;
});
//# sourceMappingURL=markersFilterOptions.js.map