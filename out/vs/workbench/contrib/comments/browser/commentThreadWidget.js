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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/editor/contrib/markdown/markdownRenderer", "vs/editor/contrib/referenceSearch/referencesWidget", "vs/editor/contrib/zoneWidget/zoneWidget", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/comments/browser/commentFormActions", "vs/workbench/contrib/comments/browser/commentGlyphWidget", "vs/workbench/contrib/comments/browser/commentNode", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/common/commentContextKeys", "./simpleCommentEditor", "vs/platform/instantiation/common/serviceCollection"], function (require, exports, dom, actionbar_1, actions_1, arrays, color_1, event_1, lifecycle_1, strings, types_1, uri_1, uuid_1, range_1, modes, modelService_1, modeService_1, markdownRenderer_1, referencesWidget_1, zoneWidget_1, nls, menuEntryActionViewItem_1, actions_2, contextkey_1, contextView_1, instantiation_1, keybinding_1, notification_1, opener_1, colorRegistry_1, themeService_1, commentFormActions_1, commentGlyphWidget_1, commentNode_1, commentService_1, commentContextKeys_1, simpleCommentEditor_1, serviceCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.COMMENTEDITOR_DECORATION_KEY = 'commenteditordecoration';
    const COLLAPSE_ACTION_CLASS = 'expand-review-action';
    const COMMENT_SCHEME = 'comment';
    let INMEM_MODEL_ID = 0;
    let ReviewZoneWidget = class ReviewZoneWidget extends zoneWidget_1.ZoneWidget {
        constructor(editor, _owner, _commentThread, _pendingComment, instantiationService, modeService, modelService, themeService, commentService, openerService, keybindingService, notificationService, contextMenuService, contextKeyService) {
            super(editor, { keepEditorSelection: true });
            this._owner = _owner;
            this._commentThread = _commentThread;
            this._pendingComment = _pendingComment;
            this.modeService = modeService;
            this.modelService = modelService;
            this.themeService = themeService;
            this.commentService = commentService;
            this.openerService = openerService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.contextMenuService = contextMenuService;
            this._commentElements = [];
            this._onDidClose = new event_1.Emitter();
            this._onDidCreateThread = new event_1.Emitter();
            this._globalToDispose = new lifecycle_1.DisposableStore();
            this._commentThreadDisposables = [];
            this.mouseDownInfo = null;
            this._contextKeyService = contextKeyService.createScoped(this.domNode);
            this._scopedInstatiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this._contextKeyService]));
            this._threadIsEmpty = commentContextKeys_1.CommentContextKeys.commentThreadIsEmpty.bindTo(this._contextKeyService);
            this._threadIsEmpty.set(!_commentThread.comments || !_commentThread.comments.length);
            this._commentThreadContextValue = this._contextKeyService.createKey('commentThread', _commentThread.contextValue);
            const commentControllerKey = this._contextKeyService.createKey('commentController', undefined);
            const controller = this.commentService.getCommentController(this._owner);
            if (controller) {
                commentControllerKey.set(controller.contextValue);
            }
            this._resizeObserver = null;
            this._isExpanded = _commentThread.collapsibleState === modes.CommentThreadCollapsibleState.Expanded;
            this._commentThreadDisposables = [];
            this._submitActionsDisposables = [];
            this._formActions = null;
            this._commentMenus = this.commentService.getCommentMenus(this._owner);
            this.create();
            this._styleElement = dom.createStyleSheet(this.domNode);
            this._globalToDispose.add(this.themeService.onThemeChange(this._applyTheme, this));
            this._globalToDispose.add(this.editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(30 /* fontInfo */)) {
                    this._applyTheme(this.themeService.getTheme());
                }
            }));
            this._applyTheme(this.themeService.getTheme());
            this._markdownRenderer = this._globalToDispose.add(new markdownRenderer_1.MarkdownRenderer(editor, this.modeService, this.openerService));
            this._parentEditor = editor;
        }
        get owner() {
            return this._owner;
        }
        get commentThread() {
            return this._commentThread;
        }
        get extensionId() {
            return this._commentThread.extensionId;
        }
        get onDidClose() {
            return this._onDidClose.event;
        }
        get onDidCreateThread() {
            return this._onDidCreateThread.event;
        }
        getPosition() {
            if (this.position) {
                return this.position;
            }
            if (this._commentGlyph) {
                return types_1.withNullAsUndefined(this._commentGlyph.getPosition().position);
            }
            return undefined;
        }
        revealLine(lineNumber) {
            // we don't do anything here as we always do the reveal ourselves.
        }
        reveal(commentUniqueId) {
            if (!this._isExpanded) {
                this.show({ lineNumber: this._commentThread.range.startLineNumber, column: 1 }, 2);
            }
            if (commentUniqueId !== undefined) {
                let height = this.editor.getLayoutInfo().height;
                let matchedNode = this._commentElements.filter(commentNode => commentNode.comment.uniqueIdInThread === commentUniqueId);
                if (matchedNode && matchedNode.length) {
                    const commentThreadCoords = dom.getDomNodePagePosition(this._commentElements[0].domNode);
                    const commentCoords = dom.getDomNodePagePosition(matchedNode[0].domNode);
                    this.editor.setScrollTop(this.editor.getTopForLineNumber(this._commentThread.range.startLineNumber) - height / 2 + commentCoords.top - commentThreadCoords.top);
                    return;
                }
            }
            this.editor.revealRangeInCenter(this._commentThread.range);
        }
        getPendingComment() {
            if (this._commentEditor) {
                let model = this._commentEditor.getModel();
                if (model && model.getValueLength() > 0) { // checking length is cheap
                    return model.getValue();
                }
            }
            return null;
        }
        _fillContainer(container) {
            this.setCssClass('review-widget');
            this._headElement = dom.$('.head');
            container.appendChild(this._headElement);
            this._fillHead(this._headElement);
            this._bodyElement = dom.$('.body');
            container.appendChild(this._bodyElement);
            dom.addDisposableListener(this._bodyElement, dom.EventType.FOCUS_IN, e => {
                this.commentService.setActiveCommentThread(this._commentThread);
            });
        }
        _fillHead(container) {
            let titleElement = dom.append(this._headElement, dom.$('.review-title'));
            this._headingLabel = dom.append(titleElement, dom.$('span.filename'));
            this.createThreadLabel();
            const actionsContainer = dom.append(this._headElement, dom.$('.review-actions'));
            this._actionbarWidget = new actionbar_1.ActionBar(actionsContainer, {
                actionViewItemProvider: (action) => {
                    if (action instanceof actions_2.MenuItemAction) {
                        let item = new menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
                        return item;
                    }
                    else {
                        let item = new actionbar_1.ActionViewItem({}, action, { label: false, icon: true });
                        return item;
                    }
                }
            });
            this._disposables.add(this._actionbarWidget);
            this._collapseAction = new actions_1.Action('review.expand', nls.localize('label.collapse', "Collapse"), COLLAPSE_ACTION_CLASS, true, () => this.collapse());
            const menu = this._commentMenus.getCommentThreadTitleActions(this._commentThread, this._contextKeyService);
            this.setActionBarActions(menu);
            this._disposables.add(menu);
            this._disposables.add(menu.onDidChange(e => {
                this.setActionBarActions(menu);
            }));
            this._actionbarWidget.context = this._commentThread;
        }
        setActionBarActions(menu) {
            const groups = menu.getActions({ shouldForwardArgs: true }).reduce((r, [, actions]) => [...r, ...actions], []);
            this._actionbarWidget.clear();
            this._actionbarWidget.push([...groups, this._collapseAction], { label: false, icon: true });
        }
        deleteCommentThread() {
            this.dispose();
            this.commentService.disposeCommentThread(this.owner, this._commentThread.threadId);
        }
        collapse() {
            if (this._commentThread.comments && this._commentThread.comments.length === 0) {
                this.deleteCommentThread();
                return Promise.resolve();
            }
            this.hide();
            return Promise.resolve();
        }
        getGlyphPosition() {
            if (this._commentGlyph) {
                return this._commentGlyph.getPosition().position.lineNumber;
            }
            return 0;
        }
        toggleExpand(lineNumber) {
            if (this._isExpanded) {
                this.hide();
                if (!this._commentThread.comments || !this._commentThread.comments.length) {
                    this.deleteCommentThread();
                }
            }
            else {
                this.show({ lineNumber: lineNumber, column: 1 }, 2);
            }
        }
        async update(commentThread) {
            const oldCommentsLen = this._commentElements.length;
            const newCommentsLen = commentThread.comments ? commentThread.comments.length : 0;
            this._threadIsEmpty.set(!newCommentsLen);
            let commentElementsToDel = [];
            let commentElementsToDelIndex = [];
            for (let i = 0; i < oldCommentsLen; i++) {
                let comment = this._commentElements[i].comment;
                let newComment = commentThread.comments ? commentThread.comments.filter(c => c.uniqueIdInThread === comment.uniqueIdInThread) : [];
                if (newComment.length) {
                    this._commentElements[i].update(newComment[0]);
                }
                else {
                    commentElementsToDelIndex.push(i);
                    commentElementsToDel.push(this._commentElements[i]);
                }
            }
            // del removed elements
            for (let i = commentElementsToDel.length - 1; i >= 0; i--) {
                this._commentElements.splice(commentElementsToDelIndex[i], 1);
                this._commentsElement.removeChild(commentElementsToDel[i].domNode);
            }
            let lastCommentElement = null;
            let newCommentNodeList = [];
            for (let i = newCommentsLen - 1; i >= 0; i--) {
                let currentComment = commentThread.comments[i];
                let oldCommentNode = this._commentElements.filter(commentNode => commentNode.comment.uniqueIdInThread === currentComment.uniqueIdInThread);
                if (oldCommentNode.length) {
                    lastCommentElement = oldCommentNode[0].domNode;
                    newCommentNodeList.unshift(oldCommentNode[0]);
                }
                else {
                    const newElement = this.createNewCommentNode(currentComment);
                    newCommentNodeList.unshift(newElement);
                    if (lastCommentElement) {
                        this._commentsElement.insertBefore(newElement.domNode, lastCommentElement);
                        lastCommentElement = newElement.domNode;
                    }
                    else {
                        this._commentsElement.appendChild(newElement.domNode);
                        lastCommentElement = newElement.domNode;
                    }
                }
            }
            this._commentThread = commentThread;
            this._commentElements = newCommentNodeList;
            this.createThreadLabel();
            // Move comment glyph widget and show position if the line has changed.
            const lineNumber = this._commentThread.range.startLineNumber;
            let shouldMoveWidget = false;
            if (this._commentGlyph) {
                if (this._commentGlyph.getPosition().position.lineNumber !== lineNumber) {
                    shouldMoveWidget = true;
                    this._commentGlyph.setLineNumber(lineNumber);
                }
            }
            if (!this._reviewThreadReplyButton) {
                this.createReplyButton();
            }
            if (this._commentThread.comments && this._commentThread.comments.length === 0) {
                this.expandReplyArea();
            }
            if (shouldMoveWidget && this._isExpanded) {
                this.show({ lineNumber, column: 1 }, 2);
            }
            if (this._commentThread.collapsibleState === modes.CommentThreadCollapsibleState.Expanded) {
                this.show({ lineNumber, column: 1 }, 2);
            }
            else {
                this.hide();
            }
            if (this._commentThread.contextValue) {
                this._commentThreadContextValue.set(this._commentThread.contextValue);
            }
            else {
                this._commentThreadContextValue.reset();
            }
        }
        _onWidth(widthInPixel) {
            this._commentEditor.layout({ height: 5 * 18, width: widthInPixel - 54 /* margin 20px * 10 + scrollbar 14px*/ });
        }
        _doLayout(heightInPixel, widthInPixel) {
            this._commentEditor.layout({ height: 5 * 18, width: widthInPixel - 54 /* margin 20px * 10 + scrollbar 14px*/ });
        }
        display(lineNumber) {
            this._commentGlyph = new commentGlyphWidget_1.CommentGlyphWidget(this.editor, lineNumber);
            this._disposables.add(this.editor.onMouseDown(e => this.onEditorMouseDown(e)));
            this._disposables.add(this.editor.onMouseUp(e => this.onEditorMouseUp(e)));
            let headHeight = Math.ceil(this.editor.getOption(45 /* lineHeight */) * 1.2);
            this._headElement.style.height = `${headHeight}px`;
            this._headElement.style.lineHeight = this._headElement.style.height;
            this._commentsElement = dom.append(this._bodyElement, dom.$('div.comments-container'));
            this._commentsElement.setAttribute('role', 'presentation');
            this._commentElements = [];
            if (this._commentThread.comments) {
                for (const comment of this._commentThread.comments) {
                    const newCommentNode = this.createNewCommentNode(comment);
                    this._commentElements.push(newCommentNode);
                    this._commentsElement.appendChild(newCommentNode.domNode);
                }
            }
            const hasExistingComments = this._commentThread.comments && this._commentThread.comments.length > 0;
            this._commentForm = dom.append(this._bodyElement, dom.$('.comment-form'));
            this._commentEditor = this._scopedInstatiationService.createInstance(simpleCommentEditor_1.SimpleCommentEditor, this._commentForm, simpleCommentEditor_1.SimpleCommentEditor.getEditorOptions(), this._parentEditor, this);
            this._commentEditorIsEmpty = commentContextKeys_1.CommentContextKeys.commentIsEmpty.bindTo(this._contextKeyService);
            this._commentEditorIsEmpty.set(!this._pendingComment);
            const modeId = uuid_1.generateUuid() + '-' + (hasExistingComments ? this._commentThread.threadId : ++INMEM_MODEL_ID);
            const params = JSON.stringify({
                extensionId: this.extensionId,
                commentThreadId: this.commentThread.threadId
            });
            let resource = uri_1.URI.parse(`${COMMENT_SCHEME}://${this.extensionId}/commentinput-${modeId}.md?${params}`); // TODO. Remove params once extensions adopt authority.
            let commentController = this.commentService.getCommentController(this.owner);
            if (commentController) {
                resource = resource.with({ authority: commentController.id });
            }
            const model = this.modelService.createModel(this._pendingComment || '', this.modeService.createByFilepathOrFirstLine(resource), resource, false);
            this._disposables.add(model);
            this._commentEditor.setModel(model);
            this._disposables.add(this._commentEditor);
            this._disposables.add(this._commentEditor.getModel().onDidChangeContent(() => {
                this.setCommentEditorDecorations();
                this._commentEditorIsEmpty.set(!this._commentEditor.getValue());
            }));
            this.createTextModelListener();
            this.setCommentEditorDecorations();
            // Only add the additional step of clicking a reply button to expand the textarea when there are existing comments
            if (hasExistingComments) {
                this.createReplyButton();
            }
            else {
                if (this._commentThread.comments && this._commentThread.comments.length === 0) {
                    this.expandReplyArea();
                }
            }
            this._error = dom.append(this._commentForm, dom.$('.validation-error.hidden'));
            this._formActions = dom.append(this._commentForm, dom.$('.form-actions'));
            this.createCommentWidgetActions(this._formActions, model);
            this.createCommentWidgetActionsListener();
            this._resizeObserver = new MutationObserver(this._refresh.bind(this));
            this._resizeObserver.observe(this._bodyElement, {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true
            });
            if (this._commentThread.collapsibleState === modes.CommentThreadCollapsibleState.Expanded) {
                this.show({ lineNumber: lineNumber, column: 1 }, 2);
            }
            // If there are no existing comments, place focus on the text area. This must be done after show, which also moves focus.
            // if this._commentThread.comments is undefined, it doesn't finish initialization yet, so we don't focus the editor immediately.
            if (this._commentThread.comments && !this._commentThread.comments.length) {
                this._commentEditor.focus();
            }
            else if (this._commentEditor.getModel().getValueLength() > 0) {
                this.expandReplyArea();
            }
        }
        createTextModelListener() {
            this._commentThreadDisposables.push(this._commentEditor.onDidFocusEditorWidget(() => {
                this._commentThread.input = {
                    uri: this._commentEditor.getModel().uri,
                    value: this._commentEditor.getValue()
                };
                this.commentService.setActiveCommentThread(this._commentThread);
            }));
            this._commentThreadDisposables.push(this._commentEditor.getModel().onDidChangeContent(() => {
                let modelContent = this._commentEditor.getValue();
                if (this._commentThread.input && this._commentThread.input.uri === this._commentEditor.getModel().uri && this._commentThread.input.value !== modelContent) {
                    let newInput = this._commentThread.input;
                    newInput.value = modelContent;
                    this._commentThread.input = newInput;
                }
                this.commentService.setActiveCommentThread(this._commentThread);
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeInput(input => {
                let thread = this._commentThread;
                if (thread.input && thread.input.uri !== this._commentEditor.getModel().uri) {
                    return;
                }
                if (!input) {
                    return;
                }
                if (this._commentEditor.getValue() !== input.value) {
                    this._commentEditor.setValue(input.value);
                    if (input.value === '') {
                        this._pendingComment = '';
                        if (dom.hasClass(this._commentForm, 'expand')) {
                            dom.removeClass(this._commentForm, 'expand');
                        }
                        this._commentEditor.getDomNode().style.outline = '';
                        this._error.textContent = '';
                        dom.addClass(this._error, 'hidden');
                    }
                }
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeComments(async (_) => {
                await this.update(this._commentThread);
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeLabel(_ => {
                this.createThreadLabel();
            }));
        }
        createCommentWidgetActionsListener() {
            this._commentThreadDisposables.push(this._commentThread.onDidChangeRange(range => {
                // Move comment glyph widget and show position if the line has changed.
                const lineNumber = this._commentThread.range.startLineNumber;
                let shouldMoveWidget = false;
                if (this._commentGlyph) {
                    if (this._commentGlyph.getPosition().position.lineNumber !== lineNumber) {
                        shouldMoveWidget = true;
                        this._commentGlyph.setLineNumber(lineNumber);
                    }
                }
                if (shouldMoveWidget && this._isExpanded) {
                    this.show({ lineNumber, column: 1 }, 2);
                }
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeCollasibleState(state => {
                if (state === modes.CommentThreadCollapsibleState.Expanded && !this._isExpanded) {
                    const lineNumber = this._commentThread.range.startLineNumber;
                    this.show({ lineNumber, column: 1 }, 2);
                    return;
                }
                if (state === modes.CommentThreadCollapsibleState.Collapsed && this._isExpanded) {
                    this.hide();
                    return;
                }
            }));
        }
        getActiveComment() {
            return this._commentElements.filter(node => node.isEditing)[0] || this;
        }
        /**
         * Command based actions.
         */
        createCommentWidgetActions(container, model) {
            const commentThread = this._commentThread;
            const menu = this._commentMenus.getCommentThreadActions(commentThread, this._contextKeyService);
            this._disposables.add(menu);
            this._disposables.add(menu.onDidChange(() => {
                this._commentFormActions.setActions(menu);
            }));
            this._commentFormActions = new commentFormActions_1.CommentFormActions(container, async (action) => {
                if (!commentThread.comments || !commentThread.comments.length) {
                    let newPosition = this.getPosition();
                    if (newPosition) {
                        this.commentService.updateCommentThreadTemplate(this.owner, commentThread.commentThreadHandle, new range_1.Range(newPosition.lineNumber, 1, newPosition.lineNumber, 1));
                    }
                }
                action.run({
                    thread: this._commentThread,
                    text: this._commentEditor.getValue(),
                    $mid: 8
                });
                this.hideReplyArea();
            }, this.themeService);
            this._commentFormActions.setActions(menu);
        }
        createNewCommentNode(comment) {
            let newCommentNode = this._scopedInstatiationService.createInstance(commentNode_1.CommentNode, this._commentThread, comment, this.owner, this.editor.getModel().uri, this._parentEditor, this, this._markdownRenderer);
            this._disposables.add(newCommentNode);
            this._disposables.add(newCommentNode.onDidDelete(deletedNode => {
                const deletedNodeId = deletedNode.comment.uniqueIdInThread;
                const deletedElementIndex = arrays.firstIndex(this._commentElements, commentNode => commentNode.comment.uniqueIdInThread === deletedNodeId);
                if (deletedElementIndex > -1) {
                    this._commentElements.splice(deletedElementIndex, 1);
                }
                const deletedCommentIndex = arrays.firstIndex(this._commentThread.comments, comment => comment.uniqueIdInThread === deletedNodeId);
                if (deletedCommentIndex > -1) {
                    this._commentThread.comments.splice(deletedCommentIndex, 1);
                }
                this._commentsElement.removeChild(deletedNode.domNode);
                deletedNode.dispose();
                if (this._commentThread.comments.length === 0) {
                    this.dispose();
                }
            }));
            return newCommentNode;
        }
        async submitComment() {
            const activeComment = this.getActiveComment();
            if (activeComment instanceof ReviewZoneWidget) {
                if (this._commentFormActions) {
                    this._commentFormActions.triggerDefaultAction();
                }
            }
        }
        createThreadLabel() {
            let label;
            label = this._commentThread.label;
            if (label === undefined) {
                if (this._commentThread.comments && this._commentThread.comments.length) {
                    const participantsList = this._commentThread.comments.filter(arrays.uniqueFilter(comment => comment.userName)).map(comment => `@${comment.userName}`).join(', ');
                    label = nls.localize('commentThreadParticipants', "Participants: {0}", participantsList);
                }
                else {
                    label = nls.localize('startThread', "Start discussion");
                }
            }
            if (label) {
                this._headingLabel.innerHTML = strings.escape(label);
                this._headingLabel.setAttribute('aria-label', label);
            }
        }
        expandReplyArea() {
            if (!dom.hasClass(this._commentForm, 'expand')) {
                dom.addClass(this._commentForm, 'expand');
                this._commentEditor.focus();
            }
        }
        hideReplyArea() {
            this._commentEditor.setValue('');
            this._pendingComment = '';
            if (dom.hasClass(this._commentForm, 'expand')) {
                dom.removeClass(this._commentForm, 'expand');
            }
            this._commentEditor.getDomNode().style.outline = '';
            this._error.textContent = '';
            dom.addClass(this._error, 'hidden');
        }
        createReplyButton() {
            this._reviewThreadReplyButton = dom.append(this._commentForm, dom.$('button.review-thread-reply-button'));
            this._reviewThreadReplyButton.title = nls.localize('reply', "Reply...");
            this._reviewThreadReplyButton.textContent = nls.localize('reply', "Reply...");
            // bind click/escape actions for reviewThreadReplyButton and textArea
            this._disposables.add(dom.addDisposableListener(this._reviewThreadReplyButton, 'click', _ => this.expandReplyArea()));
            this._disposables.add(dom.addDisposableListener(this._reviewThreadReplyButton, 'focus', _ => this.expandReplyArea()));
            this._commentEditor.onDidBlurEditorWidget(() => {
                if (this._commentEditor.getModel().getValueLength() === 0 && dom.hasClass(this._commentForm, 'expand')) {
                    dom.removeClass(this._commentForm, 'expand');
                }
            });
        }
        _refresh() {
            if (this._isExpanded && this._bodyElement) {
                let dimensions = dom.getClientArea(this._bodyElement);
                const headHeight = Math.ceil(this.editor.getOption(45 /* lineHeight */) * 1.2);
                const lineHeight = this.editor.getOption(45 /* lineHeight */);
                const arrowHeight = Math.round(lineHeight / 3);
                const frameThickness = Math.round(lineHeight / 9) * 2;
                const computedLinesNumber = Math.ceil((headHeight + dimensions.height + arrowHeight + frameThickness + 8 /** margin bottom to avoid margin collapse */) / lineHeight);
                let currentPosition = this.getPosition();
                if (this._viewZone && currentPosition && currentPosition.lineNumber !== this._viewZone.afterLineNumber) {
                    this._viewZone.afterLineNumber = currentPosition.lineNumber;
                }
                this._relayout(computedLinesNumber);
            }
        }
        setCommentEditorDecorations() {
            const model = this._commentEditor && this._commentEditor.getModel();
            if (model) {
                const valueLength = model.getValueLength();
                const hasExistingComments = this._commentThread.comments && this._commentThread.comments.length > 0;
                const placeholder = valueLength > 0
                    ? ''
                    : hasExistingComments
                        ? nls.localize('reply', "Reply...")
                        : nls.localize('newComment', "Type a new comment");
                const decorations = [{
                        range: {
                            startLineNumber: 0,
                            endLineNumber: 0,
                            startColumn: 0,
                            endColumn: 1
                        },
                        renderOptions: {
                            after: {
                                contentText: placeholder,
                                color: `${colorRegistry_1.transparent(colorRegistry_1.editorForeground, 0.4)(this.themeService.getTheme())}`
                            }
                        }
                    }];
                this._commentEditor.setDecorations(exports.COMMENTEDITOR_DECORATION_KEY, decorations);
            }
        }
        onEditorMouseDown(e) {
            this.mouseDownInfo = null;
            const range = e.target.range;
            if (!range) {
                return;
            }
            if (!e.event.leftButton) {
                return;
            }
            if (e.target.type !== 4 /* GUTTER_LINE_DECORATIONS */) {
                return;
            }
            const data = e.target.detail;
            const gutterOffsetX = data.offsetX - data.glyphMarginWidth - data.lineNumbersWidth - data.glyphMarginLeft;
            // don't collide with folding and git decorations
            if (gutterOffsetX > 14) {
                return;
            }
            this.mouseDownInfo = { lineNumber: range.startLineNumber };
        }
        onEditorMouseUp(e) {
            if (!this.mouseDownInfo) {
                return;
            }
            const { lineNumber } = this.mouseDownInfo;
            this.mouseDownInfo = null;
            const range = e.target.range;
            if (!range || range.startLineNumber !== lineNumber) {
                return;
            }
            if (e.target.type !== 4 /* GUTTER_LINE_DECORATIONS */) {
                return;
            }
            if (!e.target.element) {
                return;
            }
            if (this._commentGlyph && this._commentGlyph.getPosition().position.lineNumber !== lineNumber) {
                return;
            }
            if (e.target.element.className.indexOf('comment-thread') >= 0) {
                this.toggleExpand(lineNumber);
            }
        }
        _applyTheme(theme) {
            const borderColor = theme.getColor(referencesWidget_1.peekViewBorder) || color_1.Color.transparent;
            this.style({
                arrowColor: borderColor,
                frameColor: borderColor
            });
            const content = [];
            const linkColor = theme.getColor(colorRegistry_1.textLinkForeground);
            if (linkColor) {
                content.push(`.monaco-editor .review-widget .body .comment-body a { color: ${linkColor} }`);
            }
            const linkActiveColor = theme.getColor(colorRegistry_1.textLinkActiveForeground);
            if (linkActiveColor) {
                content.push(`.monaco-editor .review-widget .body .comment-body a:hover, a:active { color: ${linkActiveColor} }`);
            }
            const focusColor = theme.getColor(colorRegistry_1.focusBorder);
            if (focusColor) {
                content.push(`.monaco-editor .review-widget .body .comment-body a:focus { outline: 1px solid ${focusColor}; }`);
                content.push(`.monaco-editor .review-widget .body .monaco-editor.focused { outline: 1px solid ${focusColor}; }`);
            }
            const blockQuoteBackground = theme.getColor(colorRegistry_1.textBlockQuoteBackground);
            if (blockQuoteBackground) {
                content.push(`.monaco-editor .review-widget .body .review-comment blockquote { background: ${blockQuoteBackground}; }`);
            }
            const blockQuoteBOrder = theme.getColor(colorRegistry_1.textBlockQuoteBorder);
            if (blockQuoteBOrder) {
                content.push(`.monaco-editor .review-widget .body .review-comment blockquote { border-color: ${blockQuoteBOrder}; }`);
            }
            const hcBorder = theme.getColor(colorRegistry_1.contrastBorder);
            if (hcBorder) {
                content.push(`.monaco-editor .review-widget .body .comment-form .review-thread-reply-button { outline-color: ${hcBorder}; }`);
                content.push(`.monaco-editor .review-widget .body .monaco-editor { outline: 1px solid ${hcBorder}; }`);
            }
            const errorBorder = theme.getColor(colorRegistry_1.inputValidationErrorBorder);
            if (errorBorder) {
                content.push(`.monaco-editor .review-widget .validation-error { border: 1px solid ${errorBorder}; }`);
            }
            const errorBackground = theme.getColor(colorRegistry_1.inputValidationErrorBackground);
            if (errorBackground) {
                content.push(`.monaco-editor .review-widget .validation-error { background: ${errorBackground}; }`);
            }
            const errorForeground = theme.getColor(colorRegistry_1.inputValidationErrorForeground);
            if (errorForeground) {
                content.push(`.monaco-editor .review-widget .body .comment-form .validation-error { color: ${errorForeground}; }`);
            }
            const fontInfo = this.editor.getOption(30 /* fontInfo */);
            content.push(`.monaco-editor .review-widget .body code {
			font-family: ${fontInfo.fontFamily};
			font-size: ${fontInfo.fontSize}px;
			font-weight: ${fontInfo.fontWeight};
		}`);
            this._styleElement.innerHTML = content.join('\n');
            // Editor decorations should also be responsive to theme changes
            this.setCommentEditorDecorations();
        }
        show(rangeOrPos, heightInLines) {
            this._isExpanded = true;
            super.show(rangeOrPos, heightInLines);
            this._refresh();
        }
        hide() {
            this._isExpanded = false;
            // Focus the container so that the comment editor will be blurred before it is hidden
            this.editor.focus();
            super.hide();
        }
        dispose() {
            super.dispose();
            if (this._resizeObserver) {
                this._resizeObserver.disconnect();
                this._resizeObserver = null;
            }
            if (this._commentGlyph) {
                this._commentGlyph.dispose();
                this._commentGlyph = undefined;
            }
            this._globalToDispose.dispose();
            this._commentThreadDisposables.forEach(global => global.dispose());
            this._submitActionsDisposables.forEach(local => local.dispose());
            this._onDidClose.fire(undefined);
        }
    };
    ReviewZoneWidget = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, modeService_1.IModeService),
        __param(6, modelService_1.IModelService),
        __param(7, themeService_1.IThemeService),
        __param(8, commentService_1.ICommentService),
        __param(9, opener_1.IOpenerService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, notification_1.INotificationService),
        __param(12, contextView_1.IContextMenuService),
        __param(13, contextkey_1.IContextKeyService)
    ], ReviewZoneWidget);
    exports.ReviewZoneWidget = ReviewZoneWidget;
});
//# sourceMappingURL=commentThreadWidget.js.map