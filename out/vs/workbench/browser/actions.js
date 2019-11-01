/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/instantiation/common/instantiation"], function (require, exports, platform_1, actionbar_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The action bar contributor allows to add actions to an actionbar in a given context.
     */
    class ActionBarContributor {
        /**
         * Returns true if this contributor has actions for the given context.
         */
        hasActions(context) {
            return false;
        }
        /**
         * Returns an array of primary actions in the given context.
         */
        getActions(context) {
            return [];
        }
    }
    exports.ActionBarContributor = ActionBarContributor;
    /**
     * Some predefined scopes to contribute actions to
     */
    exports.Scope = {
        /**
         * Actions inside tree widgets.
         */
        VIEWER: 'viewer'
    };
    /**
     * The ContributableActionProvider leverages the actionbar contribution model to find actions.
     */
    class ContributableActionProvider {
        constructor() {
            this.registry = platform_1.Registry.as(exports.Extensions.Actionbar);
        }
        toContext(tree, element) {
            return {
                viewer: tree,
                element: element
            };
        }
        hasActions(tree, element) {
            const context = this.toContext(tree, element);
            const contributors = this.registry.getActionBarContributors(exports.Scope.VIEWER);
            for (const contributor of contributors) {
                if (contributor.hasActions(context)) {
                    return true;
                }
            }
            return false;
        }
        getActions(tree, element) {
            const actions = [];
            const context = this.toContext(tree, element);
            // Collect Actions
            const contributors = this.registry.getActionBarContributors(exports.Scope.VIEWER);
            for (const contributor of contributors) {
                if (contributor.hasActions(context)) {
                    actions.push(...contributor.getActions(context));
                }
            }
            return prepareActions(actions);
        }
    }
    exports.ContributableActionProvider = ContributableActionProvider;
    // Helper function used in parts to massage actions before showing in action areas
    function prepareActions(actions) {
        if (!actions.length) {
            return actions;
        }
        // Clean up leading separators
        let firstIndexOfAction = -1;
        for (let i = 0; i < actions.length; i++) {
            if (actions[i].id === actionbar_1.Separator.ID) {
                continue;
            }
            firstIndexOfAction = i;
            break;
        }
        if (firstIndexOfAction === -1) {
            return [];
        }
        actions = actions.slice(firstIndexOfAction);
        // Clean up trailing separators
        for (let h = actions.length - 1; h >= 0; h--) {
            const isSeparator = actions[h].id === actionbar_1.Separator.ID;
            if (isSeparator) {
                actions.splice(h, 1);
            }
            else {
                break;
            }
        }
        // Clean up separator duplicates
        let foundAction = false;
        for (let k = actions.length - 1; k >= 0; k--) {
            const isSeparator = actions[k].id === actionbar_1.Separator.ID;
            if (isSeparator && !foundAction) {
                actions.splice(k, 1);
            }
            else if (!isSeparator) {
                foundAction = true;
            }
            else if (isSeparator) {
                foundAction = false;
            }
        }
        return actions;
    }
    exports.prepareActions = prepareActions;
    exports.Extensions = {
        Actionbar: 'workbench.contributions.actionbar'
    };
    class ActionBarRegistry {
        constructor() {
            this.actionBarContributorConstructors = [];
            this.actionBarContributorInstances = new Map();
        }
        start(accessor) {
            this.instantiationService = accessor.get(instantiation_1.IInstantiationService);
            while (this.actionBarContributorConstructors.length > 0) {
                const entry = this.actionBarContributorConstructors.shift();
                this.createActionBarContributor(entry.scope, entry.ctor);
            }
        }
        createActionBarContributor(scope, ctor) {
            const instance = this.instantiationService.createInstance(ctor);
            let target = this.actionBarContributorInstances.get(scope);
            if (!target) {
                target = [];
                this.actionBarContributorInstances.set(scope, target);
            }
            target.push(instance);
        }
        getContributors(scope) {
            return this.actionBarContributorInstances.get(scope) || [];
        }
        registerActionBarContributor(scope, ctor) {
            if (!this.instantiationService) {
                this.actionBarContributorConstructors.push({
                    scope: scope,
                    ctor: ctor
                });
            }
            else {
                this.createActionBarContributor(scope, ctor);
            }
        }
        getActionBarContributors(scope) {
            return this.getContributors(scope).slice(0);
        }
    }
    platform_1.Registry.add(exports.Extensions.Actionbar, new ActionBarRegistry());
});
//# sourceMappingURL=actions.js.map