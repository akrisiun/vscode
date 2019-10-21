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
define(["require", "exports", "vs/base/common/map", "vs/base/node/extpath", "vs/workbench/services/extensions/common/extensions", "vs/base/common/types", "vs/base/common/network"], function (require, exports, map_1, extpath_1, extensions_1, types_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtensionHostProfiler = class ExtensionHostProfiler {
        constructor(_port, _extensionService) {
            this._port = _port;
            this._extensionService = _extensionService;
        }
        async start() {
            const profiler = await new Promise((resolve_1, reject_1) => { require(['v8-inspect-profiler'], resolve_1, reject_1); });
            const session = await profiler.startProfiling({ port: this._port, checkForPaused: true });
            return {
                stop: async () => {
                    const profile = await session.stop();
                    const extensions = await this._extensionService.getExtensions();
                    return this.distill(profile.profile, extensions);
                }
            };
        }
        distill(profile, extensions) {
            let searchTree = map_1.TernarySearchTree.forPaths();
            for (let extension of extensions) {
                if (extension.extensionLocation.scheme === network_1.Schemas.file) {
                    searchTree.set(extpath_1.realpathSync(extension.extensionLocation.fsPath), extension);
                }
            }
            let nodes = profile.nodes;
            let idsToNodes = new Map();
            let idsToSegmentId = new Map();
            for (let node of nodes) {
                idsToNodes.set(node.id, node);
            }
            function visit(node, segmentId) {
                if (!segmentId) {
                    switch (node.callFrame.functionName) {
                        case '(root)':
                            break;
                        case '(program)':
                            segmentId = 'program';
                            break;
                        case '(garbage collector)':
                            segmentId = 'gc';
                            break;
                        default:
                            segmentId = 'self';
                            break;
                    }
                }
                else if (segmentId === 'self' && node.callFrame.url) {
                    let extension = searchTree.findSubstr(node.callFrame.url);
                    if (extension) {
                        segmentId = extension.identifier.value;
                    }
                }
                idsToSegmentId.set(node.id, segmentId);
                if (node.children) {
                    for (const child of node.children) {
                        const childNode = idsToNodes.get(child);
                        if (childNode) {
                            visit(childNode, segmentId);
                        }
                    }
                }
            }
            visit(nodes[0], null);
            const samples = profile.samples || [];
            let timeDeltas = profile.timeDeltas || [];
            let distilledDeltas = [];
            let distilledIds = [];
            let currSegmentTime = 0;
            let currSegmentId;
            for (let i = 0; i < samples.length; i++) {
                let id = samples[i];
                let segmentId = idsToSegmentId.get(id);
                if (segmentId !== currSegmentId) {
                    if (currSegmentId) {
                        distilledIds.push(currSegmentId);
                        distilledDeltas.push(currSegmentTime);
                    }
                    currSegmentId = types_1.withNullAsUndefined(segmentId);
                    currSegmentTime = 0;
                }
                currSegmentTime += timeDeltas[i];
            }
            if (currSegmentId) {
                distilledIds.push(currSegmentId);
                distilledDeltas.push(currSegmentTime);
            }
            return {
                startTime: profile.startTime,
                endTime: profile.endTime,
                deltas: distilledDeltas,
                ids: distilledIds,
                data: profile,
                getAggregatedTimes: () => {
                    let segmentsToTime = new Map();
                    for (let i = 0; i < distilledIds.length; i++) {
                        let id = distilledIds[i];
                        segmentsToTime.set(id, (segmentsToTime.get(id) || 0) + distilledDeltas[i]);
                    }
                    return segmentsToTime;
                }
            };
        }
    };
    ExtensionHostProfiler = __decorate([
        __param(1, extensions_1.IExtensionService)
    ], ExtensionHostProfiler);
    exports.ExtensionHostProfiler = ExtensionHostProfiler;
});
//# sourceMappingURL=extensionHostProfiler.js.map