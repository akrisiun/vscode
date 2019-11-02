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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/services/modeService", "vs/editor/contrib/markdown/markdownRenderer", "vs/editor/contrib/parameterHints/provideSignatureHelp", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/opener/common/opener", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/editor/contrib/parameterHints/parameterHintsModel", "vs/css!./parameterHints"], function (require, exports, dom, event_1, aria, scrollableElement_1, event_2, lifecycle_1, modeService_1, markdownRenderer_1, provideSignatureHelp_1, nls, contextkey_1, opener_1, colorRegistry_1, themeService_1, parameterHintsModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    let ParameterHintsWidget = class ParameterHintsWidget extends lifecycle_1.Disposable {
        constructor(editor, contextKeyService, openerService, modeService) {
            super();
            this.editor = editor;
            this.renderDisposeables = this._register(new lifecycle_1.DisposableStore());
            this.visible = false;
            this.announcedLabel = null;
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this.markdownRenderer = this._register(new markdownRenderer_1.MarkdownRenderer(editor, modeService, openerService));
            this.model = this._register(new parameterHintsModel_1.ParameterHintsModel(editor));
            this.keyVisible = provideSignatureHelp_1.Context.Visible.bindTo(contextKeyService);
            this.keyMultipleSignatures = provideSignatureHelp_1.Context.MultipleSignatures.bindTo(contextKeyService);
            this._register(this.model.onChangedHints(newParameterHints => {
                if (newParameterHints) {
                    this.show();
                    this.render(newParameterHints);
                }
                else {
                    this.hide();
                }
            }));
        }
        createParamaterHintDOMNodes() {
            const element = $('.editor-widget.parameter-hints-widget');
            const wrapper = dom.append(element, $('.wrapper'));
            wrapper.tabIndex = -1;
            const buttons = dom.append(wrapper, $('.buttons'));
            const previous = dom.append(buttons, $('.button.previous'));
            const next = dom.append(buttons, $('.button.next'));
            const onPreviousClick = event_1.stop(event_1.domEvent(previous, 'click'));
            this._register(onPreviousClick(this.previous, this));
            const onNextClick = event_1.stop(event_1.domEvent(next, 'click'));
            this._register(onNextClick(this.next, this));
            const overloads = dom.append(wrapper, $('.overloads'));
            const body = $('.body');
            const scrollbar = new scrollableElement_1.DomScrollableElement(body, {});
            this._register(scrollbar);
            wrapper.appendChild(scrollbar.getDomNode());
            const signature = dom.append(body, $('.signature'));
            const docs = dom.append(body, $('.docs'));
            element.style.userSelect = 'text';
            this.domNodes = {
                element,
                signature,
                overloads,
                docs,
                scrollbar,
            };
            this.editor.addContentWidget(this);
            this.hide();
            this._register(this.editor.onDidChangeCursorSelection(e => {
                if (this.visible) {
                    this.editor.layoutContentWidget(this);
                }
            }));
            const updateFont = () => {
                if (!this.domNodes) {
                    return;
                }
                const fontInfo = this.editor.getOption(31 /* fontInfo */);
                this.domNodes.element.style.fontSize = `${fontInfo.fontSize}px`;
            };
            updateFont();
            this._register(event_2.Event.chain(this.editor.onDidChangeConfiguration.bind(this.editor))
                .filter(e => e.hasChanged(31 /* fontInfo */))
                .on(updateFont, null));
            this._register(this.editor.onDidLayoutChange(e => this.updateMaxHeight()));
            this.updateMaxHeight();
        }
        show() {
            if (this.visible) {
                return;
            }
            if (!this.domNodes) {
                this.createParamaterHintDOMNodes();
            }
            this.keyVisible.set(true);
            this.visible = true;
            setTimeout(() => {
                if (this.domNodes) {
                    dom.addClass(this.domNodes.element, 'visible');
                }
            }, 100);
            this.editor.layoutContentWidget(this);
        }
        hide() {
            if (!this.visible) {
                return;
            }
            this.keyVisible.reset();
            this.visible = false;
            this.announcedLabel = null;
            if (this.domNodes) {
                dom.removeClass(this.domNodes.element, 'visible');
            }
            this.editor.layoutContentWidget(this);
        }
        getPosition() {
            if (this.visible) {
                return {
                    position: this.editor.getPosition(),
                    preference: [1 /* ABOVE */, 2 /* BELOW */]
                };
            }
            return null;
        }
        render(hints) {
            if (!this.domNodes) {
                return;
            }
            const multiple = hints.signatures.length > 1;
            dom.toggleClass(this.domNodes.element, 'multiple', multiple);
            this.keyMultipleSignatures.set(multiple);
            this.domNodes.signature.innerHTML = '';
            this.domNodes.docs.innerHTML = '';
            const signature = hints.signatures[hints.activeSignature];
            if (!signature) {
                return;
            }
            const code = dom.append(this.domNodes.signature, $('.code'));
            const hasParameters = signature.parameters.length > 0;
            const fontInfo = this.editor.getOption(31 /* fontInfo */);
            code.style.fontSize = `${fontInfo.fontSize}px`;
            code.style.fontFamily = fontInfo.fontFamily;
            if (!hasParameters) {
                const label = dom.append(code, $('span'));
                label.textContent = signature.label;
            }
            else {
                this.renderParameters(code, signature, hints.activeParameter);
            }
            this.renderDisposeables.clear();
            const activeParameter = signature.parameters[hints.activeParameter];
            if (activeParameter && activeParameter.documentation) {
                const documentation = $('span.documentation');
                if (typeof activeParameter.documentation === 'string') {
                    documentation.textContent = activeParameter.documentation;
                }
                else {
                    const renderedContents = this.markdownRenderer.render(activeParameter.documentation);
                    dom.addClass(renderedContents.element, 'markdown-docs');
                    this.renderDisposeables.add(renderedContents);
                    documentation.appendChild(renderedContents.element);
                }
                dom.append(this.domNodes.docs, $('p', {}, documentation));
            }
            if (signature.documentation === undefined) { /** no op */ }
            else if (typeof signature.documentation === 'string') {
                dom.append(this.domNodes.docs, $('p', {}, signature.documentation));
            }
            else {
                const renderedContents = this.markdownRenderer.render(signature.documentation);
                dom.addClass(renderedContents.element, 'markdown-docs');
                this.renderDisposeables.add(renderedContents);
                dom.append(this.domNodes.docs, renderedContents.element);
            }
            const hasDocs = this.hasDocs(signature, activeParameter);
            dom.toggleClass(this.domNodes.signature, 'has-docs', hasDocs);
            dom.toggleClass(this.domNodes.docs, 'empty', !hasDocs);
            let currentOverload = String(hints.activeSignature + 1);
            if (hints.signatures.length < 10) {
                currentOverload += `/${hints.signatures.length}`;
            }
            this.domNodes.overloads.textContent = currentOverload;
            if (activeParameter) {
                const labelToAnnounce = this.getParameterLabel(signature, hints.activeParameter);
                // Select method gets called on every user type while parameter hints are visible.
                // We do not want to spam the user with same announcements, so we only announce if the current parameter changed.
                if (this.announcedLabel !== labelToAnnounce) {
                    aria.alert(nls.localize('hint', "{0}, hint", labelToAnnounce));
                    this.announcedLabel = labelToAnnounce;
                }
            }
            this.editor.layoutContentWidget(this);
            this.domNodes.scrollbar.scanDomNode();
        }
        hasDocs(signature, activeParameter) {
            if (activeParameter && typeof (activeParameter.documentation) === 'string' && activeParameter.documentation.length > 0) {
                return true;
            }
            if (activeParameter && typeof (activeParameter.documentation) === 'object' && activeParameter.documentation.value.length > 0) {
                return true;
            }
            if (typeof (signature.documentation) === 'string' && signature.documentation.length > 0) {
                return true;
            }
            if (typeof (signature.documentation) === 'object' && signature.documentation.value.length > 0) {
                return true;
            }
            return false;
        }
        renderParameters(parent, signature, currentParameter) {
            const [start, end] = this.getParameterLabelOffsets(signature, currentParameter);
            const beforeSpan = document.createElement('span');
            beforeSpan.textContent = signature.label.substring(0, start);
            const paramSpan = document.createElement('span');
            paramSpan.textContent = signature.label.substring(start, end);
            paramSpan.className = 'parameter active';
            const afterSpan = document.createElement('span');
            afterSpan.textContent = signature.label.substring(end);
            dom.append(parent, beforeSpan, paramSpan, afterSpan);
        }
        getParameterLabel(signature, paramIdx) {
            const param = signature.parameters[paramIdx];
            if (typeof param.label === 'string') {
                return param.label;
            }
            else {
                return signature.label.substring(param.label[0], param.label[1]);
            }
        }
        getParameterLabelOffsets(signature, paramIdx) {
            const param = signature.parameters[paramIdx];
            if (!param) {
                return [0, 0];
            }
            else if (Array.isArray(param.label)) {
                return param.label;
            }
            else {
                const idx = signature.label.lastIndexOf(param.label);
                return idx >= 0
                    ? [idx, idx + param.label.length]
                    : [0, 0];
            }
        }
        next() {
            this.editor.focus();
            this.model.next();
        }
        previous() {
            this.editor.focus();
            this.model.previous();
        }
        cancel() {
            this.model.cancel();
        }
        getDomNode() {
            if (!this.domNodes) {
                this.createParamaterHintDOMNodes();
            }
            return this.domNodes.element;
        }
        getId() {
            return ParameterHintsWidget.ID;
        }
        trigger(context) {
            this.model.trigger(context, 0);
        }
        updateMaxHeight() {
            if (!this.domNodes) {
                return;
            }
            const height = Math.max(this.editor.getLayoutInfo().height / 4, 250);
            const maxHeight = `${height}px`;
            this.domNodes.element.style.maxHeight = maxHeight;
            const wrapper = this.domNodes.element.getElementsByClassName('wrapper');
            if (wrapper.length) {
                wrapper[0].style.maxHeight = maxHeight;
            }
        }
    };
    ParameterHintsWidget.ID = 'editor.widget.parameterHintsWidget';
    ParameterHintsWidget = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, opener_1.IOpenerService),
        __param(3, modeService_1.IModeService)
    ], ParameterHintsWidget);
    exports.ParameterHintsWidget = ParameterHintsWidget;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const border = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (border) {
            const borderWidth = theme.type === themeService_1.HIGH_CONTRAST ? 2 : 1;
            collector.addRule(`.monaco-editor .parameter-hints-widget { border: ${borderWidth}px solid ${border}; }`);
            collector.addRule(`.monaco-editor .parameter-hints-widget.multiple .body { border-left: 1px solid ${border.transparent(0.5)}; }`);
            collector.addRule(`.monaco-editor .parameter-hints-widget .signature.has-docs { border-bottom: 1px solid ${border.transparent(0.5)}; }`);
        }
        const background = theme.getColor(colorRegistry_1.editorHoverBackground);
        if (background) {
            collector.addRule(`.monaco-editor .parameter-hints-widget { background-color: ${background}; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.monaco-editor .parameter-hints-widget a { color: ${link}; }`);
        }
        const foreground = theme.getColor(colorRegistry_1.editorHoverForeground);
        if (foreground) {
            collector.addRule(`.monaco-editor .parameter-hints-widget { color: ${foreground}; }`);
        }
        const codeBackground = theme.getColor(colorRegistry_1.textCodeBlockBackground);
        if (codeBackground) {
            collector.addRule(`.monaco-editor .parameter-hints-widget code { background-color: ${codeBackground}; }`);
        }
    });
});
//# sourceMappingURL=parameterHintsWidget.js.map