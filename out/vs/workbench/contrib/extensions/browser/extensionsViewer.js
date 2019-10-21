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
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/actions", "vs/workbench/contrib/extensions/common/extensions", "vs/base/common/event", "vs/base/browser/event", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/themeService", "vs/platform/accessibility/common/accessibility", "vs/platform/keybinding/common/keybinding", "vs/base/common/cancellation", "vs/base/common/arrays"], function (require, exports, dom, nls_1, lifecycle_1, actions_1, extensions_1, event_1, event_2, instantiation_1, listService_1, configuration_1, contextkey_1, themeService_1, accessibility_1, keybinding_1, cancellation_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AsyncDataSource {
        hasChildren({ hasChildren }) {
            return hasChildren;
        }
        getChildren(extensionData) {
            return extensionData.getChildren();
        }
    }
    exports.AsyncDataSource = AsyncDataSource;
    class VirualDelegate {
        getHeight(element) {
            return 62;
        }
        getTemplateId({ extension }) {
            return extension ? ExtensionRenderer.TEMPLATE_ID : UnknownExtensionRenderer.TEMPLATE_ID;
        }
    }
    exports.VirualDelegate = VirualDelegate;
    let ExtensionRenderer = class ExtensionRenderer {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
        }
        get templateId() {
            return ExtensionRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            dom.addClass(container, 'extension');
            const icon = dom.append(container, dom.$('img.icon'));
            const details = dom.append(container, dom.$('.details'));
            const header = dom.append(details, dom.$('.header'));
            const name = dom.append(header, dom.$('span.name'));
            const openExtensionAction = this.instantiationService.createInstance(OpenExtensionAction);
            const extensionDisposables = [dom.addDisposableListener(name, 'click', (e) => {
                    openExtensionAction.run(e.ctrlKey || e.metaKey);
                    e.stopPropagation();
                    e.preventDefault();
                })];
            const identifier = dom.append(header, dom.$('span.identifier'));
            const footer = dom.append(details, dom.$('.footer'));
            const author = dom.append(footer, dom.$('.author'));
            return {
                icon,
                name,
                identifier,
                author,
                extensionDisposables,
                set extensionData(extensionData) {
                    openExtensionAction.extensionData = extensionData;
                }
            };
        }
        renderElement(node, index, data) {
            const extension = node.element.extension;
            const onError = event_1.Event.once(event_2.domEvent(data.icon, 'error'));
            onError(() => data.icon.src = extension.iconUrlFallback, null, data.extensionDisposables);
            data.icon.src = extension.iconUrl;
            if (!data.icon.complete) {
                data.icon.style.visibility = 'hidden';
                data.icon.onload = () => data.icon.style.visibility = 'inherit';
            }
            else {
                data.icon.style.visibility = 'inherit';
            }
            data.name.textContent = extension.displayName;
            data.identifier.textContent = extension.identifier.id;
            data.author.textContent = extension.publisherDisplayName;
            data.extensionData = node.element;
        }
        disposeTemplate(templateData) {
            templateData.extensionDisposables = lifecycle_1.dispose(templateData.extensionDisposables);
        }
    };
    ExtensionRenderer.TEMPLATE_ID = 'extension-template';
    ExtensionRenderer = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], ExtensionRenderer);
    exports.ExtensionRenderer = ExtensionRenderer;
    class UnknownExtensionRenderer {
        get templateId() {
            return UnknownExtensionRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const messageContainer = dom.append(container, dom.$('div.unknown-extension'));
            dom.append(messageContainer, dom.$('span.error-marker')).textContent = nls_1.localize('error', "Error");
            dom.append(messageContainer, dom.$('span.message')).textContent = nls_1.localize('Unknown Extension', "Unknown Extension:");
            const identifier = dom.append(messageContainer, dom.$('span.message'));
            return { identifier };
        }
        renderElement(node, index, data) {
            data.identifier.textContent = node.element.extension.identifier.id;
        }
        disposeTemplate(data) {
        }
    }
    exports.UnknownExtensionRenderer = UnknownExtensionRenderer;
    UnknownExtensionRenderer.TEMPLATE_ID = 'unknown-extension-template';
    let OpenExtensionAction = class OpenExtensionAction extends actions_1.Action {
        constructor(extensionsWorkdbenchService) {
            super('extensions.action.openExtension', '');
            this.extensionsWorkdbenchService = extensionsWorkdbenchService;
        }
        set extensionData(extension) {
            this._extensionData = extension;
        }
        run(sideByside) {
            if (this._extensionData) {
                return this.extensionsWorkdbenchService.open(this._extensionData.extension, sideByside);
            }
            return Promise.resolve();
        }
    };
    OpenExtensionAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService)
    ], OpenExtensionAction);
    let ExtensionsTree = class ExtensionsTree extends listService_1.WorkbenchAsyncDataTree {
        constructor(input, container, contextKeyService, listService, themeService, instantiationService, configurationService, keybindingService, accessibilityService, extensionsWorkdbenchService) {
            const delegate = new VirualDelegate();
            const dataSource = new AsyncDataSource();
            const renderers = [instantiationService.createInstance(ExtensionRenderer), instantiationService.createInstance(UnknownExtensionRenderer)];
            const identityProvider = {
                getId({ extension, parent }) {
                    return parent ? this.getId(parent) + '/' + extension.identifier.id : extension.identifier.id;
                }
            };
            super('ExtensionsTree', container, delegate, renderers, dataSource, {
                indent: 40,
                identityProvider,
                multipleSelectionSupport: false
            }, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService);
            this.setInput(input);
            this.disposables.add(this.onDidChangeSelection(event => {
                if (event.browserEvent && event.browserEvent instanceof KeyboardEvent) {
                    extensionsWorkdbenchService.open(event.elements[0].extension, false);
                }
            }));
        }
    };
    ExtensionsTree = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, listService_1.IListService),
        __param(4, themeService_1.IThemeService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, accessibility_1.IAccessibilityService),
        __param(9, extensions_1.IExtensionsWorkbenchService)
    ], ExtensionsTree);
    exports.ExtensionsTree = ExtensionsTree;
    class ExtensionData {
        constructor(extension, parent, getChildrenExtensionIds, extensionsWorkbenchService) {
            this.extension = extension;
            this.parent = parent;
            this.getChildrenExtensionIds = getChildrenExtensionIds;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.childrenExtensionIds = this.getChildrenExtensionIds(extension);
        }
        get hasChildren() {
            return arrays_1.isNonEmptyArray(this.childrenExtensionIds);
        }
        async getChildren() {
            if (this.hasChildren) {
                const localById = this.extensionsWorkbenchService.local.reduce((result, e) => { result.set(e.identifier.id.toLowerCase(), e); return result; }, new Map());
                const result = [];
                const toQuery = [];
                for (const extensionId of this.childrenExtensionIds) {
                    const id = extensionId.toLowerCase();
                    const local = localById.get(id);
                    if (local) {
                        result.push(local);
                    }
                    else {
                        toQuery.push(id);
                    }
                }
                if (toQuery.length) {
                    const galleryResult = await this.extensionsWorkbenchService.queryGallery({ names: toQuery, pageSize: toQuery.length }, cancellation_1.CancellationToken.None);
                    result.push(...galleryResult.firstPage);
                }
                return result.map(extension => new ExtensionData(extension, this, this.getChildrenExtensionIds, this.extensionsWorkbenchService));
            }
            return null;
        }
    }
    exports.ExtensionData = ExtensionData;
});
//# sourceMappingURL=extensionsViewer.js.map