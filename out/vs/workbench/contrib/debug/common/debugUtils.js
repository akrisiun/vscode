/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/path", "vs/base/common/objects"], function (require, exports, strings_1, uri_1, path_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _formatPIIRegexp = /{([^}]+)}/g;
    function formatPII(value, excludePII, args) {
        return value.replace(_formatPIIRegexp, function (match, group) {
            if (excludePII && group.length > 0 && group[0] !== '_') {
                return match;
            }
            return args && args.hasOwnProperty(group) ?
                args[group] :
                match;
        });
    }
    exports.formatPII = formatPII;
    function isSessionAttach(session) {
        return !session.parentSession && session.configuration.request === 'attach' && !isExtensionHostDebugging(session.configuration);
    }
    exports.isSessionAttach = isSessionAttach;
    function isExtensionHostDebugging(config) {
        return config.type && strings_1.equalsIgnoreCase(config.type === 'vslsShare' ? config.adapterProxy.configuration.type : config.type, 'extensionhost');
    }
    exports.isExtensionHostDebugging = isExtensionHostDebugging;
    // only a debugger contributions with a label, program, or runtime attribute is considered a "defining" or "main" debugger contribution
    function isDebuggerMainContribution(dbg) {
        return dbg.type && (dbg.label || dbg.program || dbg.runtime);
    }
    exports.isDebuggerMainContribution = isDebuggerMainContribution;
    function getExactExpressionStartAndEnd(lineContent, looseStart, looseEnd) {
        let matchingExpression = undefined;
        let startOffset = 0;
        // Some example supported expressions: myVar.prop, a.b.c.d, myVar?.prop, myVar->prop, MyClass::StaticProp, *myVar
        // Match any character except a set of characters which often break interesting sub-expressions
        let expression = /([^()\[\]{}<>\s+\-/%~#^;=|,`!]|\->)+/g;
        let result = null;
        // First find the full expression under the cursor
        while (result = expression.exec(lineContent)) {
            let start = result.index + 1;
            let end = start + result[0].length;
            if (start <= looseStart && end >= looseEnd) {
                matchingExpression = result[0];
                startOffset = start;
                break;
            }
        }
        // If there are non-word characters after the cursor, we want to truncate the expression then.
        // For example in expression 'a.b.c.d', if the focus was under 'b', 'a.b' would be evaluated.
        if (matchingExpression) {
            let subExpression = /\w+/g;
            let subExpressionResult = null;
            while (subExpressionResult = subExpression.exec(matchingExpression)) {
                let subEnd = subExpressionResult.index + 1 + startOffset + subExpressionResult[0].length;
                if (subEnd >= looseEnd) {
                    break;
                }
            }
            if (subExpressionResult) {
                matchingExpression = matchingExpression.substring(0, subExpression.lastIndex);
            }
        }
        return matchingExpression ?
            { start: startOffset, end: startOffset + matchingExpression.length - 1 } :
            { start: 0, end: 0 };
    }
    exports.getExactExpressionStartAndEnd = getExactExpressionStartAndEnd;
    // RFC 2396, Appendix A: https://www.ietf.org/rfc/rfc2396.txt
    const _schemePattern = /^[a-zA-Z][a-zA-Z0-9\+\-\.]+:/;
    function isUri(s) {
        // heuristics: a valid uri starts with a scheme and
        // the scheme has at least 2 characters so that it doesn't look like a drive letter.
        return !!(s && s.match(_schemePattern));
    }
    exports.isUri = isUri;
    function stringToUri(path) {
        if (typeof path === 'string') {
            if (isUri(path)) {
                return uri_1.URI.parse(path);
            }
            else {
                // assume path
                if (path_1.isAbsolute(path)) {
                    return uri_1.URI.file(path);
                }
                else {
                    // leave relative path as is
                }
            }
        }
        return path;
    }
    function uriToString(path) {
        if (typeof path === 'object') {
            const u = uri_1.URI.revive(path);
            if (u.scheme === 'file') {
                return u.fsPath;
            }
            else {
                return u.toString();
            }
        }
        return path;
    }
    function convertToDAPaths(message, toUri) {
        const fixPath = toUri ? stringToUri : uriToString;
        // since we modify Source.paths in the message in place, we need to make a copy of it (see #61129)
        const msg = objects_1.deepClone(message);
        convertPaths(msg, (toDA, source) => {
            if (toDA && source) {
                source.path = source.path ? fixPath(source.path) : undefined;
            }
        });
        return msg;
    }
    exports.convertToDAPaths = convertToDAPaths;
    function convertToVSCPaths(message, toUri) {
        const fixPath = toUri ? stringToUri : uriToString;
        // since we modify Source.paths in the message in place, we need to make a copy of it (see #61129)
        const msg = objects_1.deepClone(message);
        convertPaths(msg, (toDA, source) => {
            if (!toDA && source) {
                source.path = source.path ? fixPath(source.path) : undefined;
            }
        });
        return msg;
    }
    exports.convertToVSCPaths = convertToVSCPaths;
    function convertPaths(msg, fixSourcePath) {
        switch (msg.type) {
            case 'event':
                const event = msg;
                switch (event.event) {
                    case 'output':
                        fixSourcePath(false, event.body.source);
                        break;
                    case 'loadedSource':
                        fixSourcePath(false, event.body.source);
                        break;
                    case 'breakpoint':
                        fixSourcePath(false, event.body.breakpoint.source);
                        break;
                    default:
                        break;
                }
                break;
            case 'request':
                const request = msg;
                switch (request.command) {
                    case 'setBreakpoints':
                        fixSourcePath(true, request.arguments.source);
                        break;
                    case 'breakpointLocations':
                        fixSourcePath(true, request.arguments.source);
                        break;
                    case 'source':
                        fixSourcePath(true, request.arguments.source);
                        break;
                    case 'gotoTargets':
                        fixSourcePath(true, request.arguments.source);
                        break;
                    case 'launchVSCode':
                        request.arguments.args.forEach((arg) => fixSourcePath(false, arg));
                        break;
                    default:
                        break;
                }
                break;
            case 'response':
                const response = msg;
                if (response.success) {
                    switch (response.command) {
                        case 'stackTrace':
                            response.body.stackFrames.forEach(frame => fixSourcePath(false, frame.source));
                            break;
                        case 'loadedSources':
                            response.body.sources.forEach(source => fixSourcePath(false, source));
                            break;
                        case 'scopes':
                            response.body.scopes.forEach(scope => fixSourcePath(false, scope.source));
                            break;
                        case 'setFunctionBreakpoints':
                            response.body.breakpoints.forEach(bp => fixSourcePath(false, bp.source));
                            break;
                        case 'setBreakpoints':
                            response.body.breakpoints.forEach(bp => fixSourcePath(false, bp.source));
                            break;
                        default:
                            break;
                    }
                }
                break;
        }
    }
});
//# sourceMappingURL=debugUtils.js.map