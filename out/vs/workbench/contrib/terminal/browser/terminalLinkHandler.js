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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/opener/common/opener", "vs/workbench/contrib/terminal/browser/terminalWidgetManager", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/platform/files/common/files", "vs/platform/remote/common/remoteHosts", "vs/base/common/path", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/platform"], function (require, exports, nls, uri_1, lifecycle_1, opener_1, terminalWidgetManager_1, configuration_1, editorService_1, files_1, remoteHosts_1, path_1, terminal_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const pathPrefix = '(\\.\\.?|\\~)';
    const pathSeparatorClause = '\\/';
    // '":; are allowed in paths but they are often separators so ignore them
    // Also disallow \\ to prevent a catastropic backtracking case #24798
    const excludedPathCharactersClause = '[^\\0\\s!$`&*()\\[\\]+\'":;\\\\]';
    /** A regex that matches paths in the form /foo, ~/foo, ./foo, ../foo, foo/bar */
    const unixLocalLinkClause = '((' + pathPrefix + '|(' + excludedPathCharactersClause + ')+)?(' + pathSeparatorClause + '(' + excludedPathCharactersClause + ')+)+)';
    const winDrivePrefix = '[a-zA-Z]:';
    const winPathPrefix = '(' + winDrivePrefix + '|\\.\\.?|\\~)';
    const winPathSeparatorClause = '(\\\\|\\/)';
    const winExcludedPathCharactersClause = '[^\\0<>\\?\\|\\/\\s!$`&*()\\[\\]+\'":;]';
    /** A regex that matches paths in the form c:\foo, ~\foo, .\foo, ..\foo, foo\bar */
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
    let TerminalLinkHandler = class TerminalLinkHandler {
        constructor(_xterm, _processManager, _configHelper, _openerService, _editorService, _configurationService, _terminalInstanceService, _fileService) {
            this._xterm = _xterm;
            this._processManager = _processManager;
            this._configHelper = _configHelper;
            this._openerService = _openerService;
            this._editorService = _editorService;
            this._configurationService = _configurationService;
            this._terminalInstanceService = _terminalInstanceService;
            this._fileService = _fileService;
            this._hoverDisposables = new lifecycle_1.DisposableStore();
            // Matches '--- a/src/file1', capturing 'src/file1' in group 1
            this._gitDiffPreImagePattern = /^--- a\/(\S*)/;
            // Matches '+++ b/src/file1', capturing 'src/file1' in group 1
            this._gitDiffPostImagePattern = /^\+\+\+ b\/(\S*)/;
            this._tooltipCallback = (e, uri, location) => {
                if (!this._widgetManager) {
                    return;
                }
                // Get the row bottom up
                let offsetRow = this._xterm.rows - location.start.y;
                let verticalAlignment = terminalWidgetManager_1.WidgetVerticalAlignment.Bottom;
                // Show the tooltip on the top of the next row to avoid obscuring the first row
                if (location.start.y <= 0) {
                    offsetRow = this._xterm.rows - 1;
                    verticalAlignment = terminalWidgetManager_1.WidgetVerticalAlignment.Top;
                    // The start of the wrapped line is above the viewport, move to start of the line
                    if (location.start.y < 0) {
                        location.start.x = 0;
                    }
                }
                if (this._configHelper.config.rendererType === 'dom') {
                    const font = this._configHelper.getFont();
                    const charWidth = font.charWidth;
                    const charHeight = font.charHeight;
                    const leftPosition = location.start.x * (charWidth + (font.letterSpacing / window.devicePixelRatio));
                    const bottomPosition = offsetRow * (Math.ceil(charHeight * window.devicePixelRatio) * font.lineHeight) / window.devicePixelRatio;
                    this._widgetManager.showMessage(leftPosition, bottomPosition, this._getLinkHoverString(), verticalAlignment);
                }
                else {
                    const target = e.target;
                    const colWidth = target.offsetWidth / this._xterm.cols;
                    const rowHeight = target.offsetHeight / this._xterm.rows;
                    const leftPosition = location.start.x * colWidth;
                    const bottomPosition = offsetRow * rowHeight;
                    this._widgetManager.showMessage(leftPosition, bottomPosition, this._getLinkHoverString(), verticalAlignment);
                }
            };
            this._leaveCallback = () => {
                if (this._widgetManager) {
                    this._widgetManager.closeMessage();
                }
            };
            this.registerWebLinkHandler();
            if (this._processManager) {
                if (this._configHelper.config.enableFileLinks) {
                    this.registerLocalLinkHandler();
                }
                this.registerGitDiffLinkHandlers();
            }
        }
        setWidgetManager(widgetManager) {
            this._widgetManager = widgetManager;
        }
        set processCwd(processCwd) {
            this._processCwd = processCwd;
        }
        registerCustomLinkHandler(regex, handler, matchIndex, validationCallback) {
            const options = {
                matchIndex,
                tooltipCallback: this._tooltipCallback,
                leaveCallback: this._leaveCallback,
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
                const wrappedHandler = this._wrapLinkHandler(uri => {
                    this._handleHypertextLink(uri);
                });
                this._xterm.loadAddon(new WebLinksAddon(wrappedHandler, {
                    validationCallback: (uri, callback) => this._validateWebLink(uri, callback),
                    tooltipCallback: this._tooltipCallback,
                    leaveCallback: this._leaveCallback,
                    willLinkActivate: (e) => this._isLinkActivationModifierDown(e)
                }));
            });
        }
        registerLocalLinkHandler() {
            const wrappedHandler = this._wrapLinkHandler(url => {
                this._handleLocalLink(url);
            });
            this._xterm.registerLinkMatcher(this._localLinkRegex, wrappedHandler, {
                validationCallback: (uri, callback) => this._validateLocalLink(uri, callback),
                tooltipCallback: this._tooltipCallback,
                leaveCallback: this._leaveCallback,
                willLinkActivate: (e) => this._isLinkActivationModifierDown(e),
                priority: LOCAL_LINK_PRIORITY
            });
        }
        registerGitDiffLinkHandlers() {
            const wrappedHandler = this._wrapLinkHandler(url => {
                this._handleLocalLink(url);
            });
            const options = {
                matchIndex: 1,
                validationCallback: (uri, callback) => this._validateLocalLink(uri, callback),
                tooltipCallback: this._tooltipCallback,
                leaveCallback: this._leaveCallback,
                willLinkActivate: (e) => this._isLinkActivationModifierDown(e),
                priority: LOCAL_LINK_PRIORITY
            };
            this._xterm.registerLinkMatcher(this._gitDiffPreImagePattern, wrappedHandler, options);
            this._xterm.registerLinkMatcher(this._gitDiffPostImagePattern, wrappedHandler, options);
        }
        dispose() {
            this._hoverDisposables.dispose();
        }
        _wrapLinkHandler(handler) {
            return (event, uri) => {
                // Prevent default electron link handling so Alt+Click mode works normally
                event.preventDefault();
                // Require correct modifier on click
                if (!this._isLinkActivationModifierDown(event)) {
                    return false;
                }
                return handler(uri);
            };
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
        _handleLocalLink(link) {
            return this._resolvePath(link).then(resolvedLink => {
                if (!resolvedLink) {
                    return Promise.resolve(null);
                }
                const lineColumnInfo = this.extractLineColumnInfo(link);
                const selection = {
                    startLineNumber: lineColumnInfo.lineNumber,
                    startColumn: lineColumnInfo.columnNumber
                };
                return this._editorService.openEditor({ resource: resolvedLink, options: { pinned: true, selection } });
            });
        }
        _validateLocalLink(link, callback) {
            this._resolvePath(link).then(resolvedLink => callback(!!resolvedLink));
        }
        _validateWebLink(link, callback) {
            callback(true);
        }
        _handleHypertextLink(url) {
            const uri = uri_1.URI.parse(url);
            this._openerService.open(uri, { allowTunneling: !!(this._processManager && this._processManager.remoteAuthority) });
        }
        _isLinkActivationModifierDown(event) {
            const editorConf = this._configurationService.getValue('editor');
            if (editorConf.multiCursorModifier === 'ctrlCmd') {
                return !!event.altKey;
            }
            return platform_1.isMacintosh ? event.metaKey : event.ctrlKey;
        }
        _getLinkHoverString() {
            const editorConf = this._configurationService.getValue('editor');
            if (editorConf.multiCursorModifier === 'ctrlCmd') {
                if (platform_1.isMacintosh) {
                    return nls.localize('terminalLinkHandler.followLinkAlt.mac', "Option + click to follow link");
                }
                else {
                    return nls.localize('terminalLinkHandler.followLinkAlt', "Alt + click to follow link");
                }
            }
            if (platform_1.isMacintosh) {
                return nls.localize('terminalLinkHandler.followLinkCmd', "Cmd + click to follow link");
            }
            return nls.localize('terminalLinkHandler.followLinkCtrl', "Ctrl + click to follow link");
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
                    if (!link.match('^' + winDrivePrefix)) {
                        if (!this._processCwd) {
                            // Abort if no workspace is open
                            return null;
                        }
                        link = this.osPath.join(this._processCwd, link);
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
        _resolvePath(link) {
            if (!this._processManager) {
                throw new Error('Process manager is required');
            }
            const preprocessedLink = this._preprocessPath(link);
            if (!preprocessedLink) {
                return Promise.resolve(null);
            }
            const linkUrl = this.extractLinkUrl(preprocessedLink);
            if (!linkUrl) {
                return Promise.resolve(null);
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
                return this._fileService.resolve(uri).then(stat => {
                    if (stat.isDirectory) {
                        return null;
                    }
                    return uri;
                }).catch(() => {
                    // Does not exist
                    return null;
                });
            }
            catch (_a) {
                // Errors in parsing the path
                return Promise.resolve(null);
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
    TerminalLinkHandler = __decorate([
        __param(3, opener_1.IOpenerService),
        __param(4, editorService_1.IEditorService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, terminal_1.ITerminalInstanceService),
        __param(7, files_1.IFileService)
    ], TerminalLinkHandler);
    exports.TerminalLinkHandler = TerminalLinkHandler;
});
//# sourceMappingURL=terminalLinkHandler.js.map