/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/lifecycle", "vs/css!./iconlabel"], function (require, exports, dom, highlightedLabel_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FastLabelNode {
        constructor(_element) {
            this._element = _element;
        }
        get element() {
            return this._element;
        }
        set textContent(content) {
            if (this.disposed || content === this._textContent) {
                return;
            }
            this._textContent = content;
            this._element.textContent = content;
        }
        set className(className) {
            if (this.disposed || className === this._className) {
                return;
            }
            this._className = className;
            this._element.className = className;
        }
        set title(title) {
            if (this.disposed || title === this._title) {
                return;
            }
            this._title = title;
            if (this._title) {
                this._element.title = title;
            }
            else {
                this._element.removeAttribute('title');
            }
        }
        set empty(empty) {
            if (this.disposed || empty === this._empty) {
                return;
            }
            this._empty = empty;
            this._element.style.marginLeft = empty ? '0' : null;
        }
        dispose() {
            this.disposed = true;
        }
    }
    class IconLabel extends lifecycle_1.Disposable {
        constructor(container, options) {
            super();
            this.domNode = this._register(new FastLabelNode(dom.append(container, dom.$('.monaco-icon-label'))));
            this.labelDescriptionContainer = this._register(new FastLabelNode(dom.append(this.domNode.element, dom.$('.monaco-icon-label-description-container'))));
            if (options && options.supportHighlights) {
                this.labelNode = new highlightedLabel_1.HighlightedLabel(dom.append(this.labelDescriptionContainer.element, dom.$('a.label-name')), !!options.supportOcticons);
            }
            else {
                this.labelNode = this._register(new FastLabelNode(dom.append(this.labelDescriptionContainer.element, dom.$('a.label-name'))));
            }
            if (options && options.supportDescriptionHighlights) {
                this.descriptionNodeFactory = () => new highlightedLabel_1.HighlightedLabel(dom.append(this.labelDescriptionContainer.element, dom.$('span.label-description')), !!options.supportOcticons);
            }
            else {
                this.descriptionNodeFactory = () => this._register(new FastLabelNode(dom.append(this.labelDescriptionContainer.element, dom.$('span.label-description'))));
            }
        }
        get element() {
            return this.domNode.element;
        }
        setLabel(label, description, options) {
            const classes = ['monaco-icon-label'];
            if (options) {
                if (options.extraClasses) {
                    classes.push(...options.extraClasses);
                }
                if (options.italic) {
                    classes.push('italic');
                }
            }
            this.domNode.className = classes.join(' ');
            this.domNode.title = options && options.title ? options.title : '';
            if (this.labelNode instanceof highlightedLabel_1.HighlightedLabel) {
                this.labelNode.set(label || '', options ? options.matches : undefined, options && options.title ? options.title : undefined, options && options.labelEscapeNewLines);
            }
            else {
                this.labelNode.textContent = label || '';
            }
            if (description || this.descriptionNode) {
                if (!this.descriptionNode) {
                    this.descriptionNode = this.descriptionNodeFactory(); // description node is created lazily on demand
                }
                if (this.descriptionNode instanceof highlightedLabel_1.HighlightedLabel) {
                    this.descriptionNode.set(description || '', options ? options.descriptionMatches : undefined);
                    if (options && options.descriptionTitle) {
                        this.descriptionNode.element.title = options.descriptionTitle;
                    }
                    else {
                        this.descriptionNode.element.removeAttribute('title');
                    }
                }
                else {
                    this.descriptionNode.textContent = description || '';
                    this.descriptionNode.title = options && options.descriptionTitle ? options.descriptionTitle : '';
                    this.descriptionNode.empty = !description;
                }
            }
        }
    }
    exports.IconLabel = IconLabel;
});
//# sourceMappingURL=iconLabel.js.map