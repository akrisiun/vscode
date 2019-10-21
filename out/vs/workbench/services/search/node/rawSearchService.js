/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "graceful-fs", "vs/base/common/path", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/stopwatch", "vs/base/common/strings", "vs/base/common/uri", "vs/base/parts/quickopen/common/quickOpenScorer", "vs/base/node/pfs", "vs/workbench/services/search/node/fileSearch", "vs/workbench/services/search/node/textSearchAdapter"], function (require, exports, fs, gracefulFs, path_1, arrays, async_1, errors_1, event_1, objects, stopwatch_1, strings, uri_1, quickOpenScorer_1, pfs_1, fileSearch_1, textSearchAdapter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    gracefulFs.gracefulify(fs);
    class SearchService {
        constructor() {
            this.caches = Object.create(null);
        }
        fileSearch(config) {
            let promise;
            const query = reviveQuery(config);
            const emitter = new event_1.Emitter({
                onFirstListenerDidAdd: () => {
                    promise = async_1.createCancelablePromise(token => {
                        return this.doFileSearchWithEngine(fileSearch_1.Engine, query, p => emitter.fire(p), token);
                    });
                    promise.then(c => emitter.fire(c), err => emitter.fire({ type: 'error', error: { message: err.message, stack: err.stack } }));
                },
                onLastListenerRemove: () => {
                    promise.cancel();
                }
            });
            return emitter.event;
        }
        textSearch(rawQuery) {
            let promise;
            const query = reviveQuery(rawQuery);
            const emitter = new event_1.Emitter({
                onFirstListenerDidAdd: () => {
                    promise = async_1.createCancelablePromise(token => {
                        return this.ripgrepTextSearch(query, p => emitter.fire(p), token);
                    });
                    promise.then(c => emitter.fire(c), err => emitter.fire({ type: 'error', error: { message: err.message, stack: err.stack } }));
                },
                onLastListenerRemove: () => {
                    promise.cancel();
                }
            });
            return emitter.event;
        }
        ripgrepTextSearch(config, progressCallback, token) {
            config.maxFileSize = pfs_1.MAX_FILE_SIZE;
            const engine = new textSearchAdapter_1.TextSearchEngineAdapter(config);
            return engine.search(token, progressCallback, progressCallback);
        }
        doFileSearch(config, progressCallback, token) {
            return this.doFileSearchWithEngine(fileSearch_1.Engine, config, progressCallback, token);
        }
        doFileSearchWithEngine(EngineClass, config, progressCallback, token, batchSize = SearchService.BATCH_SIZE) {
            let resultCount = 0;
            const fileProgressCallback = progress => {
                if (Array.isArray(progress)) {
                    resultCount += progress.length;
                    progressCallback(progress.map(m => this.rawMatchToSearchItem(m)));
                }
                else if (progress.relativePath) {
                    resultCount++;
                    progressCallback(this.rawMatchToSearchItem(progress));
                }
                else {
                    progressCallback(progress);
                }
            };
            if (config.sortByScore) {
                let sortedSearch = this.trySortedSearchFromCache(config, fileProgressCallback, token);
                if (!sortedSearch) {
                    const walkerConfig = config.maxResults ? objects.assign({}, config, { maxResults: null }) : config;
                    const engine = new EngineClass(walkerConfig);
                    sortedSearch = this.doSortedSearch(engine, config, progressCallback, fileProgressCallback, token);
                }
                return new Promise((c, e) => {
                    sortedSearch.then(([result, rawMatches]) => {
                        const serializedMatches = rawMatches.map(rawMatch => this.rawMatchToSearchItem(rawMatch));
                        this.sendProgress(serializedMatches, progressCallback, batchSize);
                        c(result);
                    }, e);
                });
            }
            const engine = new EngineClass(config);
            return this.doSearch(engine, fileProgressCallback, batchSize, token).then(complete => {
                return {
                    limitHit: complete.limitHit,
                    type: 'success',
                    stats: {
                        detailStats: complete.stats,
                        type: 'searchProcess',
                        fromCache: false,
                        resultCount,
                        sortingTime: undefined
                    }
                };
            });
        }
        rawMatchToSearchItem(match) {
            return { path: match.base ? path_1.join(match.base, match.relativePath) : match.relativePath };
        }
        doSortedSearch(engine, config, progressCallback, fileProgressCallback, token) {
            const emitter = new event_1.Emitter();
            let allResultsPromise = async_1.createCancelablePromise(token => {
                let results = [];
                const innerProgressCallback = progress => {
                    if (Array.isArray(progress)) {
                        results = progress;
                    }
                    else {
                        fileProgressCallback(progress);
                        emitter.fire(progress);
                    }
                };
                return this.doSearch(engine, innerProgressCallback, -1, token)
                    .then(result => {
                    return [result, results];
                });
            });
            let cache;
            if (config.cacheKey) {
                cache = this.getOrCreateCache(config.cacheKey);
                const cacheRow = {
                    promise: allResultsPromise,
                    event: emitter.event,
                    resolved: false
                };
                cache.resultsToSearchCache[config.filePattern || ''] = cacheRow;
                allResultsPromise.then(() => {
                    cacheRow.resolved = true;
                }, err => {
                    delete cache.resultsToSearchCache[config.filePattern || ''];
                });
                allResultsPromise = this.preventCancellation(allResultsPromise);
            }
            return allResultsPromise.then(([result, results]) => {
                const scorerCache = cache ? cache.scorerCache : Object.create(null);
                const sortSW = (typeof config.maxResults !== 'number' || config.maxResults > 0) && stopwatch_1.StopWatch.create(false);
                return this.sortResults(config, results, scorerCache, token)
                    .then(sortedResults => {
                    // sortingTime: -1 indicates a "sorted" search that was not sorted, i.e. populating the cache when quickopen is opened.
                    // Contrasting with findFiles which is not sorted and will have sortingTime: undefined
                    const sortingTime = sortSW ? sortSW.elapsed() : -1;
                    return [{
                            type: 'success',
                            stats: {
                                detailStats: result.stats,
                                sortingTime,
                                fromCache: false,
                                type: 'searchProcess',
                                workspaceFolderCount: config.folderQueries.length,
                                resultCount: sortedResults.length
                            },
                            limitHit: result.limitHit || typeof config.maxResults === 'number' && results.length > config.maxResults
                        }, sortedResults];
                });
            });
        }
        getOrCreateCache(cacheKey) {
            const existing = this.caches[cacheKey];
            if (existing) {
                return existing;
            }
            return this.caches[cacheKey] = new Cache();
        }
        trySortedSearchFromCache(config, progressCallback, token) {
            const cache = config.cacheKey && this.caches[config.cacheKey];
            if (!cache) {
                return undefined;
            }
            const cached = this.getResultsFromCache(cache, config.filePattern || '', progressCallback, token);
            if (cached) {
                return cached.then(([result, results, cacheStats]) => {
                    const sortSW = stopwatch_1.StopWatch.create(false);
                    return this.sortResults(config, results, cache.scorerCache, token)
                        .then(sortedResults => {
                        const sortingTime = sortSW.elapsed();
                        const stats = {
                            fromCache: true,
                            detailStats: cacheStats,
                            type: 'searchProcess',
                            resultCount: results.length,
                            sortingTime
                        };
                        return [
                            {
                                type: 'success',
                                limitHit: result.limitHit || typeof config.maxResults === 'number' && results.length > config.maxResults,
                                stats
                            },
                            sortedResults
                        ];
                    });
                });
            }
            return undefined;
        }
        sortResults(config, results, scorerCache, token) {
            // we use the same compare function that is used later when showing the results using fuzzy scoring
            // this is very important because we are also limiting the number of results by config.maxResults
            // and as such we want the top items to be included in this result set if the number of items
            // exceeds config.maxResults.
            const query = quickOpenScorer_1.prepareQuery(config.filePattern || '');
            const compare = (matchA, matchB) => quickOpenScorer_1.compareItemsByScore(matchA, matchB, query, true, FileMatchItemAccessor, scorerCache);
            const maxResults = typeof config.maxResults === 'number' ? config.maxResults : Number.MAX_VALUE;
            return arrays.topAsync(results, compare, maxResults, 10000, token);
        }
        sendProgress(results, progressCb, batchSize) {
            if (batchSize && batchSize > 0) {
                for (let i = 0; i < results.length; i += batchSize) {
                    progressCb(results.slice(i, i + batchSize));
                }
            }
            else {
                progressCb(results);
            }
        }
        getResultsFromCache(cache, searchValue, progressCallback, token) {
            const cacheLookupSW = stopwatch_1.StopWatch.create(false);
            // Find cache entries by prefix of search value
            const hasPathSep = searchValue.indexOf(path_1.sep) >= 0;
            let cachedRow;
            for (const previousSearch in cache.resultsToSearchCache) {
                // If we narrow down, we might be able to reuse the cached results
                if (strings.startsWith(searchValue, previousSearch)) {
                    if (hasPathSep && previousSearch.indexOf(path_1.sep) < 0) {
                        continue; // since a path character widens the search for potential more matches, require it in previous search too
                    }
                    const row = cache.resultsToSearchCache[previousSearch];
                    cachedRow = {
                        promise: this.preventCancellation(row.promise),
                        event: row.event,
                        resolved: row.resolved
                    };
                    break;
                }
            }
            if (!cachedRow) {
                return null;
            }
            const cacheLookupTime = cacheLookupSW.elapsed();
            const cacheFilterSW = stopwatch_1.StopWatch.create(false);
            const listener = cachedRow.event(progressCallback);
            if (token) {
                token.onCancellationRequested(() => {
                    listener.dispose();
                });
            }
            return cachedRow.promise.then(([complete, cachedEntries]) => {
                if (token && token.isCancellationRequested) {
                    throw errors_1.canceled();
                }
                // Pattern match on results
                const results = [];
                const normalizedSearchValueLowercase = quickOpenScorer_1.prepareQuery(searchValue).lowercase;
                for (const entry of cachedEntries) {
                    // Check if this entry is a match for the search value
                    if (!strings.fuzzyContains(entry.relativePath, normalizedSearchValueLowercase)) {
                        continue;
                    }
                    results.push(entry);
                }
                return [complete, results, {
                        cacheWasResolved: cachedRow.resolved,
                        cacheLookupTime,
                        cacheFilterTime: cacheFilterSW.elapsed(),
                        cacheEntryCount: cachedEntries.length
                    }];
            });
        }
        doSearch(engine, progressCallback, batchSize, token) {
            return new Promise((c, e) => {
                let batch = [];
                if (token) {
                    token.onCancellationRequested(() => engine.cancel());
                }
                engine.search((match) => {
                    if (match) {
                        if (batchSize) {
                            batch.push(match);
                            if (batchSize > 0 && batch.length >= batchSize) {
                                progressCallback(batch);
                                batch = [];
                            }
                        }
                        else {
                            progressCallback(match);
                        }
                    }
                }, (progress) => {
                    progressCallback(progress);
                }, (error, complete) => {
                    if (batch.length) {
                        progressCallback(batch);
                    }
                    if (error) {
                        e(error);
                    }
                    else {
                        c(complete);
                    }
                });
            });
        }
        clearCache(cacheKey) {
            delete this.caches[cacheKey];
            return Promise.resolve(undefined);
        }
        /**
         * Return a CancelablePromise which is not actually cancelable
         * TODO@rob - Is this really needed?
         */
        preventCancellation(promise) {
            return new class {
                cancel() {
                    // Do nothing
                }
                then(resolve, reject) {
                    return promise.then(resolve, reject);
                }
                catch(reject) {
                    return this.then(undefined, reject);
                }
                finally(onFinally) {
                    return promise.finally(onFinally);
                }
            };
        }
    }
    exports.SearchService = SearchService;
    SearchService.BATCH_SIZE = 512;
    class Cache {
        constructor() {
            this.resultsToSearchCache = Object.create(null);
            this.scorerCache = Object.create(null);
        }
    }
    const FileMatchItemAccessor = new class {
        getItemLabel(match) {
            return match.basename; // e.g. myFile.txt
        }
        getItemDescription(match) {
            return match.relativePath.substr(0, match.relativePath.length - match.basename.length - 1); // e.g. some/path/to/file
        }
        getItemPath(match) {
            return match.relativePath; // e.g. some/path/to/file/myFile.txt
        }
    };
    function reviveQuery(rawQuery) {
        return Object.assign(Object.assign({}, rawQuery), {
            folderQueries: rawQuery.folderQueries && rawQuery.folderQueries.map(reviveFolderQuery),
            extraFileResources: rawQuery.extraFileResources && rawQuery.extraFileResources.map(components => uri_1.URI.revive(components))
        });
    }
    function reviveFolderQuery(rawFolderQuery) {
        return Object.assign(Object.assign({}, rawFolderQuery), { folder: uri_1.URI.revive(rawFolderQuery.folder) });
    }
});
//# sourceMappingURL=rawSearchService.js.map