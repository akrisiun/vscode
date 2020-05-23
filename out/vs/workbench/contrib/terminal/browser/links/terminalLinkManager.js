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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/opener/common/opener", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/editor/common/editorService", "vs/platform/files/common/files", "vs/platform/remote/common/remoteHosts", "vs/base/common/path", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/platform", "vs/base/common/htmlContent", "vs/base/common/event", "vs/platform/log/common/log", "vs/workbench/contrib/terminal/browser/links/terminalProtocolLinkProvider", "vs/workbench/contrib/terminal/browser/links/terminalValidatedLocalLinkProvider", "vs/workbench/contrib/terminal/browser/links/terminalWordLinkProvider", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/widgets/terminalHoverWidget"], function (require, exports, nls, uri_1, lifecycle_1, opener_1, configuration_1, terminal_1, editorService_1, files_1, remoteHosts_1, path_1, terminal_2, platform_1, htmlContent_1, event_1, log_1, terminalProtocolLinkProvider_1, terminalValidatedLocalLinkProvider_1, terminalWordLinkProvider_1, instantiation_1, terminalHoverWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLinkManager = void 0;
    const pathPrefix = '(\\.\\.?|\\~)';
    const pathSeparatorClause = '\\/';
    // '":; are allowed in paths but they are often separators so ignore them
    // Also disallow \\ to prevent a catastropic backtracking case #24798
    const excludedPathCharactersClause = '[^\\0\\s!$`&*()\\[\\]+\'":;\\\\]';
    /** A regex that matches paths in the form /foo, ~/foo, ./foo, ../foo, foo/bar */
    const unixLocalLinkClause = '((' + pathPrefix + '|(' + excludedPathCharactersClause + ')+)?(' + pathSeparatorClause + '(' + excludedPathCharactersClause + ')+)+)';
    // Valid absolute formats: C:, \\?\C: and \\?\%VAR%
    const winDrivePrefix = '(?:\\\\\\\\\\?\\\\)?[a-zA-Z]:';
    const winPathPrefix = '(' + winDrivePrefix + '|\\.\\.?|\\~)';
    const winPathSeparatorClause = '(\\\\|\\/)';
    const winExcludedPathCharactersClause = '[^\\0<>\\?\\|\\/\\s!$`&*()\\[\\]+\'":;]';
    /** A regex that matches paths in the form \\?\c:\foo c:\foo, ~\foo, .\foo, ..\foo, foo\bar */
    const winLocalLinkClause = '((' + winPathPrefix + '|(' + winExcludedPathCharactersClause + ')+)?(' + winPathSeparatorClause + '(' + winExcludedPathCharactersClause + ')+)+)';
    /** As xterm reads from DOM, space in that case is nonbreaking char ASCII code - 160,
    replacing space with nonBreakningSpace or space ASCII code - 32. */
    const lineAndColumnClause = [
        '((\\S*)", line ((\\d+)( column (\\d+))?))',
        '((\\S*)",((\\d+)(:(\\d+))?))',
        '((\\S*) on line ((\\d+)(, column (\\d+))?))',
        '((\\S*):line ((\\d+)(, column (\\d+))?))',
        '(([^\\s\\(\\)]*)(\\s?[\\(\\[](\\d+)(,\\s?(\\d+))?)[\\)\\]])',
        '(([^:\\s\\(\\)<>\'\"\\[\\]]*)(:(\\d+))?(:(\\d+))?)' // (file path):336, (file path):336:9
    ].join('|').replace(/ /g, `[${'\u00A0'} ]`);
    // Changing any regex may effect this value, hence changes this as well if required.
    const winLineAndColumnMatchIndex = 12;
    const unixLineAndColumnMatchIndex = 11;
    // Each line and column clause have 6 groups (ie no. of expressions in round brackets)
    const lineAndColumnClauseGroupCount = 6;
    /** Higher than local link, lower than hypertext */
    const CUSTOM_LINK_PRIORITY = -1;
    /** Lowest */
    const LOCAL_LINK_PRIORITY = -2;
    /**
     * An object responsible for managing registration of link matchers and link providers.
     */
    let TerminalLinkManager = /** @class */ (() => {
        let TerminalLinkManager = class TerminalLinkManager extends lifecycle_1.DisposableStore {
            constructor(_xterm, _processManager, _configHelper, _openerService, _editorService, _configurationService, _terminalInstanceService, _fileService, _logService, _instantiationService) {
                var _a;
                super();
                this._xterm = _xterm;
                this._processManager = _processManager;
                this._configHelper = _configHelper;
                this._openerService = _openerService;
                this._editorService = _editorService;
                this._configurationService = _configurationService;
                this._terminalInstanceService = _terminalInstanceService;
                this._fileService = _fileService;
                this._logService = _logService;
                this._instantiationService = _instantiationService;
                this._linkMatchers = [];
                this._linkProviders = [];
                this._hasBeforeHandleLinkListeners = false;
                this._onBeforeHandleLink = this.add(new event_1.Emitter({
                    onFirstListenerAdd: () => this._hasBeforeHandleLinkListeners = true,
                    onLastListenerRemove: () => this._hasBeforeHandleLinkListeners = false
                }));
                // Matches '--- a/src/file1', capturing 'src/file1' in group 1
                this._gitDiffPreImagePattern = /^--- a\/(\S*)/;
                // Matches '+++ b/src/file1', capturing 'src/file1' in group 1
                this._gitDiffPostImagePattern = /^\+\+\+ b\/(\S*)/;
                if (this._configHelper.config.experimentalLinkProvider) {
                    this.registerLinkProvider();
                }
                else {
                    this._registerLinkMatchers();
                }
                (_a = this._configurationService) === null || _a === void 0 ? void 0 : _a.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration('terminal.integrated.experimentalLinkProvider')) {
                        if (this._configHelper.config.experimentalLinkProvider) {
                            this._deregisterLinkMatchers();
                            this.registerLinkProvider();
                        }
                        else {
                            lifecycle_1.dispose(this._linkProviders);
                            this._linkProviders.length = 0;
                            this._registerLinkMatchers();
                        }
                    }
                });
            }
            /**
             * Allows intercepting links and handling them outside of the default link handler. When fired
             * the listener has a set amount of time to handle the link or the default handler will fire.
             * This was designed to only be handled by a single listener.
             */
            get onBeforeHandleLink() { return this._onBeforeHandleLink.event; }
            _tooltipCallback(linkText, viewportRange, linkHandler) {
                if (!this._widgetManager) {
                    return;
                }
                const core = this._xterm._core;
                const cellDimensions = {
                    width: core._renderService.dimensions.actualCellWidth,
                    height: core._renderService.dimensions.actualCellHeight
                };
                const terminalDimensions = {
                    width: this._xterm.cols,
                    height: this._xterm.rows
                };
                this._showHover({
                    viewportRange,
                    cellDimensions,
                    terminalDimensions
                }, this._getLinkHoverString(linkText, undefined), linkHandler);
            }
            _tooltipCallback2(link, viewportRange, modifierDownCallback, modifierUpCallback) {
                if (!this._widgetManager) {
                    return;
                }
                const core = this._xterm._core;
                const cellDimensions = {
                    width: core._renderService.dimensions.actualCellWidth,
                    height: core._renderService.dimensions.actualCellHeight
                };
                const terminalDimensions = {
                    width: this._xterm.cols,
                    height: this._xterm.rows
                };
                // Don't pass the mouse event as this avoids the modifier check
                this._showHover({
                    viewportRange,
                    cellDimensions,
                    terminalDimensions,
                    modifierDownCallback,
                    modifierUpCallback
                }, this._getLinkHoverString(link.text, link.label), (text) => link.activate(undefined, text));
            }
            _showHover(targetOptions, text, linkHandler) {
                if (this._widgetManager) {
                    const widget = this._instantiationService.createInstance(terminalHoverWidget_1.TerminalHover, targetOptions, text, linkHandler);
                    this._widgetManager.attachWidget(widget);
                }
            }
            _registerLinkMatchers() {
                this.registerWebLinkHandler();
                if (this._processManager) {
                    if (this._configHelper.config.enableFileLinks) {
                        this.registerLocalLinkHandler();
                    }
                    this.registerGitDiffLinkHandlers();
                }
            }
            _deregisterLinkMatchers() {
                var _a;
                (_a = this._webLinksAddon) === null || _a === void 0 ? void 0 : _a.dispose();
                this._linkMatchers.forEach(matcherId => {
                    this._xterm.deregisterLinkMatcher(matcherId);
                });
            }
            setWidgetManager(widgetManager) {
                this._widgetManager = widgetManager;
            }
            set processCwd(processCwd) {
                this._processCwd = processCwd;
            }
            registerCustomLinkHandler(regex, handler, matchIndex, validationCallback) {
                const tooltipCallback = (_, linkText, location) => {
                    this._tooltipCallback(linkText, location, text => handler(undefined, text));
                };
                const options = {
                    matchIndex,
                    tooltipCallback,
                    willLinkActivate: (e) => this._isLinkActivationModifierDown(e),
                    priority: CUSTOM_LINK_PRIORITY
                };
                if (validationCallback) {
                    options.validationCallback = (uri, callback) => validationCallback(uri, callback);
                }
                return this._xterm.registerLinkMatcher(regex, this._wrapLinkHandler(handler), options);
            }
            registerWebLinkHandler() {
                this._terminalInstanceService.getXtermWebLinksConstructor().then((WebLinksAddon) => {
                    if (!this._xterm) {
                        return;
                    }
                    const wrappedHandler = this._wrapLinkHandler((_, link) => this._handleHypertextLink(link));
                    const tooltipCallback = (_, linkText, location) => {
                        this._tooltipCallback(linkText, location, this._handleHypertextLink.bind(this));
                    };
                    this._webLinksAddon = new WebLinksAddon(wrappedHandler, {
                        validationCallback: (uri, callback) => this._validateWebLink(callback),
                        tooltipCallback,
                        willLinkActivate: (e) => this._isLinkActivationModifierDown(e)
                    });
                    this._xterm.loadAddon(this._webLinksAddon);
                });
            }
            registerLocalLinkHandler() {
                const wrappedHandler = this._wrapLinkHandler((_, url) => this._handleLocalLink(url));
                const tooltipCallback = (event, linkText, location) => {
                    this._tooltipCallback(linkText, location, this._handleLocalLink.bind(this));
                };
                this._linkMatchers.push(this._xterm.registerLinkMatcher(this._localLinkRegex, wrappedHandler, {
                    validationCallback: (uri, callback) => this._validateLocalLink(uri, callback),
                    tooltipCallback,
                    willLinkActivate: (e) => this._isLinkActivationModifierDown(e),
                    priority: LOCAL_LINK_PRIORITY
                }));
            }
            registerGitDiffLinkHandlers() {
                const wrappedHandler = this._wrapLinkHandler((_, url) => {
                    this._handleLocalLink(url);
                });
                const tooltipCallback = (event, linkText, location) => {
                    this._tooltipCallback(linkText, location, this._handleLocalLink.bind(this));
                };
                const options = {
                    matchIndex: 1,
                    validationCallback: (uri, callback) => this._validateLocalLink(uri, callback),
                    tooltipCallback,
                    willLinkActivate: (e) => this._isLinkActivationModifierDown(e),
                    priority: LOCAL_LINK_PRIORITY
                };
                this._linkMatchers.push(this._xterm.registerLinkMatcher(this._gitDiffPreImagePattern, wrappedHandler, options));
                this._linkMatchers.push(this._xterm.registerLinkMatcher(this._gitDiffPostImagePattern, wrappedHandler, options));
            }
            registerLinkProvider() {
                // Protocol links
                const wrappedActivateCallback = this._wrapLinkHandler((_, link) => this._handleProtocolLink(link));
                const protocolProvider = this._instantiationService.createInstance(terminalProtocolLinkProvider_1.TerminalProtocolLinkProvider, this._xterm, wrappedActivateCallback, this._tooltipCallback2.bind(this));
                this._linkProviders.push(this._xterm.registerLinkProvider(protocolProvider));
                // Validated local links
                if (this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).enableFileLinks) {
                    const wrappedTextLinkActivateCallback = this._wrapLinkHandler((_, link) => this._handleLocalLink(link));
                    const validatedProvider = this._instantiationService.createInstance(terminalValidatedLocalLinkProvider_1.TerminalValidatedLocalLinkProvider, this._xterm, this._processManager.os || platform_1.OS, wrappedTextLinkActivateCallback, this._wrapLinkHandler.bind(this), this._tooltipCallback2.bind(this), async (link, cb) => cb(await this._resolvePath(link)));
                    this._linkProviders.push(this._xterm.registerLinkProvider(validatedProvider));
                }
                // Word links
                const wordProvider = this._instantiationService.createInstance(terminalWordLinkProvider_1.TerminalWordLinkProvider, this._xterm, this._wrapLinkHandler.bind(this), this._tooltipCallback2.bind(this));
                this._linkProviders.push(this._xterm.registerLinkProvider(wordProvider));
            }
            _wrapLinkHandler(handler) {
                return async (event, link) => {
                    // Prevent default electron link handling so Alt+Click mode works normally
                    event === null || event === void 0 ? void 0 : event.preventDefault();
                    // Require correct modifier on click
                    if (event && !this._isLinkActivationModifierDown(event)) {
                        return;
                    }
                    // Allow the link to be intercepted if there are listeners
                    if (this._hasBeforeHandleLinkListeners) {
                        const wasHandled = await this._triggerBeforeHandleLinkListeners(link);
                        if (!wasHandled) {
                            handler(event, link);
                        }
                        return;
                    }
                    // Just call the handler if there is no before listener
                    handler(event, link);
                };
            }
            async _triggerBeforeHandleLinkListeners(link) {
                return new Promise(r => {
                    const timeoutId = setTimeout(() => {
                        canceled = true;
                        this._logService.error(`An extension intecepted a terminal link but it timed out after ${TerminalLinkManager.LINK_INTERCEPT_THRESHOLD / 1000} seconds`);
                        r(false);
                    }, TerminalLinkManager.LINK_INTERCEPT_THRESHOLD);
                    let canceled = false;
                    const resolve = (handled) => {
                        if (!canceled) {
                            clearTimeout(timeoutId);
                            r(handled);
                        }
                    };
                    this._onBeforeHandleLink.fire({ link, resolve });
                });
            }
            get _localLinkRegex() {
                if (!this._processManager) {
                    throw new Error('Process manager is required');
                }
                const baseLocalLinkClause = this._processManager.os === 1 /* Windows */ ? winLocalLinkClause : unixLocalLinkClause;
                // Append line and column number regex
                return new RegExp(`${baseLocalLinkClause}(${lineAndColumnClause})`);
            }
            get _gitDiffPreImageRegex() {
                return this._gitDiffPreImagePattern;
            }
            get _gitDiffPostImageRegex() {
                return this._gitDiffPostImagePattern;
            }
            async _handleLocalLink(link) {
                // TODO: This gets resolved again but doesn't need to as it's already validated
                const resolvedLink = await this._resolvePath(link);
                if (!resolvedLink) {
                    return;
                }
                const lineColumnInfo = this.extractLineColumnInfo(link);
                const selection = {
                    startLineNumber: lineColumnInfo.lineNumber,
                    startColumn: lineColumnInfo.columnNumber
                };
                await this._editorService.openEditor({ resource: resolvedLink.uri, options: { pinned: true, selection } });
            }
            _validateLocalLink(link, callback) {
                this._resolvePath(link).then(resolvedLink => callback(!!resolvedLink));
            }
            _validateWebLink(callback) {
                callback(true);
            }
            _handleHypertextLink(url) {
                this._openerService.open(url, { allowTunneling: !!(this._processManager && this._processManager.remoteAuthority) });
            }
            async _handleProtocolLink(link) {
                // Check if it's a file:/// link, hand off to local link handler so to open an editor and
                // respect line/col attachment
                const uri = uri_1.URI.parse(link);
                if (uri.scheme === 'file') {
                    this._handleLocalLink(uri.fsPath);
                    return;
                }
                // Open as a web link if it's not a file
                this._handleHypertextLink(link);
            }
            _isLinkActivationModifierDown(event) {
                const editorConf = this._configurationService.getValue('editor');
                if (editorConf.multiCursorModifier === 'ctrlCmd') {
                    return !!event.altKey;
                }
                return platform_1.isMacintosh ? event.metaKey : event.ctrlKey;
            }
            _getLinkHoverString(uri, label) {
                const editorConf = this._configurationService.getValue('editor');
                let clickLabel = '';
                if (editorConf.multiCursorModifier === 'ctrlCmd') {
                    if (platform_1.isMacintosh) {
                        clickLabel = nls.localize('terminalLinkHandler.followLinkAlt.mac', "option + click");
                    }
                    else {
                        clickLabel = nls.localize('terminalLinkHandler.followLinkAlt', "alt + click");
                    }
                }
                else {
                    if (platform_1.isMacintosh) {
                        clickLabel = nls.localize('terminalLinkHandler.followLinkCmd', "cmd + click");
                    }
                    else {
                        clickLabel = nls.localize('terminalLinkHandler.followLinkCtrl', "ctrl + click");
                    }
                }
                return new htmlContent_1.MarkdownString(`[${label || nls.localize('followLink', "Follow Link")}](${uri}) (${clickLabel})`, true);
            }
            get osPath() {
                if (!this._processManager) {
                    throw new Error('Process manager is required');
                }
                if (this._processManager.os === 1 /* Windows */) {
                    return path_1.win32;
                }
                return path_1.posix;
            }
            _preprocessPath(link) {
                if (!this._processManager) {
                    throw new Error('Process manager is required');
                }
                if (link.charAt(0) === '~') {
                    // Resolve ~ -> userHome
                    if (!this._processManager.userHome) {
                        return null;
                    }
                    link = this.osPath.join(this._processManager.userHome, link.substring(1));
                }
                else if (link.charAt(0) !== '/' && link.charAt(0) !== '~') {
                    // Resolve workspace path . | .. | <relative_path> -> <path>/. | <path>/.. | <path>/<relative_path>
                    if (this._processManager.os === 1 /* Windows */) {
                        if (!link.match('^' + winDrivePrefix) && !link.startsWith('\\\\?\\')) {
                            if (!this._processCwd) {
                                // Abort if no workspace is open
                                return null;
                            }
                            link = this.osPath.join(this._processCwd, link);
                        }
                        else {
                            // Remove \\?\ from paths so that they share the same underlying
                            // uri and don't open multiple tabs for the same file
                            link = link.replace(/^\\\\\?\\/, '');
                        }
                    }
                    else {
                        if (!this._processCwd) {
                            // Abort if no workspace is open
                            return null;
                        }
                        link = this.osPath.join(this._processCwd, link);
                    }
                }
                link = this.osPath.normalize(link);
                return link;
            }
            async _resolvePath(link) {
                if (!this._processManager) {
                    throw new Error('Process manager is required');
                }
                const preprocessedLink = this._preprocessPath(link);
                if (!preprocessedLink) {
                    return undefined;
                }
                const linkUrl = this.extractLinkUrl(preprocessedLink);
                if (!linkUrl) {
                    return undefined;
                }
                try {
                    let uri;
                    if (this._processManager.remoteAuthority) {
                        uri = uri_1.URI.from({
                            scheme: remoteHosts_1.REMOTE_HOST_SCHEME,
                            authority: this._processManager.remoteAuthority,
                            path: linkUrl
                        });
                    }
                    else {
                        uri = uri_1.URI.file(linkUrl);
                    }
                    try {
                        const stat = await this._fileService.resolve(uri);
                        return { uri, isDirectory: stat.isDirectory };
                    }
                    catch (e) {
                        // Does not exist
                        return undefined;
                    }
                }
                catch (_a) {
                    // Errors in parsing the path
                    return undefined;
                }
            }
            /**
             * Returns line and column number of URl if that is present.
             *
             * @param link Url link which may contain line and column number.
             */
            extractLineColumnInfo(link) {
                const matches = this._localLinkRegex.exec(link);
                const lineColumnInfo = {
                    lineNumber: 1,
                    columnNumber: 1
                };
                if (!matches || !this._processManager) {
                    return lineColumnInfo;
                }
                const lineAndColumnMatchIndex = this._processManager.os === 1 /* Windows */ ? winLineAndColumnMatchIndex : unixLineAndColumnMatchIndex;
                for (let i = 0; i < lineAndColumnClause.length; i++) {
                    const lineMatchIndex = lineAndColumnMatchIndex + (lineAndColumnClauseGroupCount * i);
                    const rowNumber = matches[lineMatchIndex];
                    if (rowNumber) {
                        lineColumnInfo['lineNumber'] = parseInt(rowNumber, 10);
                        // Check if column number exists
                        const columnNumber = matches[lineMatchIndex + 2];
                        if (columnNumber) {
                            lineColumnInfo['columnNumber'] = parseInt(columnNumber, 10);
                        }
                        break;
                    }
                }
                return lineColumnInfo;
            }
            /**
             * Returns url from link as link may contain line and column information.
             *
             * @param link url link which may contain line and column number.
             */
            extractLinkUrl(link) {
                const matches = this._localLinkRegex.exec(link);
                if (!matches) {
                    return null;
                }
                return matches[1];
            }
        };
        TerminalLinkManager._LINK_INTERCEPT_THRESHOLD = terminal_2.LINK_INTERCEPT_THRESHOLD;
        TerminalLinkManager.LINK_INTERCEPT_THRESHOLD = TerminalLinkManager._LINK_INTERCEPT_THRESHOLD;
        TerminalLinkManager = __decorate([
            __param(3, opener_1.IOpenerService),
            __param(4, editorService_1.IEditorService),
            __param(5, configuration_1.IConfigurationService),
            __param(6, terminal_2.ITerminalInstanceService),
            __param(7, files_1.IFileService),
            __param(8, log_1.ILogService),
            __param(9, instantiation_1.IInstantiationService)
        ], TerminalLinkManager);
        return TerminalLinkManager;
    })();
    exports.TerminalLinkManager = TerminalLinkManager;
});
//# sourceMappingURL=terminalLinkManager.js.map