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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/browser/dom", "vs/workbench/browser/viewlet", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/base/common/actions", "vs/workbench/contrib/debug/browser/debugActions", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/views/panelViewlet", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/platform/list/browser/listService", "vs/base/common/filters", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle"], function (require, exports, nls, async_1, dom, viewlet_1, debug_1, debugModel_1, contextView_1, keybinding_1, baseDebugView_1, actions_1, debugActions_1, actionbar_1, configuration_1, panelViewlet_1, instantiation_1, event_1, listService_1, filters_1, highlightedLabel_1, clipboardService_1, contextkey_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    let forgetScopes = true;
    exports.variableSetEmitter = new event_1.Emitter();
    let VariablesView = class VariablesView extends panelViewlet_1.ViewletPanel {
        constructor(options, contextMenuService, debugService, keybindingService, configurationService, instantiationService, clipboardService, contextKeyService) {
            super(Object.assign(Object.assign({}, options), { ariaHeaderLabel: nls.localize('variablesSection', "Variables Section") }), keybindingService, contextMenuService, configurationService, contextKeyService);
            this.debugService = debugService;
            this.instantiationService = instantiationService;
            this.clipboardService = clipboardService;
            this.needsRefresh = false;
            // Use scheduler to prevent unnecessary flashing
            this.onFocusStackFrameScheduler = new async_1.RunOnceScheduler(async () => {
                const stackFrame = this.debugService.getViewModel().focusedStackFrame;
                this.needsRefresh = false;
                if (stackFrame && this.savedViewState) {
                    await this.tree.setInput(this.debugService.getViewModel(), this.savedViewState);
                    this.savedViewState = undefined;
                }
                else {
                    if (!stackFrame) {
                        // We have no stackFrame, save tree state before it is cleared
                        this.savedViewState = this.tree.getViewState();
                    }
                    await this.tree.updateChildren();
                    if (stackFrame) {
                        const scopes = await stackFrame.getScopes();
                        // Expand the first scope if it is not expensive and if there is no expansion state (all are collapsed)
                        if (scopes.every(s => this.tree.getNode(s).collapsed) && scopes.length > 0 && !scopes[0].expensive) {
                            this.tree.expand(scopes[0]);
                        }
                    }
                }
            }, 400);
        }
        renderBody(container) {
            dom.addClass(container, 'debug-variables');
            const treeContainer = baseDebugView_1.renderViewTree(container);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'VariablesView', treeContainer, new VariablesDelegate(), [this.instantiationService.createInstance(VariablesRenderer), new ScopesRenderer()], new VariablesDataSource(), {
                ariaLabel: nls.localize('variablesAriaTreeLabel', "Debug Variables"),
                accessibilityProvider: new VariablesAccessibilityProvider(),
                identityProvider: { getId: (element) => element.getId() },
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e }
            });
            this.tree.setInput(this.debugService.getViewModel());
            debug_1.CONTEXT_VARIABLES_FOCUSED.bindTo(this.tree.contextKeyService);
            if (this.toolbar) {
                const collapseAction = new viewlet_1.CollapseAction(this.tree, true, 'explorer-action codicon-collapse-all');
                this.toolbar.setActions([collapseAction])();
            }
            this.tree.updateChildren();
            this._register(this.debugService.getViewModel().onDidFocusStackFrame(sf => {
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    return;
                }
                // Refresh the tree immediately if the user explictly changed stack frames.
                // Otherwise postpone the refresh until user stops stepping.
                const timeout = sf.explicit ? 0 : undefined;
                this.onFocusStackFrameScheduler.schedule(timeout);
            }));
            this._register(exports.variableSetEmitter.event(() => {
                const stackFrame = this.debugService.getViewModel().focusedStackFrame;
                if (stackFrame && forgetScopes) {
                    stackFrame.forgetScopes();
                }
                forgetScopes = true;
                this.tree.updateChildren();
            }));
            this._register(this.tree.onMouseDblClick(e => this.onMouseDblClick(e)));
            this._register(this.tree.onContextMenu(async (e) => await this.onContextMenu(e)));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.onFocusStackFrameScheduler.schedule();
                }
            }));
            this._register(this.debugService.getViewModel().onDidSelectExpression(e => {
                if (e instanceof debugModel_1.Variable) {
                    this.tree.rerender(e);
                }
            }));
        }
        layoutBody(width, height) {
            this.tree.layout(width, height);
        }
        focus() {
            this.tree.domFocus();
        }
        onMouseDblClick(e) {
            const session = this.debugService.getViewModel().focusedSession;
            if (session && e.element instanceof debugModel_1.Variable && session.capabilities.supportsSetVariable) {
                this.debugService.getViewModel().setSelectedExpression(e.element);
            }
        }
        async onContextMenu(e) {
            const variable = e.element;
            if (variable instanceof debugModel_1.Variable && !!variable.value) {
                const actions = [];
                const session = this.debugService.getViewModel().focusedSession;
                if (session && session.capabilities.supportsSetVariable) {
                    actions.push(new actions_1.Action('workbench.setValue', nls.localize('setValue', "Set Value"), undefined, true, () => {
                        this.debugService.getViewModel().setSelectedExpression(variable);
                        return Promise.resolve();
                    }));
                }
                actions.push(this.instantiationService.createInstance(debugActions_1.CopyValueAction, debugActions_1.CopyValueAction.ID, debugActions_1.CopyValueAction.LABEL, variable, 'variables'));
                if (variable.evaluateName) {
                    actions.push(new actions_1.Action('debug.copyEvaluatePath', nls.localize('copyAsExpression', "Copy as Expression"), undefined, true, () => {
                        return this.clipboardService.writeText(variable.evaluateName);
                    }));
                    actions.push(new actionbar_1.Separator());
                    actions.push(new actions_1.Action('debug.addToWatchExpressions', nls.localize('addToWatchExpressions', "Add to Watch"), undefined, true, () => {
                        this.debugService.addWatchExpression(variable.evaluateName);
                        return Promise.resolve(undefined);
                    }));
                }
                if (session && session.capabilities.supportsDataBreakpoints) {
                    const response = await session.dataBreakpointInfo(variable.name, variable.parent.reference);
                    const dataid = response.dataId;
                    if (dataid) {
                        actions.push(new actionbar_1.Separator());
                        actions.push(new actions_1.Action('debug.breakWhenValueChanges', nls.localize('breakWhenValueChanges', "Break When Value Changes"), undefined, true, () => {
                            return this.debugService.addDataBreakpoint(response.description, dataid, !!response.canPersist);
                        }));
                    }
                }
                this.contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => actions,
                    getActionsContext: () => variable,
                    onHide: () => lifecycle_1.dispose(actions)
                });
            }
        }
    };
    VariablesView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, clipboardService_1.IClipboardService),
        __param(7, contextkey_1.IContextKeyService)
    ], VariablesView);
    exports.VariablesView = VariablesView;
    function isViewModel(obj) {
        return typeof obj.getSelectedExpression === 'function';
    }
    class VariablesDataSource {
        hasChildren(element) {
            if (isViewModel(element) || element instanceof debugModel_1.Scope) {
                return true;
            }
            return element.hasChildren;
        }
        getChildren(element) {
            if (isViewModel(element)) {
                const stackFrame = element.focusedStackFrame;
                return stackFrame ? stackFrame.getScopes() : Promise.resolve([]);
            }
            return element.getChildren();
        }
    }
    exports.VariablesDataSource = VariablesDataSource;
    class VariablesDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof debugModel_1.Scope) {
                return ScopesRenderer.ID;
            }
            return VariablesRenderer.ID;
        }
    }
    class ScopesRenderer {
        get templateId() {
            return ScopesRenderer.ID;
        }
        renderTemplate(container) {
            const name = dom.append(container, $('.scope'));
            const label = new highlightedLabel_1.HighlightedLabel(name, false);
            return { name, label };
        }
        renderElement(element, index, templateData) {
            templateData.label.set(element.element.name, filters_1.createMatches(element.filterData));
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    ScopesRenderer.ID = 'scope';
    class VariablesRenderer extends baseDebugView_1.AbstractExpressionsRenderer {
        get templateId() {
            return VariablesRenderer.ID;
        }
        renderExpression(expression, data, highlights) {
            baseDebugView_1.renderVariable(expression, data, true, highlights);
        }
        getInputBoxOptions(expression) {
            const variable = expression;
            return {
                initialValue: expression.value,
                ariaLabel: nls.localize('variableValueAriaLabel', "Type new variable value"),
                validationOptions: {
                    validation: () => variable.errorMessage ? ({ content: variable.errorMessage }) : null
                },
                onFinish: (value, success) => {
                    variable.errorMessage = undefined;
                    if (success && variable.value !== value) {
                        variable.setVariable(value)
                            // Need to force watch expressions and variables to update since a variable change can have an effect on both
                            .then(() => {
                            // Do not refresh scopes due to a node limitation #15520
                            forgetScopes = false;
                            exports.variableSetEmitter.fire();
                        });
                    }
                }
            };
        }
    }
    exports.VariablesRenderer = VariablesRenderer;
    VariablesRenderer.ID = 'variable';
    class VariablesAccessibilityProvider {
        getAriaLabel(element) {
            if (element instanceof debugModel_1.Scope) {
                return nls.localize('variableScopeAriaLabel', "Scope {0}, variables, debug", element.name);
            }
            if (element instanceof debugModel_1.Variable) {
                return nls.localize('variableAriaLabel', "{0} value {1}, variables, debug", element.name, element.value);
            }
            return null;
        }
    }
});
//# sourceMappingURL=variablesView.js.map