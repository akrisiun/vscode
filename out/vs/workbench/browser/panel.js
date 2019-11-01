/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/browser/composite", "vs/base/common/actions", "vs/base/browser/dom"], function (require, exports, platform_1, composite_1, actions_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Panel extends composite_1.Composite {
    }
    exports.Panel = Panel;
    /**
     * A panel descriptor is a leightweight descriptor of a panel in the workbench.
     */
    class PanelDescriptor extends composite_1.CompositeDescriptor {
        constructor(ctor, id, name, cssClass, order, _commandId) {
            super(ctor, id, name, cssClass, order, _commandId);
        }
    }
    exports.PanelDescriptor = PanelDescriptor;
    class PanelRegistry extends composite_1.CompositeRegistry {
        /**
         * Registers a panel to the platform.
         */
        registerPanel(descriptor) {
            super.registerComposite(descriptor);
        }
        /**
         * Deregisters a panel to the platform.
         */
        deregisterPanel(id) {
            super.deregisterComposite(id);
        }
        /**
         * Returns a panel by id.
         */
        getPanel(id) {
            return this.getComposite(id);
        }
        /**
         * Returns an array of registered panels known to the platform.
         */
        getPanels() {
            return this.getComposites();
        }
        /**
         * Sets the id of the panel that should open on startup by default.
         */
        setDefaultPanelId(id) {
            this.defaultPanelId = id;
        }
        /**
         * Gets the id of the panel that should open on startup by default.
         */
        getDefaultPanelId() {
            return this.defaultPanelId;
        }
        /**
         * Find out if a panel exists with the provided ID.
         */
        hasPanel(id) {
            return this.getPanels().some(panel => panel.id === id);
        }
    }
    exports.PanelRegistry = PanelRegistry;
    /**
     * A reusable action to toggle a panel with a specific id depending on focus.
     */
    class TogglePanelAction extends actions_1.Action {
        constructor(id, label, panelId, panelService, layoutService, cssClass) {
            super(id, label, cssClass);
            this.panelId = panelId;
            this.panelService = panelService;
            this.layoutService = layoutService;
        }
        run() {
            if (this.isPanelFocused()) {
                this.layoutService.setPanelHidden(true);
            }
            else {
                this.panelService.openPanel(this.panelId, true);
            }
            return Promise.resolve();
        }
        isPanelActive() {
            const activePanel = this.panelService.getActivePanel();
            return !!activePanel && activePanel.getId() === this.panelId;
        }
        isPanelFocused() {
            const activeElement = document.activeElement;
            return !!(this.isPanelActive() && activeElement && dom_1.isAncestor(activeElement, this.layoutService.getContainer("workbench.parts.panel" /* PANEL_PART */)));
        }
    }
    exports.TogglePanelAction = TogglePanelAction;
    exports.Extensions = {
        Panels: 'workbench.contributions.panels'
    };
    platform_1.Registry.add(exports.Extensions.Panels, new PanelRegistry());
});
//# sourceMappingURL=panel.js.map