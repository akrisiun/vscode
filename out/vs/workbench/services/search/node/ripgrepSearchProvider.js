/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/workbench/services/search/node/ripgrepTextSearchEngine"], function (require, exports, cancellation_1, ripgrepTextSearchEngine_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RipgrepSearchProvider {
        constructor(outputChannel) {
            this.outputChannel = outputChannel;
            this.inProgress = new Set();
            process.once('exit', () => this.dispose());
        }
        provideTextSearchResults(query, options, progress, token) {
            const engine = new ripgrepTextSearchEngine_1.RipgrepTextSearchEngine(this.outputChannel);
            return this.withToken(token, token => engine.provideTextSearchResults(query, options, progress, token));
        }
        async withToken(token, fn) {
            const merged = mergedTokenSource(token);
            this.inProgress.add(merged);
            const result = await fn(merged.token);
            this.inProgress.delete(merged);
            return result;
        }
        dispose() {
            this.inProgress.forEach(engine => engine.cancel());
        }
    }
    exports.RipgrepSearchProvider = RipgrepSearchProvider;
    function mergedTokenSource(token) {
        const tokenSource = new cancellation_1.CancellationTokenSource();
        token.onCancellationRequested(() => tokenSource.cancel());
        return tokenSource;
    }
});
//# sourceMappingURL=ripgrepSearchProvider.js.map