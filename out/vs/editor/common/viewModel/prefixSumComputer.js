/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/uint"], function (require, exports, uint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class PrefixSumIndexOfResult {
        constructor(index, remainder) {
            this.index = index;
            this.remainder = remainder;
        }
    }
    exports.PrefixSumIndexOfResult = PrefixSumIndexOfResult;
    class PrefixSumComputer {
        constructor(values) {
            this.values = values;
            this.prefixSum = new Uint32Array(values.length);
            this.prefixSumValidIndex = new Int32Array(1);
            this.prefixSumValidIndex[0] = -1;
        }
        getCount() {
            return this.values.length;
        }
        insertValues(insertIndex, insertValues) {
            insertIndex = uint_1.toUint32(insertIndex);
            const oldValues = this.values;
            const oldPrefixSum = this.prefixSum;
            const insertValuesLen = insertValues.length;
            if (insertValuesLen === 0) {
                return false;
            }
            this.values = new Uint32Array(oldValues.length + insertValuesLen);
            this.values.set(oldValues.subarray(0, insertIndex), 0);
            this.values.set(oldValues.subarray(insertIndex), insertIndex + insertValuesLen);
            this.values.set(insertValues, insertIndex);
            if (insertIndex - 1 < this.prefixSumValidIndex[0]) {
                this.prefixSumValidIndex[0] = insertIndex - 1;
            }
            this.prefixSum = new Uint32Array(this.values.length);
            if (this.prefixSumValidIndex[0] >= 0) {
                this.prefixSum.set(oldPrefixSum.subarray(0, this.prefixSumValidIndex[0] + 1));
            }
            return true;
        }
        changeValue(index, value) {
            index = uint_1.toUint32(index);
            value = uint_1.toUint32(value);
            if (this.values[index] === value) {
                return false;
            }
            this.values[index] = value;
            if (index - 1 < this.prefixSumValidIndex[0]) {
                this.prefixSumValidIndex[0] = index - 1;
            }
            return true;
        }
        removeValues(startIndex, cnt) {
            startIndex = uint_1.toUint32(startIndex);
            cnt = uint_1.toUint32(cnt);
            const oldValues = this.values;
            const oldPrefixSum = this.prefixSum;
            if (startIndex >= oldValues.length) {
                return false;
            }
            let maxCnt = oldValues.length - startIndex;
            if (cnt >= maxCnt) {
                cnt = maxCnt;
            }
            if (cnt === 0) {
                return false;
            }
            this.values = new Uint32Array(oldValues.length - cnt);
            this.values.set(oldValues.subarray(0, startIndex), 0);
            this.values.set(oldValues.subarray(startIndex + cnt), startIndex);
            this.prefixSum = new Uint32Array(this.values.length);
            if (startIndex - 1 < this.prefixSumValidIndex[0]) {
                this.prefixSumValidIndex[0] = startIndex - 1;
            }
            if (this.prefixSumValidIndex[0] >= 0) {
                this.prefixSum.set(oldPrefixSum.subarray(0, this.prefixSumValidIndex[0] + 1));
            }
            return true;
        }
        getTotalValue() {
            if (this.values.length === 0) {
                return 0;
            }
            return this._getAccumulatedValue(this.values.length - 1);
        }
        getAccumulatedValue(index) {
            if (index < 0) {
                return 0;
            }
            index = uint_1.toUint32(index);
            return this._getAccumulatedValue(index);
        }
        _getAccumulatedValue(index) {
            if (index <= this.prefixSumValidIndex[0]) {
                return this.prefixSum[index];
            }
            let startIndex = this.prefixSumValidIndex[0] + 1;
            if (startIndex === 0) {
                this.prefixSum[0] = this.values[0];
                startIndex++;
            }
            if (index >= this.values.length) {
                index = this.values.length - 1;
            }
            for (let i = startIndex; i <= index; i++) {
                this.prefixSum[i] = this.prefixSum[i - 1] + this.values[i];
            }
            this.prefixSumValidIndex[0] = Math.max(this.prefixSumValidIndex[0], index);
            return this.prefixSum[index];
        }
        getIndexOf(accumulatedValue) {
            accumulatedValue = Math.floor(accumulatedValue); //@perf
            // Compute all sums (to get a fully valid prefixSum)
            this.getTotalValue();
            let low = 0;
            let high = this.values.length - 1;
            let mid = 0;
            let midStop = 0;
            let midStart = 0;
            while (low <= high) {
                mid = low + ((high - low) / 2) | 0;
                midStop = this.prefixSum[mid];
                midStart = midStop - this.values[mid];
                if (accumulatedValue < midStart) {
                    high = mid - 1;
                }
                else if (accumulatedValue >= midStop) {
                    low = mid + 1;
                }
                else {
                    break;
                }
            }
            return new PrefixSumIndexOfResult(mid, accumulatedValue - midStart);
        }
    }
    exports.PrefixSumComputer = PrefixSumComputer;
    class PrefixSumComputerWithCache {
        constructor(values) {
            this._cacheAccumulatedValueStart = 0;
            this._cache = null;
            this._actual = new PrefixSumComputer(values);
            this._bustCache();
        }
        _bustCache() {
            this._cacheAccumulatedValueStart = 0;
            this._cache = null;
        }
        insertValues(insertIndex, insertValues) {
            if (this._actual.insertValues(insertIndex, insertValues)) {
                this._bustCache();
            }
        }
        changeValue(index, value) {
            if (this._actual.changeValue(index, value)) {
                this._bustCache();
            }
        }
        removeValues(startIndex, cnt) {
            if (this._actual.removeValues(startIndex, cnt)) {
                this._bustCache();
            }
        }
        getTotalValue() {
            return this._actual.getTotalValue();
        }
        getAccumulatedValue(index) {
            return this._actual.getAccumulatedValue(index);
        }
        getIndexOf(accumulatedValue) {
            accumulatedValue = Math.floor(accumulatedValue); //@perf
            if (this._cache !== null) {
                let cacheIndex = accumulatedValue - this._cacheAccumulatedValueStart;
                if (cacheIndex >= 0 && cacheIndex < this._cache.length) {
                    // Cache hit!
                    return this._cache[cacheIndex];
                }
            }
            // Cache miss!
            return this._actual.getIndexOf(accumulatedValue);
        }
        /**
         * Gives a hint that a lot of requests are about to come in for these accumulated values.
         */
        warmUpCache(accumulatedValueStart, accumulatedValueEnd) {
            let newCache = [];
            for (let accumulatedValue = accumulatedValueStart; accumulatedValue <= accumulatedValueEnd; accumulatedValue++) {
                newCache[accumulatedValue - accumulatedValueStart] = this.getIndexOf(accumulatedValue);
            }
            this._cache = newCache;
            this._cacheAccumulatedValueStart = accumulatedValueStart;
        }
    }
    exports.PrefixSumComputerWithCache = PrefixSumComputerWithCache;
});
//# sourceMappingURL=prefixSumComputer.js.map