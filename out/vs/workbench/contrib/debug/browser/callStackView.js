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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/browser/dom", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/base/common/actions", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/parts/views/panelViewlet", "vs/platform/label/common/label", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/list/browser/listService", "vs/base/common/errors", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/filters", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/contrib/debug/common/debugUtils", "vs/workbench/contrib/debug/browser/debugCommands", "vs/platform/commands/common/commands", "vs/workbench/browser/viewlet"], function (require, exports, nls, async_1, dom, debug_1, debugModel_1, contextView_1, instantiation_1, actions_1, keybinding_1, baseDebugView_1, actions_2, editorService_1, configuration_1, contextkey_1, panelViewlet_1, label_1, menuEntryActionViewItem_1, listService_1, errors_1, highlightedLabel_1, filters_1, event_1, lifecycle_1, actionbar_1, debugUtils_1, debugCommands_1, commands_1, viewlet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    let CallStackView = class CallStackView extends panelViewlet_1.ViewletPanel {
        constructor(options, contextMenuService, debugService, keybindingService, instantiationService, editorService, configurationService, menuService, contextKeyService) {
            super(Object.assign(Object.assign({}, options), { ariaHeaderLabel: nls.localize('callstackSection', "Call Stack Section") }), keybindingService, contextMenuService, configurationService, contextKeyService);
            this.options = options;
            this.debugService = debugService;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.contextKeyService = contextKeyService;
            this.needsRefresh = false;
            this.ignoreSelectionChangedEvent = false;
            this.ignoreFocusStackFrameEvent = false;
            this.parentSessionToExpand = new Set();
            this.selectionNeedsUpdate = false;
            this.callStackItemType = debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.bindTo(contextKeyService);
            this.contributedContextMenu = menuService.createMenu(2 /* DebugCallStackContext */, contextKeyService);
            this._register(this.contributedContextMenu);
            // Create scheduler to prevent unnecessary flashing of tree when reacting to changes
            this.onCallStackChangeScheduler = new async_1.RunOnceScheduler(() => {
                // Only show the global pause message if we do not display threads.
                // Otherwise there will be a pause message per thread and there is no need for a global one.
                const sessions = this.debugService.getModel().getSessions();
                const thread = sessions.length === 1 && sessions[0].getAllThreads().length === 1 ? sessions[0].getAllThreads()[0] : undefined;
                if (thread && thread.stoppedDetails) {
                    this.pauseMessageLabel.textContent = thread.stoppedDetails.description || nls.localize('debugStopped', "Paused on {0}", thread.stoppedDetails.reason || '');
                    this.pauseMessageLabel.title = thread.stoppedDetails.text || '';
                    dom.toggleClass(this.pauseMessageLabel, 'exception', thread.stoppedDetails.reason === 'exception');
                    this.pauseMessage.hidden = false;
                    if (this.toolbar) {
                        this.toolbar.setActions([])();
                    }
                }
                else {
                    this.pauseMessage.hidden = true;
                    if (this.toolbar) {
                        const collapseAction = new viewlet_1.CollapseAction(this.tree, true, 'explorer-action codicon-collapse-all');
                        this.toolbar.setActions([collapseAction])();
                    }
                }
                this.needsRefresh = false;
                this.dataSource.deemphasizedStackFramesToShow = [];
                this.tree.updateChildren().then(() => {
                    this.parentSessionToExpand.forEach(s => this.tree.expand(s));
                    this.parentSessionToExpand.clear();
                    if (this.selectionNeedsUpdate) {
                        this.selectionNeedsUpdate = false;
                        this.updateTreeSelection();
                    }
                });
            }, 50);
        }
        renderHeaderTitle(container) {
            const titleContainer = dom.append(container, $('.debug-call-stack-title'));
            super.renderHeaderTitle(titleContainer, this.options.title);
            this.pauseMessage = dom.append(titleContainer, $('span.pause-message'));
            this.pauseMessage.hidden = true;
            this.pauseMessageLabel = dom.append(this.pauseMessage, $('span.label'));
        }
        renderBody(container) {
            dom.addClass(container, 'debug-call-stack');
            const treeContainer = baseDebugView_1.renderViewTree(container);
            this.dataSource = new CallStackDataSource(this.debugService);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'CallStackView', treeContainer, new CallStackDelegate(), [
                new SessionsRenderer(this.instantiationService),
                new ThreadsRenderer(this.instantiationService),
                this.instantiationService.createInstance(StackFramesRenderer),
                new ErrorsRenderer(),
                new LoadMoreRenderer(),
                new ShowMoreRenderer()
            ], this.dataSource, {
                accessibilityProvider: new CallStackAccessibilityProvider(),
                ariaLabel: nls.localize({ comment: ['Debug is a noun in this context, not a verb.'], key: 'callStackAriaLabel' }, "Debug Call Stack"),
                identityProvider: {
                    getId: (element) => {
                        if (typeof element === 'string') {
                            return element;
                        }
                        if (element instanceof Array) {
                            return `showMore ${element[0].getId()}`;
                        }
                        return element.getId();
                    }
                },
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (e) => {
                        if (isDebugSession(e)) {
                            return e.getLabel();
                        }
                        if (e instanceof debugModel_1.Thread) {
                            return `${e.name} ${e.stateLabel}`;
                        }
                        if (e instanceof debugModel_1.StackFrame || typeof e === 'string') {
                            return e;
                        }
                        if (e instanceof debugModel_1.ThreadAndSessionIds) {
                            return LoadMoreRenderer.LABEL;
                        }
                        return nls.localize('showMoreStackFrames2', "Show More Stack Frames");
                    }
                },
                expandOnlyOnTwistieClick: true
            });
            this.tree.setInput(this.debugService.getModel()).then(undefined, errors_1.onUnexpectedError);
            const callstackNavigator = new listService_1.TreeResourceNavigator2(this.tree);
            this._register(callstackNavigator);
            this._register(callstackNavigator.onDidOpenResource(e => {
                if (this.ignoreSelectionChangedEvent) {
                    return;
                }
                const focusStackFrame = (stackFrame, thread, session) => {
                    this.ignoreFocusStackFrameEvent = true;
                    try {
                        this.debugService.focusStackFrame(stackFrame, thread, session, true);
                    }
                    finally {
                        this.ignoreFocusStackFrameEvent = false;
                    }
                };
                const element = e.element;
                if (element instanceof debugModel_1.StackFrame) {
                    focusStackFrame(element, element.thread, element.thread.session);
                    element.openInEditor(this.editorService, e.editorOptions.preserveFocus, e.sideBySide, e.editorOptions.pinned);
                }
                if (element instanceof debugModel_1.Thread) {
                    focusStackFrame(undefined, element, element.session);
                }
                if (isDebugSession(element)) {
                    focusStackFrame(undefined, undefined, element);
                }
                if (element instanceof debugModel_1.ThreadAndSessionIds) {
                    const session = this.debugService.getModel().getSession(element.sessionId);
                    const thread = session && session.getThread(element.threadId);
                    if (thread) {
                        thread.fetchCallStack()
                            .then(() => this.tree.updateChildren());
                    }
                }
                if (element instanceof Array) {
                    this.dataSource.deemphasizedStackFramesToShow.push(...element);
                    this.tree.updateChildren();
                }
            }));
            this._register(this.debugService.getModel().onDidChangeCallStack(() => {
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    return;
                }
                if (!this.onCallStackChangeScheduler.isScheduled()) {
                    this.onCallStackChangeScheduler.schedule();
                }
            }));
            const onFocusChange = event_1.Event.any(this.debugService.getViewModel().onDidFocusStackFrame, this.debugService.getViewModel().onDidFocusSession);
            this._register(onFocusChange(() => {
                if (this.ignoreFocusStackFrameEvent) {
                    return;
                }
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    return;
                }
                if (this.onCallStackChangeScheduler.isScheduled()) {
                    this.selectionNeedsUpdate = true;
                    return;
                }
                this.updateTreeSelection();
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            // Schedule the update of the call stack tree if the viewlet is opened after a session started #14684
            if (this.debugService.state === 2 /* Stopped */) {
                this.onCallStackChangeScheduler.schedule(0);
            }
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.onCallStackChangeScheduler.schedule();
                }
            }));
            this._register(this.debugService.onDidNewSession(s => {
                this._register(s.onDidChangeName(() => this.tree.rerender(s)));
                if (s.parentSession) {
                    // Auto expand sessions that have sub sessions
                    this.parentSessionToExpand.add(s.parentSession);
                }
            }));
        }
        layoutBody(height, width) {
            this.tree.layout(height, width);
        }
        focus() {
            this.tree.domFocus();
        }
        updateTreeSelection() {
            if (!this.tree || !this.tree.getInput()) {
                // Tree not initialized yet
                return;
            }
            const updateSelectionAndReveal = (element) => {
                this.ignoreSelectionChangedEvent = true;
                try {
                    this.tree.setSelection([element]);
                    this.tree.reveal(element);
                }
                catch (e) { }
                finally {
                    this.ignoreSelectionChangedEvent = false;
                }
            };
            const thread = this.debugService.getViewModel().focusedThread;
            const session = this.debugService.getViewModel().focusedSession;
            const stackFrame = this.debugService.getViewModel().focusedStackFrame;
            if (!thread) {
                if (!session) {
                    this.tree.setSelection([]);
                }
                else {
                    updateSelectionAndReveal(session);
                }
            }
            else {
                const expandPromises = [() => async_1.ignoreErrors(this.tree.expand(thread))];
                let s = thread.session;
                while (s) {
                    const sessionToExpand = s;
                    expandPromises.push(() => async_1.ignoreErrors(this.tree.expand(sessionToExpand)));
                    s = s.parentSession;
                }
                async_1.sequence(expandPromises.reverse()).then(() => {
                    const toReveal = stackFrame || session;
                    if (toReveal) {
                        updateSelectionAndReveal(toReveal);
                    }
                });
            }
        }
        onContextMenu(e) {
            const element = e.element;
            if (isDebugSession(element)) {
                this.callStackItemType.set('session');
            }
            else if (element instanceof debugModel_1.Thread) {
                this.callStackItemType.set('thread');
            }
            else if (element instanceof debugModel_1.StackFrame) {
                this.callStackItemType.set('stackFrame');
            }
            else {
                this.callStackItemType.reset();
            }
            const actions = [];
            const actionsDisposable = menuEntryActionViewItem_1.createAndFillInContextMenuActions(this.contributedContextMenu, { arg: this.getContextForContributedActions(element), shouldForwardArgs: true }, actions, this.contextMenuService);
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => element && element instanceof debugModel_1.StackFrame ? element.getId() : undefined,
                onHide: () => lifecycle_1.dispose(actionsDisposable)
            });
        }
        getContextForContributedActions(element) {
            if (element instanceof debugModel_1.StackFrame) {
                if (element.source.inMemory) {
                    return element.source.raw.path || element.source.reference || '';
                }
                return element.source.uri.toString();
            }
            if (element instanceof debugModel_1.Thread) {
                return element.threadId;
            }
            if (isDebugSession(element)) {
                return element.getId();
            }
            return '';
        }
    };
    CallStackView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, editorService_1.IEditorService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, actions_1.IMenuService),
        __param(8, contextkey_1.IContextKeyService)
    ], CallStackView);
    exports.CallStackView = CallStackView;
    class SessionsRenderer {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
        }
        get templateId() {
            return SessionsRenderer.ID;
        }
        renderTemplate(container) {
            const session = dom.append(container, $('.session'));
            const name = dom.append(session, $('.name'));
            const state = dom.append(session, $('.state'));
            const stateLabel = dom.append(state, $('span.label'));
            const label = new highlightedLabel_1.HighlightedLabel(name, false);
            const actionBar = new actionbar_1.ActionBar(session);
            return { session, name, state, stateLabel, label, actionBar };
        }
        renderElement(element, _, data) {
            const session = element.element;
            data.session.title = nls.localize({ key: 'session', comment: ['Session is a noun'] }, "Session");
            data.label.set(session.getLabel(), filters_1.createMatches(element.filterData));
            const stoppedThread = session.getAllThreads().filter(t => t.stopped).pop();
            data.actionBar.clear();
            const actions = getActions(this.instantiationService, element.element);
            data.actionBar.push(actions, { icon: true, label: false });
            data.stateLabel.textContent = stoppedThread ? nls.localize('paused', "Paused")
                : nls.localize({ key: 'running', comment: ['indicates state'] }, "Running");
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
    }
    SessionsRenderer.ID = 'session';
    class ThreadsRenderer {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
        }
        get templateId() {
            return ThreadsRenderer.ID;
        }
        renderTemplate(container) {
            const thread = dom.append(container, $('.thread'));
            const name = dom.append(thread, $('.name'));
            const state = dom.append(thread, $('.state'));
            const stateLabel = dom.append(state, $('span.label'));
            const label = new highlightedLabel_1.HighlightedLabel(name, false);
            const actionBar = new actionbar_1.ActionBar(thread);
            return { thread, name, state, stateLabel, label, actionBar };
        }
        renderElement(element, index, data) {
            const thread = element.element;
            data.thread.title = nls.localize('thread', "Thread");
            data.label.set(thread.name, filters_1.createMatches(element.filterData));
            data.stateLabel.textContent = thread.stateLabel;
            data.actionBar.clear();
            const actions = getActions(this.instantiationService, thread);
            data.actionBar.push(actions, { icon: true, label: false });
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
    }
    ThreadsRenderer.ID = 'thread';
    let StackFramesRenderer = class StackFramesRenderer {
        constructor(labelService) {
            this.labelService = labelService;
        }
        get templateId() {
            return StackFramesRenderer.ID;
        }
        renderTemplate(container) {
            const stackFrame = dom.append(container, $('.stack-frame'));
            const labelDiv = dom.append(stackFrame, $('span.label.expression'));
            const file = dom.append(stackFrame, $('.file'));
            const fileName = dom.append(file, $('span.file-name'));
            const wrapper = dom.append(file, $('span.line-number-wrapper'));
            const lineNumber = dom.append(wrapper, $('span.line-number'));
            const label = new highlightedLabel_1.HighlightedLabel(labelDiv, false);
            return { file, fileName, label, lineNumber, stackFrame };
        }
        renderElement(element, index, data) {
            const stackFrame = element.element;
            dom.toggleClass(data.stackFrame, 'disabled', !stackFrame.source || !stackFrame.source.available || isDeemphasized(stackFrame));
            dom.toggleClass(data.stackFrame, 'label', stackFrame.presentationHint === 'label');
            dom.toggleClass(data.stackFrame, 'subtle', stackFrame.presentationHint === 'subtle');
            data.file.title = stackFrame.source.inMemory ? stackFrame.source.uri.path : this.labelService.getUriLabel(stackFrame.source.uri);
            if (stackFrame.source.raw.origin) {
                data.file.title += `\n${stackFrame.source.raw.origin}`;
            }
            data.label.set(stackFrame.name, filters_1.createMatches(element.filterData), stackFrame.name);
            data.fileName.textContent = stackFrame.getSpecificSourceName();
            if (stackFrame.range.startLineNumber !== undefined) {
                data.lineNumber.textContent = `${stackFrame.range.startLineNumber}`;
                if (stackFrame.range.startColumn) {
                    data.lineNumber.textContent += `:${stackFrame.range.startColumn}`;
                }
                dom.removeClass(data.lineNumber, 'unavailable');
            }
            else {
                dom.addClass(data.lineNumber, 'unavailable');
            }
        }
        disposeTemplate(templateData) {
            // noop
        }
    };
    StackFramesRenderer.ID = 'stackFrame';
    StackFramesRenderer = __decorate([
        __param(0, label_1.ILabelService)
    ], StackFramesRenderer);
    class ErrorsRenderer {
        get templateId() {
            return ErrorsRenderer.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, $('.error'));
            return { label };
        }
        renderElement(element, index, data) {
            const error = element.element;
            data.label.textContent = error;
            data.label.title = error;
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    ErrorsRenderer.ID = 'error';
    class LoadMoreRenderer {
        get templateId() {
            return LoadMoreRenderer.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, $('.load-more'));
            return { label };
        }
        renderElement(element, index, data) {
            data.label.textContent = LoadMoreRenderer.LABEL;
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    LoadMoreRenderer.ID = 'loadMore';
    LoadMoreRenderer.LABEL = nls.localize('loadMoreStackFrames', "Load More Stack Frames");
    class ShowMoreRenderer {
        get templateId() {
            return ShowMoreRenderer.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, $('.show-more'));
            return { label };
        }
        renderElement(element, index, data) {
            const stackFrames = element.element;
            if (stackFrames.every(sf => !!(sf.source && sf.source.origin && sf.source.origin === stackFrames[0].source.origin))) {
                data.label.textContent = nls.localize('showMoreAndOrigin', "Show {0} More: {1}", stackFrames.length, stackFrames[0].source.origin);
            }
            else {
                data.label.textContent = nls.localize('showMoreStackFrames', "Show {0} More Stack Frames", stackFrames.length);
            }
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    ShowMoreRenderer.ID = 'showMore';
    class CallStackDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            if (isDebugSession(element)) {
                return SessionsRenderer.ID;
            }
            if (element instanceof debugModel_1.Thread) {
                return ThreadsRenderer.ID;
            }
            if (element instanceof debugModel_1.StackFrame) {
                return StackFramesRenderer.ID;
            }
            if (typeof element === 'string') {
                return ErrorsRenderer.ID;
            }
            if (element instanceof debugModel_1.ThreadAndSessionIds) {
                return LoadMoreRenderer.ID;
            }
            // element instanceof Array
            return ShowMoreRenderer.ID;
        }
    }
    function isDebugModel(obj) {
        return typeof obj.getSessions === 'function';
    }
    function isDebugSession(obj) {
        return obj && typeof obj.getAllThreads === 'function';
    }
    function isDeemphasized(frame) {
        return frame.source.presentationHint === 'deemphasize' || frame.presentationHint === 'deemphasize';
    }
    class CallStackDataSource {
        constructor(debugService) {
            this.debugService = debugService;
            this.deemphasizedStackFramesToShow = [];
        }
        hasChildren(element) {
            if (isDebugSession(element)) {
                const threads = element.getAllThreads();
                return (threads.length > 1) || (threads.length === 1 && threads[0].stopped) || (this.debugService.getModel().getSessions().filter(s => s.parentSession === element).length > 0);
            }
            return isDebugModel(element) || (element instanceof debugModel_1.Thread && element.stopped);
        }
        async getChildren(element) {
            if (isDebugModel(element)) {
                const sessions = element.getSessions();
                if (sessions.length === 0) {
                    return Promise.resolve([]);
                }
                if (sessions.length > 1) {
                    return Promise.resolve(sessions.filter(s => !s.parentSession));
                }
                const threads = sessions[0].getAllThreads();
                // Only show the threads in the call stack if there is more than 1 thread.
                return threads.length === 1 ? this.getThreadChildren(threads[0]) : Promise.resolve(threads);
            }
            else if (isDebugSession(element)) {
                const childSessions = this.debugService.getModel().getSessions().filter(s => s.parentSession === element);
                const threads = element.getAllThreads();
                if (threads.length === 1) {
                    // Do not show thread when there is only one to be compact.
                    const children = await this.getThreadChildren(threads[0]);
                    return children.concat(childSessions);
                }
                return Promise.resolve(threads.concat(childSessions));
            }
            else {
                return this.getThreadChildren(element);
            }
        }
        getThreadChildren(thread) {
            return this.getThreadCallstack(thread).then(children => {
                // Check if some stack frames should be hidden under a parent element since they are deemphasized
                const result = [];
                children.forEach((child, index) => {
                    if (child instanceof debugModel_1.StackFrame && child.source && isDeemphasized(child)) {
                        // Check if the user clicked to show the deemphasized source
                        if (this.deemphasizedStackFramesToShow.indexOf(child) === -1) {
                            if (result.length) {
                                const last = result[result.length - 1];
                                if (last instanceof Array) {
                                    // Collect all the stackframes that will be "collapsed"
                                    last.push(child);
                                    return;
                                }
                            }
                            const nextChild = index < children.length - 1 ? children[index + 1] : undefined;
                            if (nextChild instanceof debugModel_1.StackFrame && nextChild.source && isDeemphasized(nextChild)) {
                                // Start collecting stackframes that will be "collapsed"
                                result.push([child]);
                                return;
                            }
                        }
                    }
                    result.push(child);
                });
                return result;
            });
        }
        getThreadCallstack(thread) {
            let callStack = thread.getCallStack();
            let callStackPromise = Promise.resolve(null);
            if (!callStack || !callStack.length) {
                callStackPromise = thread.fetchCallStack().then(() => callStack = thread.getCallStack());
            }
            return callStackPromise.then(() => {
                if (callStack.length === 1 && thread.session.capabilities.supportsDelayedStackTraceLoading && thread.stoppedDetails && thread.stoppedDetails.totalFrames && thread.stoppedDetails.totalFrames > 1) {
                    // To reduce flashing of the call stack view simply append the stale call stack
                    // once we have the correct data the tree will refresh and we will no longer display it.
                    callStack = callStack.concat(thread.getStaleCallStack().slice(1));
                }
                if (thread.stoppedDetails && thread.stoppedDetails.framesErrorMessage) {
                    callStack = callStack.concat([thread.stoppedDetails.framesErrorMessage]);
                }
                if (thread.stoppedDetails && thread.stoppedDetails.totalFrames && thread.stoppedDetails.totalFrames > callStack.length && callStack.length > 1) {
                    callStack = callStack.concat([new debugModel_1.ThreadAndSessionIds(thread.session.getId(), thread.threadId)]);
                }
                return callStack;
            });
        }
    }
    class CallStackAccessibilityProvider {
        getAriaLabel(element) {
            if (element instanceof debugModel_1.Thread) {
                return nls.localize('threadAriaLabel', "Thread {0}, callstack, debug", element.name);
            }
            if (element instanceof debugModel_1.StackFrame) {
                return nls.localize('stackFrameAriaLabel', "Stack Frame {0} line {1} {2}, callstack, debug", element.name, element.range.startLineNumber, element.getSpecificSourceName());
            }
            if (isDebugSession(element)) {
                return nls.localize('sessionLabel', "Debug Session {0}", element.getLabel());
            }
            if (typeof element === 'string') {
                return element;
            }
            if (element instanceof Array) {
                return nls.localize('showMoreStackFrames', "Show {0} More Stack Frames", element.length);
            }
            // element instanceof ThreadAndSessionIds
            return nls.localize('loadMoreStackFrames', "Load More Stack Frames");
        }
    }
    function getActions(instantiationService, element) {
        const getThreadActions = (thread) => {
            return [
                thread.stopped ? instantiationService.createInstance(ContinueAction, thread) : instantiationService.createInstance(PauseAction, thread),
                instantiationService.createInstance(StepOverAction, thread),
                instantiationService.createInstance(StepIntoAction, thread),
                instantiationService.createInstance(StepOutAction, thread)
            ];
        };
        if (element instanceof debugModel_1.Thread) {
            return getThreadActions(element);
        }
        const session = element;
        const stopOrDisconectAction = debugUtils_1.isSessionAttach(session) ? instantiationService.createInstance(DisconnectAction, session) : instantiationService.createInstance(StopAction, session);
        const restartAction = instantiationService.createInstance(RestartAction, session);
        const threads = session.getAllThreads();
        if (threads.length === 1) {
            return getThreadActions(threads[0]).concat([
                restartAction,
                stopOrDisconectAction
            ]);
        }
        return [
            restartAction,
            stopOrDisconectAction
        ];
    }
    let StopAction = class StopAction extends actions_2.Action {
        constructor(session, commandService) {
            super(`action.${debugCommands_1.STOP_ID}`, debugCommands_1.STOP_LABEL, 'debug-action codicon-debug-stop');
            this.session = session;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.STOP_ID, this.session.getId(), this.session);
        }
    };
    StopAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], StopAction);
    let DisconnectAction = class DisconnectAction extends actions_2.Action {
        constructor(session, commandService) {
            super(`action.${debugCommands_1.DISCONNECT_ID}`, debugCommands_1.DISCONNECT_LABEL, 'debug-action disconnect');
            this.session = session;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.DISCONNECT_ID, this.session.getId(), this.session);
        }
    };
    DisconnectAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], DisconnectAction);
    let RestartAction = class RestartAction extends actions_2.Action {
        constructor(session, commandService) {
            super(`action.${debugCommands_1.RESTART_SESSION_ID}`, debugCommands_1.RESTART_LABEL, 'debug-action codicon-debug-restart');
            this.session = session;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.RESTART_SESSION_ID, this.session.getId(), this.session);
        }
    };
    RestartAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], RestartAction);
    let StepOverAction = class StepOverAction extends actions_2.Action {
        constructor(thread, commandService) {
            super(`action.${debugCommands_1.STEP_OVER_ID}`, debugCommands_1.STEP_OVER_LABEL, 'debug-action codicon-debug-step-over', thread.stopped);
            this.thread = thread;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.STEP_OVER_ID, this.thread.threadId, this.thread);
        }
    };
    StepOverAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], StepOverAction);
    let StepIntoAction = class StepIntoAction extends actions_2.Action {
        constructor(thread, commandService) {
            super(`action.${debugCommands_1.STEP_INTO_ID}`, debugCommands_1.STEP_INTO_LABEL, 'debug-action codicon-debug-step-into', thread.stopped);
            this.thread = thread;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.STEP_INTO_ID, this.thread.threadId, this.thread);
        }
    };
    StepIntoAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], StepIntoAction);
    let StepOutAction = class StepOutAction extends actions_2.Action {
        constructor(thread, commandService) {
            super(`action.${debugCommands_1.STEP_OUT_ID}`, debugCommands_1.STEP_OUT_LABEL, 'debug-action codicon-debug-step-out', thread.stopped);
            this.thread = thread;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.STEP_OUT_ID, this.thread.threadId, this.thread);
        }
    };
    StepOutAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], StepOutAction);
    let PauseAction = class PauseAction extends actions_2.Action {
        constructor(thread, commandService) {
            super(`action.${debugCommands_1.PAUSE_ID}`, debugCommands_1.PAUSE_LABEL, 'debug-action codicon-debug-pause', !thread.stopped);
            this.thread = thread;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.PAUSE_ID, this.thread.threadId, this.thread);
        }
    };
    PauseAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], PauseAction);
    let ContinueAction = class ContinueAction extends actions_2.Action {
        constructor(thread, commandService) {
            super(`action.${debugCommands_1.CONTINUE_ID}`, debugCommands_1.CONTINUE_LABEL, 'debug-action codicon-debug-continue', thread.stopped);
            this.thread = thread;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.CONTINUE_ID, this.thread.threadId, this.thread);
        }
    };
    ContinueAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], ContinueAction);
});
//# sourceMappingURL=callStackView.js.map