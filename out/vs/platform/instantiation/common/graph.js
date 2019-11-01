/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/base/common/collections"], function (require, exports, types_1, collections_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function newNode(data) {
        return {
            data: data,
            incoming: Object.create(null),
            outgoing: Object.create(null)
        };
    }
    class Graph {
        constructor(_hashFn) {
            this._hashFn = _hashFn;
            this._nodes = Object.create(null);
            // empty
        }
        roots() {
            const ret = [];
            collections_1.forEach(this._nodes, entry => {
                if (types_1.isEmptyObject(entry.value.outgoing)) {
                    ret.push(entry.value);
                }
            });
            return ret;
        }
        insertEdge(from, to) {
            const fromNode = this.lookupOrInsertNode(from), toNode = this.lookupOrInsertNode(to);
            fromNode.outgoing[this._hashFn(to)] = toNode;
            toNode.incoming[this._hashFn(from)] = fromNode;
        }
        removeNode(data) {
            const key = this._hashFn(data);
            delete this._nodes[key];
            collections_1.forEach(this._nodes, (entry) => {
                delete entry.value.outgoing[key];
                delete entry.value.incoming[key];
            });
        }
        lookupOrInsertNode(data) {
            const key = this._hashFn(data);
            let node = this._nodes[key];
            if (!node) {
                node = newNode(data);
                this._nodes[key] = node;
            }
            return node;
        }
        lookup(data) {
            return this._nodes[this._hashFn(data)];
        }
        isEmpty() {
            for (const _key in this._nodes) {
                return false;
            }
            return true;
        }
        toString() {
            let data = [];
            collections_1.forEach(this._nodes, entry => {
                data.push(`${entry.key}, (incoming)[${Object.keys(entry.value.incoming).join(', ')}], (outgoing)[${Object.keys(entry.value.outgoing).join(',')}]`);
            });
            return data.join('\n');
        }
    }
    exports.Graph = Graph;
});
//# sourceMappingURL=graph.js.map