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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/browser/dom", "vs/workbench/browser/viewlet", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/browser/debugActions", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/base/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/views/panelViewlet", "vs/platform/list/browser/listService", "vs/base/browser/ui/list/listView", "vs/workbench/contrib/debug/browser/variablesView", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle"], function (require, exports, nls, async_1, dom, viewlet_1, debug_1, debugModel_1, debugActions_1, contextView_1, instantiation_1, keybinding_1, actions_1, actionbar_1, baseDebugView_1, configuration_1, panelViewlet_1, listService_1, listView_1, variablesView_1, contextkey_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const MAX_VALUE_RENDER_LENGTH_IN_VIEWLET = 1024;
    let WatchExpressionsView = class WatchExpressionsView extends panelViewlet_1.ViewletPanel {
        constructor(options, contextMenuService, debugService, keybindingService, instantiationService, configurationService, contextKeyService) {
            super(Object.assign(Object.assign({}, options), { ariaHeaderLabel: nls.localize('watchExpressionsSection', "Watch Expressions Section") }), keybindingService, contextMenuService, configurationService, contextKeyService);
            this.debugService = debugService;
            this.instantiationService = instantiationService;
            this.needsRefresh = false;
            this.onWatchExpressionsUpdatedScheduler = new async_1.RunOnceScheduler(() => {
                this.needsRefresh = false;
                this.tree.updateChildren();
            }, 50);
        }
        renderBody(container) {
            dom.addClass(container, 'debug-watch');
            const treeContainer = baseDebugView_1.renderViewTree(container);
            const expressionsRenderer = this.instantiationService.createInstance(WatchExpressionsRenderer);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'WatchExpressions', treeContainer, new WatchExpressionsDelegate(), [expressionsRenderer, this.instantiationService.createInstance(variablesView_1.VariablesRenderer)], new WatchExpressionsDataSource(), {
                ariaLabel: nls.localize({ comment: ['Debug is a noun in this context, not a verb.'], key: 'watchAriaTreeLabel' }, "Debug Watch Expressions"),
                accessibilityProvider: new WatchExpressionsAccessibilityProvider(),
                identityProvider: { getId: (element) => element.getId() },
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e },
                dnd: new WatchExpressionsDragAndDrop(this.debugService),
            });
            this.tree.setInput(this.debugService);
            debug_1.CONTEXT_WATCH_EXPRESSIONS_FOCUSED.bindTo(this.tree.contextKeyService);
            if (this.toolbar) {
                const addWatchExpressionAction = new debugActions_1.AddWatchExpressionAction(debugActions_1.AddWatchExpressionAction.ID, debugActions_1.AddWatchExpressionAction.LABEL, this.debugService, this.keybindingService);
                const collapseAction = new viewlet_1.CollapseAction(this.tree, true, 'explorer-action codicon-collapse-all');
                const removeAllWatchExpressionsAction = new debugActions_1.RemoveAllWatchExpressionsAction(debugActions_1.RemoveAllWatchExpressionsAction.ID, debugActions_1.RemoveAllWatchExpressionsAction.LABEL, this.debugService, this.keybindingService);
                this.toolbar.setActions([addWatchExpressionAction, collapseAction, removeAllWatchExpressionsAction])();
            }
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            this._register(this.tree.onMouseDblClick(e => this.onMouseDblClick(e)));
            this._register(this.debugService.getModel().onDidChangeWatchExpressions(we => {
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                }
                else {
                    this.tree.updateChildren();
                }
            }));
            this._register(this.debugService.getViewModel().onDidFocusStackFrame(() => {
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    return;
                }
                if (!this.onWatchExpressionsUpdatedScheduler.isScheduled()) {
                    this.onWatchExpressionsUpdatedScheduler.schedule();
                }
            }));
            this._register(variablesView_1.variableSetEmitter.event(() => this.tree.updateChildren()));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.onWatchExpressionsUpdatedScheduler.schedule();
                }
            }));
            this._register(this.debugService.getViewModel().onDidSelectExpression(e => {
                if (e instanceof debugModel_1.Expression && e.name) {
                    this.tree.rerender(e);
                }
            }));
        }
        layoutBody(height, width) {
            this.tree.layout(height, width);
        }
        focus() {
            this.tree.domFocus();
        }
        onMouseDblClick(e) {
            if (e.browserEvent.target.className.indexOf('twistie') >= 0) {
                // Ignore double click events on twistie
                return;
            }
            const element = e.element;
            // double click on primitive value: open input box to be able to select and copy value.
            if (element instanceof debugModel_1.Expression && element !== this.debugService.getViewModel().getSelectedExpression()) {
                this.debugService.getViewModel().setSelectedExpression(element);
            }
            else if (!element) {
                // Double click in watch panel triggers to add a new watch expression
                this.debugService.addWatchExpression();
            }
        }
        onContextMenu(e) {
            const element = e.element;
            const anchor = e.anchor;
            if (!anchor) {
                return;
            }
            const actions = [];
            if (element instanceof debugModel_1.Expression) {
                const expression = element;
                actions.push(new debugActions_1.AddWatchExpressionAction(debugActions_1.AddWatchExpressionAction.ID, debugActions_1.AddWatchExpressionAction.LABEL, this.debugService, this.keybindingService));
                actions.push(new actions_1.Action('debug.editWatchExpression', nls.localize('editWatchExpression', "Edit Expression"), undefined, true, () => {
                    this.debugService.getViewModel().setSelectedExpression(expression);
                    return Promise.resolve();
                }));
                if (!expression.hasChildren) {
                    actions.push(this.instantiationService.createInstance(debugActions_1.CopyValueAction, debugActions_1.CopyValueAction.ID, debugActions_1.CopyValueAction.LABEL, expression.value, 'watch'));
                }
                actions.push(new actionbar_1.Separator());
                actions.push(new actions_1.Action('debug.removeWatchExpression', nls.localize('removeWatchExpression', "Remove Expression"), undefined, true, () => {
                    this.debugService.removeWatchExpressions(expression.getId());
                    return Promise.resolve();
                }));
                actions.push(new debugActions_1.RemoveAllWatchExpressionsAction(debugActions_1.RemoveAllWatchExpressionsAction.ID, debugActions_1.RemoveAllWatchExpressionsAction.LABEL, this.debugService, this.keybindingService));
            }
            else {
                actions.push(new debugActions_1.AddWatchExpressionAction(debugActions_1.AddWatchExpressionAction.ID, debugActions_1.AddWatchExpressionAction.LABEL, this.debugService, this.keybindingService));
                if (element instanceof debugModel_1.Variable) {
                    const variable = element;
                    if (!variable.hasChildren) {
                        actions.push(this.instantiationService.createInstance(debugActions_1.CopyValueAction, debugActions_1.CopyValueAction.ID, debugActions_1.CopyValueAction.LABEL, variable, 'watch'));
                    }
                    actions.push(new actionbar_1.Separator());
                }
                actions.push(new debugActions_1.RemoveAllWatchExpressionsAction(debugActions_1.RemoveAllWatchExpressionsAction.ID, debugActions_1.RemoveAllWatchExpressionsAction.LABEL, this.debugService, this.keybindingService));
            }
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                getActionsContext: () => element,
                onHide: () => lifecycle_1.dispose(actions)
            });
        }
    };
    WatchExpressionsView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, contextkey_1.IContextKeyService)
    ], WatchExpressionsView);
    exports.WatchExpressionsView = WatchExpressionsView;
    class WatchExpressionsDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof debugModel_1.Expression) {
                return WatchExpressionsRenderer.ID;
            }
            // Variable
            return variablesView_1.VariablesRenderer.ID;
        }
    }
    function isDebugService(element) {
        return typeof element.getConfigurationManager === 'function';
    }
    class WatchExpressionsDataSource {
        hasChildren(element) {
            return isDebugService(element) || element.hasChildren;
        }
        getChildren(element) {
            if (isDebugService(element)) {
                const debugService = element;
                const watchExpressions = debugService.getModel().getWatchExpressions();
                const viewModel = debugService.getViewModel();
                return Promise.all(watchExpressions.map(we => !!we.name
                    ? we.evaluate(viewModel.focusedSession, viewModel.focusedStackFrame, 'watch').then(() => we)
                    : Promise.resolve(we)));
            }
            return element.getChildren();
        }
    }
    class WatchExpressionsRenderer extends baseDebugView_1.AbstractExpressionsRenderer {
        get templateId() {
            return WatchExpressionsRenderer.ID;
        }
        renderExpression(expression, data, highlights) {
            const text = typeof expression.value === 'string' ? `${expression.name}:` : expression.name;
            data.label.set(text, highlights, expression.type ? expression.type : expression.value);
            baseDebugView_1.renderExpressionValue(expression, data.value, {
                showChanged: true,
                maxValueLength: MAX_VALUE_RENDER_LENGTH_IN_VIEWLET,
                preserveWhitespace: false,
                showHover: true,
                colorize: true
            });
        }
        getInputBoxOptions(expression) {
            return {
                initialValue: expression.name ? expression.name : '',
                ariaLabel: nls.localize('watchExpressionInputAriaLabel', "Type watch expression"),
                placeholder: nls.localize('watchExpressionPlaceholder', "Expression to watch"),
                onFinish: (value, success) => {
                    if (success && value) {
                        this.debugService.renameWatchExpression(expression.getId(), value);
                        variablesView_1.variableSetEmitter.fire();
                    }
                    else if (!expression.name) {
                        this.debugService.removeWatchExpressions(expression.getId());
                    }
                }
            };
        }
    }
    exports.WatchExpressionsRenderer = WatchExpressionsRenderer;
    WatchExpressionsRenderer.ID = 'watchexpression';
    class WatchExpressionsAccessibilityProvider {
        getAriaLabel(element) {
            if (element instanceof debugModel_1.Expression) {
                return nls.localize('watchExpressionAriaLabel', "{0} value {1}, watch, debug", element.name, element.value);
            }
            // Variable
            return nls.localize('watchVariableAriaLabel', "{0} value {1}, watch, debug", element.name, element.value);
        }
    }
    class WatchExpressionsDragAndDrop {
        constructor(debugService) {
            this.debugService = debugService;
        }
        onDragOver(data) {
            if (!(data instanceof listView_1.ElementsDragAndDropData)) {
                return false;
            }
            const expressions = data.elements;
            return expressions.length > 0 && expressions[0] instanceof debugModel_1.Expression;
        }
        getDragURI(element) {
            if (!(element instanceof debugModel_1.Expression) || element === this.debugService.getViewModel().getSelectedExpression()) {
                return null;
            }
            return element.getId();
        }
        getDragLabel(elements) {
            if (elements.length === 1) {
                return elements[0].name;
            }
            return undefined;
        }
        drop(data, targetElement) {
            if (!(data instanceof listView_1.ElementsDragAndDropData)) {
                return;
            }
            const draggedElement = data.elements[0];
            const watches = this.debugService.getModel().getWatchExpressions();
            const position = targetElement instanceof debugModel_1.Expression ? watches.indexOf(targetElement) : watches.length - 1;
            this.debugService.moveWatchExpression(draggedElement.getId(), position);
        }
    }
});
//# sourceMappingURL=watchExpressionsView.js.map