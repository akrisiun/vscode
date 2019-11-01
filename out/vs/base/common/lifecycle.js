/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/functional"], function (require, exports, functional_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Enables logging of potentially leaked disposables.
     *
     * A disposable is considered leaked if it is not disposed or not registered as the child of
     * another disposable. This tracking is very simple an only works for classes that either
     * extend Disposable or use a DisposableStore. This means there are a lot of false positives.
     */
    const TRACK_DISPOSABLES = false;
    const __is_disposable_tracked__ = '__is_disposable_tracked__';
    function markTracked(x) {
        if (!TRACK_DISPOSABLES) {
            return;
        }
        if (x && x !== Disposable.None) {
            try {
                x[__is_disposable_tracked__] = true;
            }
            catch (_a) {
                // noop
            }
        }
    }
    function trackDisposable(x) {
        if (!TRACK_DISPOSABLES) {
            return x;
        }
        const stack = new Error('Potentially leaked disposable').stack;
        setTimeout(() => {
            if (!x[__is_disposable_tracked__]) {
                console.log(stack);
            }
        }, 3000);
        return x;
    }
    function isDisposable(thing) {
        return typeof thing.dispose === 'function'
            && thing.dispose.length === 0;
    }
    exports.isDisposable = isDisposable;
    function dispose(disposables) {
        if (Array.isArray(disposables)) {
            disposables.forEach(d => {
                if (d) {
                    markTracked(d);
                    d.dispose();
                }
            });
            return [];
        }
        else if (disposables) {
            markTracked(disposables);
            disposables.dispose();
            return disposables;
        }
        else {
            return undefined;
        }
    }
    exports.dispose = dispose;
    function combinedDisposable(...disposables) {
        disposables.forEach(markTracked);
        return trackDisposable({ dispose: () => dispose(disposables) });
    }
    exports.combinedDisposable = combinedDisposable;
    function toDisposable(fn) {
        const self = trackDisposable({
            dispose: () => {
                markTracked(self);
                fn();
            }
        });
        return self;
    }
    exports.toDisposable = toDisposable;
    class DisposableStore {
        constructor() {
            this._toDispose = new Set();
            this._isDisposed = false;
        }
        /**
         * Dispose of all registered disposables and mark this object as disposed.
         *
         * Any future disposables added to this object will be disposed of on `add`.
         */
        dispose() {
            if (this._isDisposed) {
                return;
            }
            markTracked(this);
            this._isDisposed = true;
            this.clear();
        }
        /**
         * Dispose of all registered disposables but do not mark this object as disposed.
         */
        clear() {
            this._toDispose.forEach(item => item.dispose());
            this._toDispose.clear();
        }
        add(t) {
            if (!t) {
                return t;
            }
            if (t === this) {
                throw new Error('Cannot register a disposable on itself!');
            }
            markTracked(t);
            if (this._isDisposed) {
                console.warn(new Error('Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!').stack);
            }
            else {
                this._toDispose.add(t);
            }
            return t;
        }
    }
    exports.DisposableStore = DisposableStore;
    class Disposable {
        constructor() {
            this._store = new DisposableStore();
            trackDisposable(this);
        }
        dispose() {
            markTracked(this);
            this._store.dispose();
        }
        _register(t) {
            if (t === this) {
                throw new Error('Cannot register a disposable on itself!');
            }
            return this._store.add(t);
        }
    }
    exports.Disposable = Disposable;
    Disposable.None = Object.freeze({ dispose() { } });
    /**
     * Manages the lifecycle of a disposable value that may be changed.
     *
     * This ensures that when the the disposable value is changed, the previously held disposable is disposed of. You can
     * also register a `MutableDisposable` on a `Disposable` to ensure it is automatically cleaned up.
     */
    class MutableDisposable {
        constructor() {
            this._isDisposed = false;
            trackDisposable(this);
        }
        get value() {
            return this._isDisposed ? undefined : this._value;
        }
        set value(value) {
            if (this._isDisposed || value === this._value) {
                return;
            }
            if (this._value) {
                this._value.dispose();
            }
            if (value) {
                markTracked(value);
            }
            this._value = value;
        }
        clear() {
            this.value = undefined;
        }
        dispose() {
            this._isDisposed = true;
            markTracked(this);
            if (this._value) {
                this._value.dispose();
            }
            this._value = undefined;
        }
    }
    exports.MutableDisposable = MutableDisposable;
    /**
     * Wrapper class that stores a disposable that is not currently "owned" by anyone.
     *
     * Example use cases:
     *
     * - Express that a function/method will take ownership of a disposable parameter.
     * - Express that a function returns a disposable that the caller must explicitly take ownership of.
     */
    class UnownedDisposable extends Disposable {
        constructor(value) {
            super();
            this._hasBeenAcquired = false;
            this._value = value;
        }
        acquire() {
            if (this._hasBeenAcquired) {
                throw new Error('This disposable has already been acquired');
            }
            this._hasBeenAcquired = true;
            const value = this._value;
            this._value = undefined;
            return value;
        }
        dispose() {
            super.dispose();
            if (!this._hasBeenAcquired) {
                this._hasBeenAcquired = true;
                this._value.dispose();
                this._value = undefined;
            }
        }
    }
    exports.UnownedDisposable = UnownedDisposable;
    class ReferenceCollection {
        constructor() {
            this.references = new Map();
        }
        acquire(key) {
            let reference = this.references.get(key);
            if (!reference) {
                reference = { counter: 0, object: this.createReferencedObject(key) };
                this.references.set(key, reference);
            }
            const { object } = reference;
            const dispose = functional_1.once(() => {
                if (--reference.counter === 0) {
                    this.destroyReferencedObject(key, reference.object);
                    this.references.delete(key);
                }
            });
            reference.counter++;
            return { object, dispose };
        }
    }
    exports.ReferenceCollection = ReferenceCollection;
    class ImmortalReference {
        constructor(object) {
            this.object = object;
        }
        dispose() { }
    }
    exports.ImmortalReference = ImmortalReference;
});
//# sourceMappingURL=lifecycle.js.map