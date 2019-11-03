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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/base/browser/dom", "vs/base/common/actions", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/browser/debugActions", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/themeService", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/inputbox/inputBox", "vs/platform/list/browser/listService", "vs/platform/theme/common/styler", "vs/editor/browser/editorBrowser", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/views/panelViewlet", "vs/platform/label/common/label", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls, resources, dom, actions_1, debug_1, debugModel_1, debugActions_1, contextView_1, instantiation_1, keybinding_1, themeService_1, lifecycle_1, actionbar_1, inputBox_1, listService_1, styler_1, editorBrowser_1, configuration_1, editorService_1, panelViewlet_1, label_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    function createCheckbox() {
        const checkbox = $('input');
        checkbox.type = 'checkbox';
        checkbox.tabIndex = -1;
        return checkbox;
    }
    let BreakpointsView = class BreakpointsView extends panelViewlet_1.ViewletPanel {
        constructor(options, contextMenuService, debugService, keybindingService, instantiationService, themeService, editorService, contextViewService, configurationService, contextKeyService) {
            super(Object.assign(Object.assign({}, options), { ariaHeaderLabel: nls.localize('breakpointsSection', "Breakpoints Section") }), keybindingService, contextMenuService, configurationService, contextKeyService);
            this.debugService = debugService;
            this.instantiationService = instantiationService;
            this.themeService = themeService;
            this.editorService = editorService;
            this.contextViewService = contextViewService;
            this.needsRefresh = false;
            this.minimumBodySize = this.maximumBodySize = this.getExpandedBodySize();
            this._register(this.debugService.getModel().onDidChangeBreakpoints(() => this.onBreakpointsChange()));
        }
        renderBody(container) {
            dom.addClass(container, 'debug-breakpoints');
            const delegate = new BreakpointsDelegate(this.debugService);
            this.list = this.instantiationService.createInstance(listService_1.WorkbenchList, 'Breakpoints', container, delegate, [
                this.instantiationService.createInstance(BreakpointsRenderer),
                new ExceptionBreakpointsRenderer(this.debugService),
                this.instantiationService.createInstance(FunctionBreakpointsRenderer),
                this.instantiationService.createInstance(DataBreakpointsRenderer),
                new FunctionBreakpointInputRenderer(this.debugService, this.contextViewService, this.themeService)
            ], {
                identityProvider: { getId: (element) => element.getId() },
                multipleSelectionSupport: false,
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e },
                ariaProvider: {
                    getSetSize: (_, index, listLength) => listLength,
                    getPosInSet: (_, index) => index,
                    getRole: (breakpoint) => 'checkbox',
                    isChecked: (breakpoint) => breakpoint.enabled
                }
            });
            debug_1.CONTEXT_BREAKPOINTS_FOCUSED.bindTo(this.list.contextKeyService);
            this._register(this.list.onContextMenu(this.onListContextMenu, this));
            this._register(this.list.onDidOpen(async (e) => {
                let isSingleClick = false;
                let isDoubleClick = false;
                let isMiddleClick = false;
                let openToSide = false;
                const browserEvent = e.browserEvent;
                if (browserEvent instanceof MouseEvent) {
                    isSingleClick = browserEvent.detail === 1;
                    isDoubleClick = browserEvent.detail === 2;
                    isMiddleClick = browserEvent.button === 1;
                    openToSide = (browserEvent.ctrlKey || browserEvent.metaKey || browserEvent.altKey);
                }
                const focused = this.list.getFocusedElements();
                const element = focused.length ? focused[0] : undefined;
                if (isMiddleClick) {
                    if (element instanceof debugModel_1.Breakpoint) {
                        await this.debugService.removeBreakpoints(element.getId());
                    }
                    else if (element instanceof debugModel_1.FunctionBreakpoint) {
                        await this.debugService.removeFunctionBreakpoints(element.getId());
                    }
                    else if (element instanceof debugModel_1.DataBreakpoint) {
                        await this.debugService.removeDataBreakpoints(element.getId());
                    }
                    return;
                }
                if (element instanceof debugModel_1.Breakpoint) {
                    openBreakpointSource(element, openToSide, isSingleClick, this.debugService, this.editorService);
                }
                if (isDoubleClick && element instanceof debugModel_1.FunctionBreakpoint && element !== this.debugService.getViewModel().getSelectedFunctionBreakpoint()) {
                    this.debugService.getViewModel().setSelectedFunctionBreakpoint(element);
                    this.onBreakpointsChange();
                }
            }));
            this.list.splice(0, this.list.length, this.elements);
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.onBreakpointsChange();
                }
            }));
        }
        focus() {
            super.focus();
            if (this.list) {
                this.list.domFocus();
            }
        }
        layoutBody(height, width) {
            if (this.list) {
                this.list.layout(height, width);
            }
        }
        onListContextMenu(e) {
            if (!e.element) {
                return;
            }
            const actions = [];
            const element = e.element;
            const breakpointType = element instanceof debugModel_1.Breakpoint && element.logMessage ? nls.localize('Logpoint', "Logpoint") : nls.localize('Breakpoint', "Breakpoint");
            if (element instanceof debugModel_1.Breakpoint || element instanceof debugModel_1.FunctionBreakpoint) {
                actions.push(new actions_1.Action('workbench.action.debug.openEditorAndEditBreakpoint', nls.localize('editBreakpoint', "Edit {0}...", breakpointType), '', true, async () => {
                    if (element instanceof debugModel_1.Breakpoint) {
                        const editor = await openBreakpointSource(element, false, false, this.debugService, this.editorService);
                        if (editor) {
                            const codeEditor = editor.getControl();
                            if (editorBrowser_1.isCodeEditor(codeEditor)) {
                                codeEditor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID).showBreakpointWidget(element.lineNumber, element.column);
                            }
                        }
                    }
                    else {
                        this.debugService.getViewModel().setSelectedFunctionBreakpoint(element);
                        this.onBreakpointsChange();
                    }
                }));
                actions.push(new actionbar_1.Separator());
            }
            actions.push(new debugActions_1.RemoveBreakpointAction(debugActions_1.RemoveBreakpointAction.ID, nls.localize('removeBreakpoint', "Remove {0}", breakpointType), this.debugService));
            if (this.debugService.getModel().getBreakpoints().length + this.debugService.getModel().getFunctionBreakpoints().length > 1) {
                actions.push(new debugActions_1.RemoveAllBreakpointsAction(debugActions_1.RemoveAllBreakpointsAction.ID, debugActions_1.RemoveAllBreakpointsAction.LABEL, this.debugService, this.keybindingService));
                actions.push(new actionbar_1.Separator());
                actions.push(new debugActions_1.EnableAllBreakpointsAction(debugActions_1.EnableAllBreakpointsAction.ID, debugActions_1.EnableAllBreakpointsAction.LABEL, this.debugService, this.keybindingService));
                actions.push(new debugActions_1.DisableAllBreakpointsAction(debugActions_1.DisableAllBreakpointsAction.ID, debugActions_1.DisableAllBreakpointsAction.LABEL, this.debugService, this.keybindingService));
            }
            actions.push(new actionbar_1.Separator());
            actions.push(new debugActions_1.ReapplyBreakpointsAction(debugActions_1.ReapplyBreakpointsAction.ID, debugActions_1.ReapplyBreakpointsAction.LABEL, this.debugService, this.keybindingService));
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => element,
                onHide: () => lifecycle_1.dispose(actions)
            });
        }
        getActions() {
            return [
                new debugActions_1.AddFunctionBreakpointAction(debugActions_1.AddFunctionBreakpointAction.ID, debugActions_1.AddFunctionBreakpointAction.LABEL, this.debugService, this.keybindingService),
                new debugActions_1.ToggleBreakpointsActivatedAction(debugActions_1.ToggleBreakpointsActivatedAction.ID, debugActions_1.ToggleBreakpointsActivatedAction.ACTIVATE_LABEL, this.debugService, this.keybindingService),
                new debugActions_1.RemoveAllBreakpointsAction(debugActions_1.RemoveAllBreakpointsAction.ID, debugActions_1.RemoveAllBreakpointsAction.LABEL, this.debugService, this.keybindingService)
            ];
        }
        onBreakpointsChange() {
            if (this.isBodyVisible()) {
                this.minimumBodySize = this.getExpandedBodySize();
                if (this.maximumBodySize < Number.POSITIVE_INFINITY) {
                    this.maximumBodySize = this.minimumBodySize;
                }
                if (this.list) {
                    this.list.splice(0, this.list.length, this.elements);
                    this.needsRefresh = false;
                }
            }
            else {
                this.needsRefresh = true;
            }
        }
        get elements() {
            const model = this.debugService.getModel();
            const elements = model.getExceptionBreakpoints().concat(model.getFunctionBreakpoints()).concat(model.getDataBreakpoints()).concat(model.getBreakpoints());
            return elements;
        }
        getExpandedBodySize() {
            const model = this.debugService.getModel();
            const length = model.getBreakpoints().length + model.getExceptionBreakpoints().length + model.getFunctionBreakpoints().length + model.getDataBreakpoints().length;
            return Math.min(BreakpointsView.MAX_VISIBLE_FILES, length) * 22;
        }
    };
    BreakpointsView.MAX_VISIBLE_FILES = 9;
    BreakpointsView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, themeService_1.IThemeService),
        __param(6, editorService_1.IEditorService),
        __param(7, contextView_1.IContextViewService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, contextkey_1.IContextKeyService)
    ], BreakpointsView);
    exports.BreakpointsView = BreakpointsView;
    class BreakpointsDelegate {
        constructor(debugService) {
            this.debugService = debugService;
            // noop
        }
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof debugModel_1.Breakpoint) {
                return BreakpointsRenderer.ID;
            }
            if (element instanceof debugModel_1.FunctionBreakpoint) {
                const selected = this.debugService.getViewModel().getSelectedFunctionBreakpoint();
                if (!element.name || (selected && selected.getId() === element.getId())) {
                    return FunctionBreakpointInputRenderer.ID;
                }
                return FunctionBreakpointsRenderer.ID;
            }
            if (element instanceof debugModel_1.ExceptionBreakpoint) {
                return ExceptionBreakpointsRenderer.ID;
            }
            if (element instanceof debugModel_1.DataBreakpoint) {
                return DataBreakpointsRenderer.ID;
            }
            return '';
        }
    }
    let BreakpointsRenderer = class BreakpointsRenderer {
        constructor(debugService, labelService) {
            this.debugService = debugService;
            this.labelService = labelService;
            // noop
        }
        get templateId() {
            return BreakpointsRenderer.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.breakpoint = dom.append(container, $('.breakpoint'));
            data.icon = $('.icon');
            data.checkbox = createCheckbox();
            data.toDispose = [];
            data.toDispose.push(dom.addStandardDisposableListener(data.checkbox, 'change', (e) => {
                this.debugService.enableOrDisableBreakpoints(!data.context.enabled, data.context);
            }));
            dom.append(data.breakpoint, data.icon);
            dom.append(data.breakpoint, data.checkbox);
            data.name = dom.append(data.breakpoint, $('span.name'));
            data.filePath = dom.append(data.breakpoint, $('span.file-path'));
            const lineNumberContainer = dom.append(data.breakpoint, $('.line-number-container'));
            data.lineNumber = dom.append(lineNumberContainer, $('span.line-number'));
            return data;
        }
        renderElement(breakpoint, index, data) {
            data.context = breakpoint;
            dom.toggleClass(data.breakpoint, 'disabled', !this.debugService.getModel().areBreakpointsActivated());
            data.name.textContent = resources.basenameOrAuthority(breakpoint.uri);
            data.lineNumber.textContent = breakpoint.lineNumber.toString();
            if (breakpoint.column) {
                data.lineNumber.textContent += `:${breakpoint.column}`;
            }
            data.filePath.textContent = this.labelService.getUriLabel(resources.dirname(breakpoint.uri), { relative: true });
            data.checkbox.checked = breakpoint.enabled;
            const { message, className } = getBreakpointMessageAndClassName(this.debugService, breakpoint);
            data.icon.className = className + ' icon';
            data.breakpoint.title = breakpoint.message || message || '';
            const debugActive = this.debugService.state === 3 /* Running */ || this.debugService.state === 2 /* Stopped */;
            if (debugActive && !breakpoint.verified) {
                dom.addClass(data.breakpoint, 'disabled');
            }
        }
        disposeTemplate(templateData) {
            lifecycle_1.dispose(templateData.toDispose);
        }
    };
    BreakpointsRenderer.ID = 'breakpoints';
    BreakpointsRenderer = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, label_1.ILabelService)
    ], BreakpointsRenderer);
    class ExceptionBreakpointsRenderer {
        constructor(debugService) {
            this.debugService = debugService;
            // noop
        }
        get templateId() {
            return ExceptionBreakpointsRenderer.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.breakpoint = dom.append(container, $('.breakpoint'));
            data.checkbox = createCheckbox();
            data.toDispose = [];
            data.toDispose.push(dom.addStandardDisposableListener(data.checkbox, 'change', (e) => {
                this.debugService.enableOrDisableBreakpoints(!data.context.enabled, data.context);
            }));
            dom.append(data.breakpoint, data.checkbox);
            data.name = dom.append(data.breakpoint, $('span.name'));
            dom.addClass(data.breakpoint, 'exception');
            return data;
        }
        renderElement(exceptionBreakpoint, index, data) {
            data.context = exceptionBreakpoint;
            data.name.textContent = exceptionBreakpoint.label || `${exceptionBreakpoint.filter} exceptions`;
            data.breakpoint.title = data.name.textContent;
            data.checkbox.checked = exceptionBreakpoint.enabled;
        }
        disposeTemplate(templateData) {
            lifecycle_1.dispose(templateData.toDispose);
        }
    }
    ExceptionBreakpointsRenderer.ID = 'exceptionbreakpoints';
    let FunctionBreakpointsRenderer = class FunctionBreakpointsRenderer {
        constructor(debugService) {
            this.debugService = debugService;
            // noop
        }
        get templateId() {
            return FunctionBreakpointsRenderer.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.breakpoint = dom.append(container, $('.breakpoint'));
            data.icon = $('.icon');
            data.checkbox = createCheckbox();
            data.toDispose = [];
            data.toDispose.push(dom.addStandardDisposableListener(data.checkbox, 'change', (e) => {
                this.debugService.enableOrDisableBreakpoints(!data.context.enabled, data.context);
            }));
            dom.append(data.breakpoint, data.icon);
            dom.append(data.breakpoint, data.checkbox);
            data.name = dom.append(data.breakpoint, $('span.name'));
            return data;
        }
        renderElement(functionBreakpoint, index, data) {
            data.context = functionBreakpoint;
            data.name.textContent = functionBreakpoint.name;
            const { className, message } = getBreakpointMessageAndClassName(this.debugService, functionBreakpoint);
            data.icon.className = className + ' icon';
            data.icon.title = message ? message : '';
            data.checkbox.checked = functionBreakpoint.enabled;
            data.breakpoint.title = message ? message : '';
            // Mark function breakpoints as disabled if deactivated or if debug type does not support them #9099
            const session = this.debugService.getViewModel().focusedSession;
            dom.toggleClass(data.breakpoint, 'disabled', (session && !session.capabilities.supportsFunctionBreakpoints) || !this.debugService.getModel().areBreakpointsActivated());
            if (session && !session.capabilities.supportsFunctionBreakpoints) {
                data.breakpoint.title = nls.localize('functionBreakpointsNotSupported', "Function breakpoints are not supported by this debug type");
            }
        }
        disposeTemplate(templateData) {
            lifecycle_1.dispose(templateData.toDispose);
        }
    };
    FunctionBreakpointsRenderer.ID = 'functionbreakpoints';
    FunctionBreakpointsRenderer = __decorate([
        __param(0, debug_1.IDebugService)
    ], FunctionBreakpointsRenderer);
    let DataBreakpointsRenderer = class DataBreakpointsRenderer {
        constructor(debugService) {
            this.debugService = debugService;
            // noop
        }
        get templateId() {
            return DataBreakpointsRenderer.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.breakpoint = dom.append(container, $('.breakpoint'));
            data.icon = $('.icon');
            data.checkbox = createCheckbox();
            data.toDispose = [];
            data.toDispose.push(dom.addStandardDisposableListener(data.checkbox, 'change', (e) => {
                this.debugService.enableOrDisableBreakpoints(!data.context.enabled, data.context);
            }));
            dom.append(data.breakpoint, data.icon);
            dom.append(data.breakpoint, data.checkbox);
            data.name = dom.append(data.breakpoint, $('span.name'));
            return data;
        }
        renderElement(dataBreakpoint, index, data) {
            data.context = dataBreakpoint;
            data.name.textContent = dataBreakpoint.label;
            const { className, message } = getBreakpointMessageAndClassName(this.debugService, dataBreakpoint);
            data.icon.className = className + ' icon';
            data.icon.title = message ? message : '';
            data.checkbox.checked = dataBreakpoint.enabled;
            data.breakpoint.title = message ? message : '';
            // Mark function breakpoints as disabled if deactivated or if debug type does not support them #9099
            const session = this.debugService.getViewModel().focusedSession;
            dom.toggleClass(data.breakpoint, 'disabled', (session && !session.capabilities.supportsDataBreakpoints) || !this.debugService.getModel().areBreakpointsActivated());
            if (session && !session.capabilities.supportsDataBreakpoints) {
                data.breakpoint.title = nls.localize('dataBreakpointsNotSupported', "Data breakpoints are not supported by this debug type");
            }
        }
        disposeTemplate(templateData) {
            lifecycle_1.dispose(templateData.toDispose);
        }
    };
    DataBreakpointsRenderer.ID = 'databreakpoints';
    DataBreakpointsRenderer = __decorate([
        __param(0, debug_1.IDebugService)
    ], DataBreakpointsRenderer);
    class FunctionBreakpointInputRenderer {
        constructor(debugService, contextViewService, themeService) {
            this.debugService = debugService;
            this.contextViewService = contextViewService;
            this.themeService = themeService;
            // noop
        }
        get templateId() {
            return FunctionBreakpointInputRenderer.ID;
        }
        renderTemplate(container) {
            const template = Object.create(null);
            const breakpoint = dom.append(container, $('.breakpoint'));
            template.icon = $('.icon');
            template.checkbox = createCheckbox();
            dom.append(breakpoint, template.icon);
            dom.append(breakpoint, template.checkbox);
            const inputBoxContainer = dom.append(breakpoint, $('.inputBoxContainer'));
            const inputBox = new inputBox_1.InputBox(inputBoxContainer, this.contextViewService, {
                placeholder: nls.localize('functionBreakpointPlaceholder', "Function to break on"),
                ariaLabel: nls.localize('functionBreakPointInputAriaLabel', "Type function breakpoint")
            });
            const styler = styler_1.attachInputBoxStyler(inputBox, this.themeService);
            const toDispose = [inputBox, styler];
            const wrapUp = (renamed) => {
                if (!template.reactedOnEvent) {
                    template.reactedOnEvent = true;
                    this.debugService.getViewModel().setSelectedFunctionBreakpoint(undefined);
                    if (inputBox.value && (renamed || template.breakpoint.name)) {
                        this.debugService.renameFunctionBreakpoint(template.breakpoint.getId(), renamed ? inputBox.value : template.breakpoint.name);
                    }
                    else {
                        this.debugService.removeFunctionBreakpoints(template.breakpoint.getId());
                    }
                }
            };
            toDispose.push(dom.addStandardDisposableListener(inputBox.inputElement, 'keydown', (e) => {
                const isEscape = e.equals(9 /* Escape */);
                const isEnter = e.equals(3 /* Enter */);
                if (isEscape || isEnter) {
                    e.preventDefault();
                    e.stopPropagation();
                    wrapUp(isEnter);
                }
            }));
            toDispose.push(dom.addDisposableListener(inputBox.inputElement, 'blur', () => {
                // Need to react with a timeout on the blur event due to possible concurent splices #56443
                setTimeout(() => {
                    if (!template.breakpoint.name) {
                        wrapUp(true);
                    }
                });
            }));
            template.inputBox = inputBox;
            template.toDispose = toDispose;
            return template;
        }
        renderElement(functionBreakpoint, index, data) {
            data.breakpoint = functionBreakpoint;
            data.reactedOnEvent = false;
            const { className, message } = getBreakpointMessageAndClassName(this.debugService, functionBreakpoint);
            data.icon.className = className + ' icon';
            data.icon.title = message ? message : '';
            data.checkbox.checked = functionBreakpoint.enabled;
            data.checkbox.disabled = true;
            data.inputBox.value = functionBreakpoint.name || '';
            setTimeout(() => {
                data.inputBox.focus();
                data.inputBox.select();
            }, 0);
        }
        disposeTemplate(templateData) {
            lifecycle_1.dispose(templateData.toDispose);
        }
    }
    FunctionBreakpointInputRenderer.ID = 'functionbreakpointinput';
    function openBreakpointSource(breakpoint, sideBySide, preserveFocus, debugService, editorService) {
        if (breakpoint.uri.scheme === debug_1.DEBUG_SCHEME && debugService.state === 0 /* Inactive */) {
            return Promise.resolve(undefined);
        }
        const selection = breakpoint.endLineNumber ? {
            startLineNumber: breakpoint.lineNumber,
            endLineNumber: breakpoint.endLineNumber,
            startColumn: breakpoint.column || 1,
            endColumn: breakpoint.endColumn || 1073741824 /* MAX_SAFE_SMALL_INTEGER */
        } : {
            startLineNumber: breakpoint.lineNumber,
            startColumn: breakpoint.column || 1,
            endLineNumber: breakpoint.lineNumber,
            endColumn: breakpoint.column || 1073741824 /* MAX_SAFE_SMALL_INTEGER */
        };
        return editorService.openEditor({
            resource: breakpoint.uri,
            options: {
                preserveFocus,
                selection,
                revealIfOpened: true,
                revealInCenterIfOutsideViewport: true,
                pinned: !preserveFocus
            }
        }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
    }
    exports.openBreakpointSource = openBreakpointSource;
    function getBreakpointMessageAndClassName(debugService, breakpoint) {
        const state = debugService.state;
        const debugActive = state === 3 /* Running */ || state === 2 /* Stopped */;
        if (!breakpoint.enabled || !debugService.getModel().areBreakpointsActivated()) {
            return {
                className: breakpoint instanceof debugModel_1.DataBreakpoint ? 'debug-data-breakpoint-disabled' : breakpoint instanceof debugModel_1.FunctionBreakpoint ? 'debug-function-breakpoint-disabled' : breakpoint.logMessage ? 'debug-breakpoint-log-disabled' : 'debug-breakpoint-disabled',
                message: breakpoint.logMessage ? nls.localize('disabledLogpoint', "Disabled Logpoint") : nls.localize('disabledBreakpoint', "Disabled Breakpoint"),
            };
        }
        const appendMessage = (text) => {
            return !(breakpoint instanceof debugModel_1.FunctionBreakpoint) && !(breakpoint instanceof debugModel_1.DataBreakpoint) && breakpoint.message ? text.concat(', ' + breakpoint.message) : text;
        };
        if (debugActive && !breakpoint.verified) {
            return {
                className: breakpoint instanceof debugModel_1.DataBreakpoint ? 'debug-data-breakpoint-unverified' : breakpoint instanceof debugModel_1.FunctionBreakpoint ? 'debug-function-breakpoint-unverified' : breakpoint.logMessage ? 'debug-breakpoint-log-unverified' : 'debug-breakpoint-unverified',
                message: breakpoint.message || (breakpoint.logMessage ? nls.localize('unverifiedLogpoint', "Unverified Logpoint") : nls.localize('unverifiedBreakopint', "Unverified Breakpoint")),
            };
        }
        if (breakpoint instanceof debugModel_1.FunctionBreakpoint) {
            if (!breakpoint.supported) {
                return {
                    className: 'debug-function-breakpoint-unverified',
                    message: nls.localize('functionBreakpointUnsupported', "Function breakpoints not supported by this debug type"),
                };
            }
            return {
                className: 'debug-function-breakpoint',
                message: breakpoint.message || nls.localize('functionBreakpoint', "Function Breakpoint")
            };
        }
        if (breakpoint instanceof debugModel_1.DataBreakpoint) {
            if (!breakpoint.supported) {
                return {
                    className: 'debug-data-breakpoint-unverified',
                    message: nls.localize('dataBreakpointUnsupported', "Data breakpoints not supported by this debug type"),
                };
            }
            return {
                className: 'debug-data-breakpoint',
                message: breakpoint.message || nls.localize('dataBreakpoint', "Data Breakpoint")
            };
        }
        if (breakpoint.logMessage || breakpoint.condition || breakpoint.hitCondition) {
            const messages = [];
            if (!breakpoint.supported) {
                return {
                    className: 'debug-breakpoint-unsupported',
                    message: nls.localize('breakpointUnsupported', "Breakpoints of this type are not supported by the debugger"),
                };
            }
            if (breakpoint.logMessage) {
                messages.push(nls.localize('logMessage', "Log Message: {0}", breakpoint.logMessage));
            }
            if (breakpoint.condition) {
                messages.push(nls.localize('expression', "Expression: {0}", breakpoint.condition));
            }
            if (breakpoint.hitCondition) {
                messages.push(nls.localize('hitCount', "Hit Count: {0}", breakpoint.hitCondition));
            }
            return {
                className: breakpoint.logMessage ? 'debug-breakpoint-log' : 'debug-breakpoint-conditional',
                message: appendMessage(messages.join('\n'))
            };
        }
        const focusedThread = debugService.getViewModel().focusedThread;
        if (focusedThread) {
            const callStack = focusedThread ? focusedThread.getCallStack() : undefined;
            const topStackFrame = callStack ? callStack[0] : undefined;
            if (topStackFrame && topStackFrame.source.uri.toString() === breakpoint.uri.toString() && topStackFrame.range.startLineNumber === breakpoint.lineNumber) {
                if (topStackFrame.range.startColumn === breakpoint.column) {
                    return {
                        className: 'debug-breakpoint-and-top-stack-frame-at-column',
                        message: breakpoint.message || nls.localize('breakpoint', "Breakpoint")
                    };
                }
                else if (breakpoint.column === undefined) {
                    return {
                        className: 'debug-breakpoint-and-top-stack-frame',
                        message: breakpoint.message || nls.localize('breakpoint', "Breakpoint")
                    };
                }
            }
        }
        return {
            className: 'debug-breakpoint',
            message: breakpoint.message || nls.localize('breakpoint', "Breakpoint")
        };
    }
    exports.getBreakpointMessageAndClassName = getBreakpointMessageAndClassName;
});
//# sourceMappingURL=breakpointsView.js.map