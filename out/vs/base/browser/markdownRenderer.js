/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/formattedTextRenderer", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/base/common/idGenerator", "vs/base/common/marked/marked", "vs/base/common/insane/insane", "vs/base/common/marshalling", "vs/base/common/objects", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/network"], function (require, exports, DOM, formattedTextRenderer_1, errors_1, htmlContent_1, idGenerator_1, marked, insane_1, marshalling_1, objects_1, strings_1, uri_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Create html nodes for the given content element.
     */
    function renderMarkdown(markdown, options = {}) {
        const element = formattedTextRenderer_1.createElement(options);
        const _uriMassage = function (part) {
            let data;
            try {
                data = marshalling_1.parse(decodeURIComponent(part));
            }
            catch (e) {
                // ignore
            }
            if (!data) {
                return part;
            }
            data = objects_1.cloneAndChange(data, value => {
                if (markdown.uris && markdown.uris[value]) {
                    return uri_1.URI.revive(markdown.uris[value]);
                }
                else {
                    return undefined;
                }
            });
            return encodeURIComponent(JSON.stringify(data));
        };
        const _href = function (href, isDomUri) {
            const data = markdown.uris && markdown.uris[href];
            if (!data) {
                return href;
            }
            let uri = uri_1.URI.revive(data);
            if (isDomUri) {
                uri = DOM.asDomUri(uri);
            }
            if (uri.query) {
                uri = uri.with({ query: _uriMassage(uri.query) });
            }
            if (data) {
                href = uri.toString(true);
            }
            return href;
        };
        // signal to code-block render that the
        // element has been created
        let signalInnerHTML;
        const withInnerHTML = new Promise(c => signalInnerHTML = c);
        const renderer = new marked.Renderer();
        renderer.image = (href, title, text) => {
            let dimensions = [];
            let attributes = [];
            if (href) {
                ({ href, dimensions } = htmlContent_1.parseHrefAndDimensions(href));
                href = _href(href, true);
                attributes.push(`src="${href}"`);
            }
            if (text) {
                attributes.push(`alt="${text}"`);
            }
            if (title) {
                attributes.push(`title="${title}"`);
            }
            if (dimensions.length) {
                attributes = attributes.concat(dimensions);
            }
            return '<img ' + attributes.join(' ') + '>';
        };
        renderer.link = (href, title, text) => {
            // Remove markdown escapes. Workaround for https://github.com/chjj/marked/issues/829
            if (href === text) { // raw link case
                text = htmlContent_1.removeMarkdownEscapes(text);
            }
            href = _href(href, false);
            title = htmlContent_1.removeMarkdownEscapes(title);
            href = htmlContent_1.removeMarkdownEscapes(href);
            if (!href
                || href.match(/^data:|javascript:/i)
                || (href.match(/^command:/i) && !markdown.isTrusted)
                || href.match(/^command:(\/\/\/)?_workbench\.downloadResource/i)) {
                // drop the link
                return text;
            }
            else {
                // HTML Encode href
                href = href.replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                return `<a href="#" data-href="${href}" title="${title || href}">${text}</a>`;
            }
        };
        renderer.paragraph = (text) => {
            return `<p>${text}</p>`;
        };
        if (options.codeBlockRenderer) {
            renderer.code = (code, lang) => {
                const value = options.codeBlockRenderer(lang, code);
                // when code-block rendering is async we return sync
                // but update the node with the real result later.
                const id = idGenerator_1.defaultGenerator.nextId();
                const promise = Promise.all([value, withInnerHTML]).then(values => {
                    const strValue = values[0];
                    const span = element.querySelector(`div[data-code="${id}"]`);
                    if (span) {
                        span.innerHTML = strValue;
                    }
                }).catch(err => {
                    // ignore
                });
                if (options.codeBlockRenderCallback) {
                    promise.then(options.codeBlockRenderCallback);
                }
                return `<div class="code" data-code="${id}">${strings_1.escape(code)}</div>`;
            };
        }
        const actionHandler = options.actionHandler;
        if (actionHandler) {
            actionHandler.disposeables.add(DOM.addStandardDisposableListener(element, 'click', event => {
                let target = event.target;
                if (target.tagName !== 'A') {
                    target = target.parentElement;
                    if (!target || target.tagName !== 'A') {
                        return;
                    }
                }
                try {
                    const href = target.dataset['href'];
                    if (href) {
                        actionHandler.callback(href, event);
                    }
                }
                catch (err) {
                    errors_1.onUnexpectedError(err);
                }
                finally {
                    event.preventDefault();
                }
            }));
        }
        const markedOptions = {
            sanitize: true,
            renderer
        };
        const allowedSchemes = [network_1.Schemas.http, network_1.Schemas.https, network_1.Schemas.mailto, network_1.Schemas.data, network_1.Schemas.file, network_1.Schemas.vscodeRemote];
        if (markdown.isTrusted) {
            allowedSchemes.push(network_1.Schemas.command);
        }
        const renderedMarkdown = marked.parse(markdown.value, markedOptions);
        element.innerHTML = insane_1.insane(renderedMarkdown, {
            allowedSchemes,
            allowedAttributes: {
                'a': ['href', 'name', 'target', 'data-href'],
                'iframe': ['allowfullscreen', 'frameborder', 'src'],
                'img': ['src', 'title', 'alt', 'width', 'height'],
                'div': ['class', 'data-code']
            }
        });
        signalInnerHTML();
        return element;
    }
    exports.renderMarkdown = renderMarkdown;
});
//# sourceMappingURL=markdownRenderer.js.map