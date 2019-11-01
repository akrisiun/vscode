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
define(["require", "exports", "vs/base/common/map", "vs/platform/storage/common/storage", "vs/editor/common/modes", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions"], function (require, exports, map_1, storage_1, modes_1, lifecycle_1, async_1, instantiation_1, configuration_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Memory {
        select(model, pos, items) {
            if (items.length === 0) {
                return 0;
            }
            let topScore = items[0].score[0];
            for (let i = 1; i < items.length; i++) {
                const { score, completion: suggestion } = items[i];
                if (score[0] !== topScore) {
                    // stop when leaving the group of top matches
                    break;
                }
                if (suggestion.preselect) {
                    // stop when seeing an auto-select-item
                    return i;
                }
            }
            return 0;
        }
    }
    exports.Memory = Memory;
    class NoMemory extends Memory {
        memorize(model, pos, item) {
            // no-op
        }
        toJSON() {
            return undefined;
        }
        fromJSON() {
            //
        }
    }
    exports.NoMemory = NoMemory;
    class LRUMemory extends Memory {
        constructor() {
            super(...arguments);
            this._cache = new map_1.LRUCache(300, 0.66);
            this._seq = 0;
        }
        memorize(model, pos, item) {
            const { label } = item.completion;
            const key = `${model.getLanguageIdentifier().language}/${label}`;
            this._cache.set(key, {
                touch: this._seq++,
                type: item.completion.kind,
                insertText: item.completion.insertText
            });
        }
        select(model, pos, items) {
            if (items.length === 0) {
                return 0;
            }
            const lineSuffix = model.getLineContent(pos.lineNumber).substr(pos.column - 10, pos.column - 1);
            if (/\s$/.test(lineSuffix)) {
                return super.select(model, pos, items);
            }
            let topScore = items[0].score[0];
            let indexPreselect = -1;
            let indexRecency = -1;
            let seq = -1;
            for (let i = 0; i < items.length; i++) {
                if (items[i].score[0] !== topScore) {
                    // consider only top items
                    break;
                }
                const key = `${model.getLanguageIdentifier().language}/${items[i].completion.label}`;
                const item = this._cache.peek(key);
                if (item && item.touch > seq && item.type === items[i].completion.kind && item.insertText === items[i].completion.insertText) {
                    seq = item.touch;
                    indexRecency = i;
                }
                if (items[i].completion.preselect && indexPreselect === -1) {
                    // stop when seeing an auto-select-item
                    return indexPreselect = i;
                }
            }
            if (indexRecency !== -1) {
                return indexRecency;
            }
            else if (indexPreselect !== -1) {
                return indexPreselect;
            }
            else {
                return 0;
            }
        }
        toJSON() {
            let data = [];
            this._cache.forEach((value, key) => {
                data.push([key, value]);
            });
            return data;
        }
        fromJSON(data) {
            this._cache.clear();
            let seq = 0;
            for (const [key, value] of data) {
                value.touch = seq;
                value.type = typeof value.type === 'number' ? value.type : modes_1.completionKindFromString(value.type);
                this._cache.set(key, value);
            }
            this._seq = this._cache.size;
        }
    }
    exports.LRUMemory = LRUMemory;
    class PrefixMemory extends Memory {
        constructor() {
            super(...arguments);
            this._trie = map_1.TernarySearchTree.forStrings();
            this._seq = 0;
        }
        memorize(model, pos, item) {
            const { word } = model.getWordUntilPosition(pos);
            const key = `${model.getLanguageIdentifier().language}/${word}`;
            this._trie.set(key, {
                type: item.completion.kind,
                insertText: item.completion.insertText,
                touch: this._seq++
            });
        }
        select(model, pos, items) {
            let { word } = model.getWordUntilPosition(pos);
            if (!word) {
                return super.select(model, pos, items);
            }
            let key = `${model.getLanguageIdentifier().language}/${word}`;
            let item = this._trie.get(key);
            if (!item) {
                item = this._trie.findSubstr(key);
            }
            if (item) {
                for (let i = 0; i < items.length; i++) {
                    let { kind, insertText } = items[i].completion;
                    if (kind === item.type && insertText === item.insertText) {
                        return i;
                    }
                }
            }
            return super.select(model, pos, items);
        }
        toJSON() {
            let entries = [];
            this._trie.forEach((value, key) => entries.push([key, value]));
            // sort by last recently used (touch), then
            // take the top 200 item and normalize their
            // touch
            entries
                .sort((a, b) => -(a[1].touch - b[1].touch))
                .forEach((value, i) => value[1].touch = i);
            return entries.slice(0, 200);
        }
        fromJSON(data) {
            this._trie.clear();
            if (data.length > 0) {
                this._seq = data[0][1].touch + 1;
                for (const [key, value] of data) {
                    value.type = typeof value.type === 'number' ? value.type : modes_1.completionKindFromString(value.type);
                    this._trie.set(key, value);
                }
            }
        }
    }
    exports.PrefixMemory = PrefixMemory;
    let SuggestMemoryService = class SuggestMemoryService extends lifecycle_1.Disposable {
        constructor(_storageService, _configService) {
            super();
            this._storageService = _storageService;
            this._configService = _configService;
            this._storagePrefix = 'suggest/memories';
            const update = () => {
                const mode = this._configService.getValue('editor.suggestSelection');
                const share = this._configService.getValue('editor.suggest.shareSuggestSelections');
                this._update(mode, share, false);
            };
            this._persistSoon = this._register(new async_1.RunOnceScheduler(() => this._saveState(), 500));
            this._register(_storageService.onWillSaveState(e => {
                if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    this._saveState();
                }
            }));
            this._register(this._configService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.suggestSelection') || e.affectsConfiguration('editor.suggest.shareSuggestSelections')) {
                    update();
                }
            }));
            this._register(this._storageService.onDidChangeStorage(e => {
                if (e.scope === 0 /* GLOBAL */ && e.key.indexOf(this._storagePrefix) === 0) {
                    if (!document.hasFocus()) {
                        // windows that aren't focused have to drop their current
                        // storage value and accept what's stored now
                        this._update(this._mode, this._shareMem, true);
                    }
                }
            }));
            update();
        }
        _update(mode, shareMem, force) {
            if (!force && this._mode === mode && this._shareMem === shareMem) {
                return;
            }
            this._shareMem = shareMem;
            this._mode = mode;
            this._strategy = mode === 'recentlyUsedByPrefix' ? new PrefixMemory() : mode === 'recentlyUsed' ? new LRUMemory() : new NoMemory();
            try {
                const scope = shareMem ? 0 /* GLOBAL */ : 1 /* WORKSPACE */;
                const raw = this._storageService.get(`${this._storagePrefix}/${this._mode}`, scope);
                if (raw) {
                    this._strategy.fromJSON(JSON.parse(raw));
                }
            }
            catch (e) {
                // things can go wrong with JSON...
            }
        }
        memorize(model, pos, item) {
            this._strategy.memorize(model, pos, item);
            this._persistSoon.schedule();
        }
        select(model, pos, items) {
            return this._strategy.select(model, pos, items);
        }
        _saveState() {
            const raw = JSON.stringify(this._strategy);
            const scope = this._shareMem ? 0 /* GLOBAL */ : 1 /* WORKSPACE */;
            this._storageService.store(`${this._storagePrefix}/${this._mode}`, raw, scope);
        }
    };
    SuggestMemoryService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, configuration_1.IConfigurationService)
    ], SuggestMemoryService);
    exports.SuggestMemoryService = SuggestMemoryService;
    exports.ISuggestMemoryService = instantiation_1.createDecorator('ISuggestMemories');
    extensions_1.registerSingleton(exports.ISuggestMemoryService, SuggestMemoryService, true);
});
//# sourceMappingURL=suggestMemory.js.map