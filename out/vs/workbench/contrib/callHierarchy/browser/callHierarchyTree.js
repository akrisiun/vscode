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
define(["require", "exports", "vs/workbench/contrib/callHierarchy/browser/callHierarchy", "vs/base/common/cancellation", "vs/base/common/filters", "vs/base/browser/ui/iconLabel/iconLabel", "vs/editor/common/modes", "vs/base/common/hash", "vs/editor/common/services/resolverService", "vs/editor/common/core/range"], function (require, exports, callHierarchy_1, cancellation_1, filters_1, iconLabel_1, modes_1, hash_1, resolverService_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Call {
        constructor(item, locations, parent) {
            this.item = item;
            this.locations = locations;
            this.parent = parent;
        }
    }
    exports.Call = Call;
    class CallHierarchyRoot {
        constructor(model, position, word) {
            this.model = model;
            this.position = position;
            this.word = word;
        }
        static fromEditor(editor) {
            const model = editor.getModel();
            const position = editor.getPosition();
            const wordInfo = model.getWordAtPosition(position);
            return wordInfo
                ? new CallHierarchyRoot(model, position, wordInfo.word)
                : undefined;
        }
    }
    exports.CallHierarchyRoot = CallHierarchyRoot;
    let DataSource = class DataSource {
        constructor(provider, getDirection, _modelService) {
            this.provider = provider;
            this.getDirection = getDirection;
            this._modelService = _modelService;
        }
        hasChildren() {
            return true;
        }
        async getChildren(element) {
            const results = [];
            if (element instanceof CallHierarchyRoot) {
                if (this.getDirection() === 2 /* CallsFrom */) {
                    await this._getOutgoingCalls(element.model, element.position, results);
                }
                else {
                    await this._getIncomingCalls(element.model, element.position, results);
                }
            }
            else {
                const reference = await this._modelService.createModelReference(element.item.uri);
                const position = range_1.Range.lift(element.item.selectionRange).getStartPosition();
                if (this.getDirection() === 2 /* CallsFrom */) {
                    await this._getOutgoingCalls(reference.object.textEditorModel, position, results, element);
                }
                else {
                    await this._getIncomingCalls(reference.object.textEditorModel, position, results, element);
                }
                reference.dispose();
            }
            return results;
        }
        async _getOutgoingCalls(model, position, bucket, parent) {
            const outgoingCalls = await callHierarchy_1.provideOutgoingCalls(model, position, cancellation_1.CancellationToken.None);
            for (const call of outgoingCalls) {
                bucket.push(new Call(call.to, call.fromRanges.map(range => ({ range, uri: model.uri })), parent));
            }
        }
        async _getIncomingCalls(model, position, bucket, parent) {
            const incomingCalls = await callHierarchy_1.provideIncomingCalls(model, position, cancellation_1.CancellationToken.None);
            for (const call of incomingCalls) {
                bucket.push(new Call(call.from, call.fromRanges.map(range => ({ range, uri: call.from.uri })), parent));
            }
        }
    };
    DataSource = __decorate([
        __param(2, resolverService_1.ITextModelService)
    ], DataSource);
    exports.DataSource = DataSource;
    class IdentityProvider {
        constructor(getDirection) {
            this.getDirection = getDirection;
        }
        getId(element) {
            return this.getDirection() + hash_1.hash(element.item.uri.toString(), hash_1.hash(JSON.stringify(element.item.range))).toString() + (element.parent ? this.getId(element.parent) : '');
        }
    }
    exports.IdentityProvider = IdentityProvider;
    class CallRenderingTemplate {
        constructor(iconLabel) {
            this.iconLabel = iconLabel;
        }
    }
    class CallRenderer {
        constructor() {
            this.templateId = CallRenderer.id;
        }
        renderTemplate(container) {
            const iconLabel = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            return new CallRenderingTemplate(iconLabel);
        }
        renderElement(node, _index, template) {
            const { element, filterData } = node;
            template.iconLabel.setLabel(element.item.name, element.item.detail, {
                labelEscapeNewLines: true,
                matches: filters_1.createMatches(filterData),
                extraClasses: [modes_1.SymbolKinds.toCssClassName(element.item.kind, true)]
            });
        }
        disposeTemplate(template) {
            template.iconLabel.dispose();
        }
    }
    exports.CallRenderer = CallRenderer;
    CallRenderer.id = 'CallRenderer';
    class VirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(_element) {
            return CallRenderer.id;
        }
    }
    exports.VirtualDelegate = VirtualDelegate;
});
//# sourceMappingURL=callHierarchyTree.js.map