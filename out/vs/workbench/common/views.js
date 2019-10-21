/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/contextkey/common/contextkey", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/registry/common/platform"], function (require, exports, event_1, contextkey_1, nls_1, instantiation_1, lifecycle_1, map_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TEST_VIEW_CONTAINER_ID = 'workbench.view.extension.test';
    exports.FocusedViewContext = new contextkey_1.RawContextKey('focusedView', '');
    var Extensions;
    (function (Extensions) {
        Extensions.ViewContainersRegistry = 'workbench.registry.view.containers';
        Extensions.ViewsRegistry = 'workbench.registry.view';
    })(Extensions = exports.Extensions || (exports.Extensions = {}));
    class ViewContainer {
        constructor(id, hideIfEmpty, extensionId, orderDelegate) {
            this.id = id;
            this.hideIfEmpty = hideIfEmpty;
            this.extensionId = extensionId;
            this.orderDelegate = orderDelegate;
        }
    }
    exports.ViewContainer = ViewContainer;
    class ViewContainersRegistryImpl extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidRegister = this._register(new event_1.Emitter());
            this.onDidRegister = this._onDidRegister.event;
            this._onDidDeregister = this._register(new event_1.Emitter());
            this.onDidDeregister = this._onDidDeregister.event;
            this.viewContainers = new Map();
        }
        get all() {
            return map_1.values(this.viewContainers);
        }
        registerViewContainer(id, hideIfEmpty, extensionId, viewOrderDelegate) {
            const existing = this.viewContainers.get(id);
            if (existing) {
                return existing;
            }
            const viewContainer = new class extends ViewContainer {
                constructor() {
                    super(id, !!hideIfEmpty, extensionId, viewOrderDelegate);
                }
            };
            this.viewContainers.set(id, viewContainer);
            this._onDidRegister.fire(viewContainer);
            return viewContainer;
        }
        deregisterViewContainer(viewContainer) {
            const existing = this.viewContainers.get(viewContainer.id);
            if (existing) {
                this.viewContainers.delete(viewContainer.id);
                this._onDidDeregister.fire(viewContainer);
            }
        }
        get(id) {
            return this.viewContainers.get(id);
        }
    }
    platform_1.Registry.add(Extensions.ViewContainersRegistry, new ViewContainersRegistryImpl());
    class ViewsRegistry extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onViewsRegistered = this._register(new event_1.Emitter());
            this.onViewsRegistered = this._onViewsRegistered.event;
            this._onViewsDeregistered = this._register(new event_1.Emitter());
            this.onViewsDeregistered = this._onViewsDeregistered.event;
            this._onDidChangeContainer = this._register(new event_1.Emitter());
            this.onDidChangeContainer = this._onDidChangeContainer.event;
            this._viewContainers = [];
            this._views = new Map();
        }
        registerViews(views, viewContainer) {
            this.addViews(views, viewContainer);
            this._onViewsRegistered.fire({ views: views, viewContainer });
        }
        deregisterViews(viewDescriptors, viewContainer) {
            const views = this.removeViews(viewDescriptors, viewContainer);
            if (views.length) {
                this._onViewsDeregistered.fire({ views, viewContainer });
            }
        }
        moveViews(viewsToMove, viewContainer) {
            map_1.keys(this._views).forEach(container => {
                if (container !== viewContainer) {
                    const views = this.removeViews(viewsToMove, container);
                    if (views.length) {
                        this.addViews(views, viewContainer);
                        this._onDidChangeContainer.fire({ views, from: container, to: viewContainer });
                    }
                }
            });
        }
        getViews(loc) {
            return this._views.get(loc) || [];
        }
        getView(id) {
            for (const viewContainer of this._viewContainers) {
                const viewDescriptor = (this._views.get(viewContainer) || []).filter(v => v.id === id)[0];
                if (viewDescriptor) {
                    return viewDescriptor;
                }
            }
            return null;
        }
        getViewContainer(viewId) {
            for (const viewContainer of this._viewContainers) {
                const viewDescriptor = (this._views.get(viewContainer) || []).filter(v => v.id === viewId)[0];
                if (viewDescriptor) {
                    return viewContainer;
                }
            }
            return null;
        }
        addViews(viewDescriptors, viewContainer) {
            let views = this._views.get(viewContainer);
            if (!views) {
                views = [];
                this._views.set(viewContainer, views);
                this._viewContainers.push(viewContainer);
            }
            for (const viewDescriptor of viewDescriptors) {
                if (views.some(v => v.id === viewDescriptor.id)) {
                    throw new Error(nls_1.localize('duplicateId', "A view with id '{0}' is already registered in the container '{1}'", viewDescriptor.id, viewContainer.id));
                }
                views.push(viewDescriptor);
            }
        }
        removeViews(viewDescriptors, viewContainer) {
            const views = this._views.get(viewContainer);
            if (!views) {
                return [];
            }
            const viewsToDeregister = [];
            const remaningViews = [];
            for (const view of views) {
                if (viewDescriptors.indexOf(view) === -1) {
                    remaningViews.push(view);
                }
                else {
                    viewsToDeregister.push(view);
                }
            }
            if (viewsToDeregister.length) {
                if (remaningViews.length) {
                    this._views.set(viewContainer, remaningViews);
                }
                else {
                    this._views.delete(viewContainer);
                    this._viewContainers.splice(this._viewContainers.indexOf(viewContainer), 1);
                }
            }
            return viewsToDeregister;
        }
    }
    platform_1.Registry.add(Extensions.ViewsRegistry, new ViewsRegistry());
    exports.IViewsService = instantiation_1.createDecorator('viewsService');
    var TreeItemCollapsibleState;
    (function (TreeItemCollapsibleState) {
        TreeItemCollapsibleState[TreeItemCollapsibleState["None"] = 0] = "None";
        TreeItemCollapsibleState[TreeItemCollapsibleState["Collapsed"] = 1] = "Collapsed";
        TreeItemCollapsibleState[TreeItemCollapsibleState["Expanded"] = 2] = "Expanded";
    })(TreeItemCollapsibleState = exports.TreeItemCollapsibleState || (exports.TreeItemCollapsibleState = {}));
});
//# sourceMappingURL=views.js.map