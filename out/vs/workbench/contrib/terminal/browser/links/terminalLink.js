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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/common/async", "vs/workbench/contrib/terminal/browser/links/terminalLinkHelpers", "vs/platform/configuration/common/configuration", "vs/base/common/platform", "vs/nls"], function (require, exports, lifecycle_1, dom, async_1, terminalLinkHelpers_1, configuration_1, platform_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLink = exports.FOLDER_NOT_IN_WORKSPACE_LABEL = exports.FOLDER_IN_WORKSPACE_LABEL = exports.OPEN_FILE_LABEL = void 0;
    exports.OPEN_FILE_LABEL = nls_1.localize('openFile', 'Open file in editor');
    exports.FOLDER_IN_WORKSPACE_LABEL = nls_1.localize('focusFolder', 'Focus folder in explorer');
    exports.FOLDER_NOT_IN_WORKSPACE_LABEL = nls_1.localize('openFolder', 'Open folder in new window');
    let TerminalLink = /** @class */ (() => {
        let TerminalLink = class TerminalLink extends lifecycle_1.DisposableStore {
            constructor(range, text, _viewportY, _activateCallback, _tooltipCallback, _isHighConfidenceLink, label, _configurationService) {
                super();
                this.range = range;
                this.text = text;
                this._viewportY = _viewportY;
                this._activateCallback = _activateCallback;
                this._tooltipCallback = _tooltipCallback;
                this._isHighConfidenceLink = _isHighConfidenceLink;
                this.label = label;
                this._configurationService = _configurationService;
                this.decorations = {
                    pointerCursor: false,
                    underline: this._isHighConfidenceLink
                };
            }
            activate(event, text) {
                this._activateCallback(event, text);
            }
            hover(event, text) {
                // Listen for modifier before handing it off to the hover to handle so it gets disposed correctly
                this.add(dom.addDisposableListener(document, 'keydown', e => {
                    if (this._isModifierDown(e)) {
                        this._enableDecorations();
                    }
                }));
                this.add(dom.addDisposableListener(document, 'keyup', e => {
                    if (!this._isModifierDown(e)) {
                        this._disableDecorations();
                    }
                }));
                const timeout = this._configurationService.getValue('editor.hover.delay');
                const scheduler = new async_1.RunOnceScheduler(() => {
                    this._tooltipCallback(this, terminalLinkHelpers_1.convertBufferRangeToViewport(this.range, this._viewportY), this._isHighConfidenceLink ? () => this._enableDecorations() : undefined, this._isHighConfidenceLink ? () => this._disableDecorations() : undefined);
                    this.dispose();
                }, timeout);
                this.add(scheduler);
                scheduler.schedule();
                const origin = { x: event.pageX, y: event.pageY };
                this.add(dom.addDisposableListener(document, dom.EventType.MOUSE_MOVE, e => {
                    // Update decorations
                    if (this._isModifierDown(e)) {
                        this._enableDecorations();
                    }
                    else {
                        this._disableDecorations();
                    }
                    // Reset the scheduler if the mouse moves too much
                    if (Math.abs(e.pageX - origin.x) > window.devicePixelRatio * 2 || Math.abs(e.pageY - origin.y) > window.devicePixelRatio * 2) {
                        origin.x = e.pageX;
                        origin.y = e.pageY;
                        scheduler.schedule();
                    }
                }));
            }
            leave() {
                this.dispose();
            }
            _enableDecorations() {
                if (!this.decorations.pointerCursor) {
                    this.decorations.pointerCursor = true;
                }
                if (!this.decorations.underline) {
                    this.decorations.underline = true;
                }
            }
            _disableDecorations() {
                if (this.decorations.pointerCursor) {
                    this.decorations.pointerCursor = false;
                }
                if (this.decorations.underline !== this._isHighConfidenceLink) {
                    this.decorations.underline = this._isHighConfidenceLink;
                }
            }
            _isModifierDown(event) {
                const multiCursorModifier = this._configurationService.getValue('editor.multiCursorModifier');
                if (multiCursorModifier === 'ctrlCmd') {
                    return !!event.altKey;
                }
                return platform_1.isMacintosh ? event.metaKey : event.ctrlKey;
            }
        };
        TerminalLink = __decorate([
            __param(7, configuration_1.IConfigurationService)
        ], TerminalLink);
        return TerminalLink;
    })();
    exports.TerminalLink = TerminalLink;
});
//# sourceMappingURL=terminalLink.js.map