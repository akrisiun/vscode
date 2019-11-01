/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/modes", "./extHostTypes", "vs/base/common/uri", "vs/base/common/htmlContent", "vs/platform/markers/common/markers", "vs/workbench/services/editor/common/editorService", "vs/base/common/types", "vs/base/common/marked/marked", "vs/base/common/marshalling", "vs/base/common/objects", "vs/platform/log/common/log", "vs/base/common/arrays"], function (require, exports, modes, types, uri_1, htmlContent, markers_1, editorService_1, types_1, marked, marshalling_1, objects_1, log_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Selection;
    (function (Selection) {
        function to(selection) {
            const { selectionStartLineNumber, selectionStartColumn, positionLineNumber, positionColumn } = selection;
            const start = new types.Position(selectionStartLineNumber - 1, selectionStartColumn - 1);
            const end = new types.Position(positionLineNumber - 1, positionColumn - 1);
            return new types.Selection(start, end);
        }
        Selection.to = to;
        function from(selection) {
            const { anchor, active } = selection;
            return {
                selectionStartLineNumber: anchor.line + 1,
                selectionStartColumn: anchor.character + 1,
                positionLineNumber: active.line + 1,
                positionColumn: active.character + 1
            };
        }
        Selection.from = from;
    })(Selection = exports.Selection || (exports.Selection = {}));
    var Range;
    (function (Range) {
        function from(range) {
            if (!range) {
                return undefined;
            }
            const { start, end } = range;
            return {
                startLineNumber: start.line + 1,
                startColumn: start.character + 1,
                endLineNumber: end.line + 1,
                endColumn: end.character + 1
            };
        }
        Range.from = from;
        function to(range) {
            if (!range) {
                return undefined;
            }
            const { startLineNumber, startColumn, endLineNumber, endColumn } = range;
            return new types.Range(startLineNumber - 1, startColumn - 1, endLineNumber - 1, endColumn - 1);
        }
        Range.to = to;
    })(Range = exports.Range || (exports.Range = {}));
    var Position;
    (function (Position) {
        function to(position) {
            return new types.Position(position.lineNumber - 1, position.column - 1);
        }
        Position.to = to;
        function from(position) {
            return { lineNumber: position.line + 1, column: position.character + 1 };
        }
        Position.from = from;
    })(Position = exports.Position || (exports.Position = {}));
    var DiagnosticTag;
    (function (DiagnosticTag) {
        function from(value) {
            switch (value) {
                case types.DiagnosticTag.Unnecessary:
                    return 1 /* Unnecessary */;
                case types.DiagnosticTag.Deprecated:
                    return 2 /* Deprecated */;
            }
            return undefined;
        }
        DiagnosticTag.from = from;
        function to(value) {
            switch (value) {
                case 1 /* Unnecessary */:
                    return types.DiagnosticTag.Unnecessary;
                case 2 /* Deprecated */:
                    return types.DiagnosticTag.Deprecated;
            }
            return undefined;
        }
        DiagnosticTag.to = to;
    })(DiagnosticTag = exports.DiagnosticTag || (exports.DiagnosticTag = {}));
    var Diagnostic;
    (function (Diagnostic) {
        function from(value) {
            return Object.assign(Object.assign({}, Range.from(value.range)), { message: value.message, source: value.source, code: types_1.isString(value.code) || types_1.isNumber(value.code) ? String(value.code) : undefined, severity: DiagnosticSeverity.from(value.severity), relatedInformation: value.relatedInformation && value.relatedInformation.map(DiagnosticRelatedInformation.from), tags: Array.isArray(value.tags) ? arrays_1.coalesce(value.tags.map(DiagnosticTag.from)) : undefined });
        }
        Diagnostic.from = from;
        function to(value) {
            const res = new types.Diagnostic(Range.to(value), value.message, DiagnosticSeverity.to(value.severity));
            res.source = value.source;
            res.code = value.code;
            res.relatedInformation = value.relatedInformation && value.relatedInformation.map(DiagnosticRelatedInformation.to);
            res.tags = value.tags && arrays_1.coalesce(value.tags.map(DiagnosticTag.to));
            return res;
        }
        Diagnostic.to = to;
    })(Diagnostic = exports.Diagnostic || (exports.Diagnostic = {}));
    var DiagnosticRelatedInformation;
    (function (DiagnosticRelatedInformation) {
        function from(value) {
            return Object.assign(Object.assign({}, Range.from(value.location.range)), { message: value.message, resource: value.location.uri });
        }
        DiagnosticRelatedInformation.from = from;
        function to(value) {
            return new types.DiagnosticRelatedInformation(new types.Location(value.resource, Range.to(value)), value.message);
        }
        DiagnosticRelatedInformation.to = to;
    })(DiagnosticRelatedInformation = exports.DiagnosticRelatedInformation || (exports.DiagnosticRelatedInformation = {}));
    var DiagnosticSeverity;
    (function (DiagnosticSeverity) {
        function from(value) {
            switch (value) {
                case types.DiagnosticSeverity.Error:
                    return markers_1.MarkerSeverity.Error;
                case types.DiagnosticSeverity.Warning:
                    return markers_1.MarkerSeverity.Warning;
                case types.DiagnosticSeverity.Information:
                    return markers_1.MarkerSeverity.Info;
                case types.DiagnosticSeverity.Hint:
                    return markers_1.MarkerSeverity.Hint;
            }
            return markers_1.MarkerSeverity.Error;
        }
        DiagnosticSeverity.from = from;
        function to(value) {
            switch (value) {
                case markers_1.MarkerSeverity.Info:
                    return types.DiagnosticSeverity.Information;
                case markers_1.MarkerSeverity.Warning:
                    return types.DiagnosticSeverity.Warning;
                case markers_1.MarkerSeverity.Error:
                    return types.DiagnosticSeverity.Error;
                case markers_1.MarkerSeverity.Hint:
                    return types.DiagnosticSeverity.Hint;
            }
            return types.DiagnosticSeverity.Error;
        }
        DiagnosticSeverity.to = to;
    })(DiagnosticSeverity = exports.DiagnosticSeverity || (exports.DiagnosticSeverity = {}));
    var ViewColumn;
    (function (ViewColumn) {
        function from(column) {
            if (typeof column === 'number' && column >= types.ViewColumn.One) {
                return column - 1; // adjust zero index (ViewColumn.ONE => 0)
            }
            if (column === types.ViewColumn.Beside) {
                return editorService_1.SIDE_GROUP;
            }
            return editorService_1.ACTIVE_GROUP; // default is always the active group
        }
        ViewColumn.from = from;
        function to(position) {
            if (typeof position === 'number' && position >= 0) {
                return position + 1; // adjust to index (ViewColumn.ONE => 1)
            }
            throw new Error(`invalid 'EditorViewColumn'`);
        }
        ViewColumn.to = to;
    })(ViewColumn = exports.ViewColumn || (exports.ViewColumn = {}));
    function isDecorationOptions(something) {
        return (typeof something.range !== 'undefined');
    }
    function isDecorationOptionsArr(something) {
        if (something.length === 0) {
            return true;
        }
        return isDecorationOptions(something[0]) ? true : false;
    }
    exports.isDecorationOptionsArr = isDecorationOptionsArr;
    var MarkdownString;
    (function (MarkdownString) {
        function fromMany(markup) {
            return markup.map(MarkdownString.from);
        }
        MarkdownString.fromMany = fromMany;
        function isCodeblock(thing) {
            return thing && typeof thing === 'object'
                && typeof thing.language === 'string'
                && typeof thing.value === 'string';
        }
        function from(markup) {
            let res;
            if (isCodeblock(markup)) {
                const { language, value } = markup;
                res = { value: '```' + language + '\n' + value + '\n```\n' };
            }
            else if (htmlContent.isMarkdownString(markup)) {
                res = markup;
            }
            else if (typeof markup === 'string') {
                res = { value: markup };
            }
            else {
                res = { value: '' };
            }
            // extract uris into a separate object
            const resUris = Object.create(null);
            res.uris = resUris;
            const collectUri = (href) => {
                try {
                    let uri = uri_1.URI.parse(href, true);
                    uri = uri.with({ query: _uriMassage(uri.query, resUris) });
                    resUris[href] = uri;
                }
                catch (e) {
                    // ignore
                }
                return '';
            };
            const renderer = new marked.Renderer();
            renderer.link = collectUri;
            renderer.image = href => collectUri(htmlContent.parseHrefAndDimensions(href).href);
            marked(res.value, { renderer });
            return res;
        }
        MarkdownString.from = from;
        function _uriMassage(part, bucket) {
            if (!part) {
                return part;
            }
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
                if (value instanceof uri_1.URI) {
                    const key = `__uri_${Math.random().toString(16).slice(2, 8)}`;
                    bucket[key] = value;
                    return key;
                }
                else {
                    return undefined;
                }
            });
            return encodeURIComponent(JSON.stringify(data));
        }
        function to(value) {
            const ret = new htmlContent.MarkdownString(value.value);
            ret.isTrusted = value.isTrusted;
            return ret;
        }
        MarkdownString.to = to;
        function fromStrict(value) {
            if (!value) {
                return undefined;
            }
            return typeof value === 'string' ? value : MarkdownString.from(value);
        }
        MarkdownString.fromStrict = fromStrict;
    })(MarkdownString = exports.MarkdownString || (exports.MarkdownString = {}));
    function fromRangeOrRangeWithMessage(ranges) {
        if (isDecorationOptionsArr(ranges)) {
            return ranges.map((r) => {
                return {
                    range: Range.from(r.range),
                    hoverMessage: Array.isArray(r.hoverMessage)
                        ? MarkdownString.fromMany(r.hoverMessage)
                        : (r.hoverMessage ? MarkdownString.from(r.hoverMessage) : undefined),
                    renderOptions: r.renderOptions
                };
            });
        }
        else {
            return ranges.map((r) => {
                return {
                    range: Range.from(r)
                };
            });
        }
    }
    exports.fromRangeOrRangeWithMessage = fromRangeOrRangeWithMessage;
    function pathOrURIToURI(value) {
        if (typeof value === 'undefined') {
            return value;
        }
        if (typeof value === 'string') {
            return uri_1.URI.file(value);
        }
        else {
            return value;
        }
    }
    exports.pathOrURIToURI = pathOrURIToURI;
    var ThemableDecorationAttachmentRenderOptions;
    (function (ThemableDecorationAttachmentRenderOptions) {
        function from(options) {
            if (typeof options === 'undefined') {
                return options;
            }
            return {
                contentText: options.contentText,
                contentIconPath: options.contentIconPath ? pathOrURIToURI(options.contentIconPath) : undefined,
                border: options.border,
                borderColor: options.borderColor,
                fontStyle: options.fontStyle,
                fontWeight: options.fontWeight,
                textDecoration: options.textDecoration,
                color: options.color,
                backgroundColor: options.backgroundColor,
                margin: options.margin,
                width: options.width,
                height: options.height,
            };
        }
        ThemableDecorationAttachmentRenderOptions.from = from;
    })(ThemableDecorationAttachmentRenderOptions = exports.ThemableDecorationAttachmentRenderOptions || (exports.ThemableDecorationAttachmentRenderOptions = {}));
    var ThemableDecorationRenderOptions;
    (function (ThemableDecorationRenderOptions) {
        function from(options) {
            if (typeof options === 'undefined') {
                return options;
            }
            return {
                backgroundColor: options.backgroundColor,
                outline: options.outline,
                outlineColor: options.outlineColor,
                outlineStyle: options.outlineStyle,
                outlineWidth: options.outlineWidth,
                border: options.border,
                borderColor: options.borderColor,
                borderRadius: options.borderRadius,
                borderSpacing: options.borderSpacing,
                borderStyle: options.borderStyle,
                borderWidth: options.borderWidth,
                fontStyle: options.fontStyle,
                fontWeight: options.fontWeight,
                textDecoration: options.textDecoration,
                cursor: options.cursor,
                color: options.color,
                opacity: options.opacity,
                letterSpacing: options.letterSpacing,
                gutterIconPath: options.gutterIconPath ? pathOrURIToURI(options.gutterIconPath) : undefined,
                gutterIconSize: options.gutterIconSize,
                overviewRulerColor: options.overviewRulerColor,
                before: options.before ? ThemableDecorationAttachmentRenderOptions.from(options.before) : undefined,
                after: options.after ? ThemableDecorationAttachmentRenderOptions.from(options.after) : undefined,
            };
        }
        ThemableDecorationRenderOptions.from = from;
    })(ThemableDecorationRenderOptions = exports.ThemableDecorationRenderOptions || (exports.ThemableDecorationRenderOptions = {}));
    var DecorationRangeBehavior;
    (function (DecorationRangeBehavior) {
        function from(value) {
            if (typeof value === 'undefined') {
                return value;
            }
            switch (value) {
                case types.DecorationRangeBehavior.OpenOpen:
                    return 0 /* AlwaysGrowsWhenTypingAtEdges */;
                case types.DecorationRangeBehavior.ClosedClosed:
                    return 1 /* NeverGrowsWhenTypingAtEdges */;
                case types.DecorationRangeBehavior.OpenClosed:
                    return 2 /* GrowsOnlyWhenTypingBefore */;
                case types.DecorationRangeBehavior.ClosedOpen:
                    return 3 /* GrowsOnlyWhenTypingAfter */;
            }
        }
        DecorationRangeBehavior.from = from;
    })(DecorationRangeBehavior = exports.DecorationRangeBehavior || (exports.DecorationRangeBehavior = {}));
    var DecorationRenderOptions;
    (function (DecorationRenderOptions) {
        function from(options) {
            return {
                isWholeLine: options.isWholeLine,
                rangeBehavior: options.rangeBehavior ? DecorationRangeBehavior.from(options.rangeBehavior) : undefined,
                overviewRulerLane: options.overviewRulerLane,
                light: options.light ? ThemableDecorationRenderOptions.from(options.light) : undefined,
                dark: options.dark ? ThemableDecorationRenderOptions.from(options.dark) : undefined,
                backgroundColor: options.backgroundColor,
                outline: options.outline,
                outlineColor: options.outlineColor,
                outlineStyle: options.outlineStyle,
                outlineWidth: options.outlineWidth,
                border: options.border,
                borderColor: options.borderColor,
                borderRadius: options.borderRadius,
                borderSpacing: options.borderSpacing,
                borderStyle: options.borderStyle,
                borderWidth: options.borderWidth,
                fontStyle: options.fontStyle,
                fontWeight: options.fontWeight,
                textDecoration: options.textDecoration,
                cursor: options.cursor,
                color: options.color,
                opacity: options.opacity,
                letterSpacing: options.letterSpacing,
                gutterIconPath: options.gutterIconPath ? pathOrURIToURI(options.gutterIconPath) : undefined,
                gutterIconSize: options.gutterIconSize,
                overviewRulerColor: options.overviewRulerColor,
                before: options.before ? ThemableDecorationAttachmentRenderOptions.from(options.before) : undefined,
                after: options.after ? ThemableDecorationAttachmentRenderOptions.from(options.after) : undefined,
            };
        }
        DecorationRenderOptions.from = from;
    })(DecorationRenderOptions = exports.DecorationRenderOptions || (exports.DecorationRenderOptions = {}));
    var TextEdit;
    (function (TextEdit) {
        function from(edit) {
            return {
                text: edit.newText,
                eol: edit.newEol && EndOfLine.from(edit.newEol),
                range: Range.from(edit.range)
            };
        }
        TextEdit.from = from;
        function to(edit) {
            const result = new types.TextEdit(Range.to(edit.range), edit.text);
            result.newEol = (typeof edit.eol === 'undefined' ? undefined : EndOfLine.to(edit.eol));
            return result;
        }
        TextEdit.to = to;
    })(TextEdit = exports.TextEdit || (exports.TextEdit = {}));
    var WorkspaceEdit;
    (function (WorkspaceEdit) {
        function from(value, documents) {
            const result = {
                edits: []
            };
            for (const entry of value._allEntries()) {
                const [uri, uriOrEdits] = entry;
                if (Array.isArray(uriOrEdits)) {
                    // text edits
                    const doc = documents && uri ? documents.getDocument(uri) : undefined;
                    result.edits.push({ resource: uri, modelVersionId: doc && doc.version, edits: uriOrEdits.map(TextEdit.from) });
                }
                else {
                    // resource edits
                    result.edits.push({ oldUri: uri, newUri: uriOrEdits, options: entry[2] });
                }
            }
            return result;
        }
        WorkspaceEdit.from = from;
        function to(value) {
            const result = new types.WorkspaceEdit();
            for (const edit of value.edits) {
                if (Array.isArray(edit.edits)) {
                    result.set(uri_1.URI.revive(edit.resource), edit.edits.map(TextEdit.to));
                }
                else {
                    result.renameFile(uri_1.URI.revive(edit.oldUri), uri_1.URI.revive(edit.newUri), edit.options);
                }
            }
            return result;
        }
        WorkspaceEdit.to = to;
    })(WorkspaceEdit = exports.WorkspaceEdit || (exports.WorkspaceEdit = {}));
    var SymbolKind;
    (function (SymbolKind) {
        const _fromMapping = Object.create(null);
        _fromMapping[types.SymbolKind.File] = 0 /* File */;
        _fromMapping[types.SymbolKind.Module] = 1 /* Module */;
        _fromMapping[types.SymbolKind.Namespace] = 2 /* Namespace */;
        _fromMapping[types.SymbolKind.Package] = 3 /* Package */;
        _fromMapping[types.SymbolKind.Class] = 4 /* Class */;
        _fromMapping[types.SymbolKind.Method] = 5 /* Method */;
        _fromMapping[types.SymbolKind.Property] = 6 /* Property */;
        _fromMapping[types.SymbolKind.Field] = 7 /* Field */;
        _fromMapping[types.SymbolKind.Constructor] = 8 /* Constructor */;
        _fromMapping[types.SymbolKind.Enum] = 9 /* Enum */;
        _fromMapping[types.SymbolKind.Interface] = 10 /* Interface */;
        _fromMapping[types.SymbolKind.Function] = 11 /* Function */;
        _fromMapping[types.SymbolKind.Variable] = 12 /* Variable */;
        _fromMapping[types.SymbolKind.Constant] = 13 /* Constant */;
        _fromMapping[types.SymbolKind.String] = 14 /* String */;
        _fromMapping[types.SymbolKind.Number] = 15 /* Number */;
        _fromMapping[types.SymbolKind.Boolean] = 16 /* Boolean */;
        _fromMapping[types.SymbolKind.Array] = 17 /* Array */;
        _fromMapping[types.SymbolKind.Object] = 18 /* Object */;
        _fromMapping[types.SymbolKind.Key] = 19 /* Key */;
        _fromMapping[types.SymbolKind.Null] = 20 /* Null */;
        _fromMapping[types.SymbolKind.EnumMember] = 21 /* EnumMember */;
        _fromMapping[types.SymbolKind.Struct] = 22 /* Struct */;
        _fromMapping[types.SymbolKind.Event] = 23 /* Event */;
        _fromMapping[types.SymbolKind.Operator] = 24 /* Operator */;
        _fromMapping[types.SymbolKind.TypeParameter] = 25 /* TypeParameter */;
        function from(kind) {
            return typeof _fromMapping[kind] === 'number' ? _fromMapping[kind] : 6 /* Property */;
        }
        SymbolKind.from = from;
        function to(kind) {
            for (const k in _fromMapping) {
                if (_fromMapping[k] === kind) {
                    return Number(k);
                }
            }
            return types.SymbolKind.Property;
        }
        SymbolKind.to = to;
    })(SymbolKind = exports.SymbolKind || (exports.SymbolKind = {}));
    var SymbolTag;
    (function (SymbolTag) {
        function from(kind) {
            switch (kind) {
                case types.SymbolTag.Deprecated: return 1 /* Deprecated */;
            }
        }
        SymbolTag.from = from;
        function to(kind) {
            switch (kind) {
                case 1 /* Deprecated */: return types.SymbolTag.Deprecated;
            }
        }
        SymbolTag.to = to;
    })(SymbolTag = exports.SymbolTag || (exports.SymbolTag = {}));
    var WorkspaceSymbol;
    (function (WorkspaceSymbol) {
        function from(info) {
            return {
                name: info.name,
                kind: SymbolKind.from(info.kind),
                tags: info.tags && info.tags.map(SymbolTag.from),
                containerName: info.containerName,
                location: location.from(info.location)
            };
        }
        WorkspaceSymbol.from = from;
        function to(info) {
            const result = new types.SymbolInformation(info.name, SymbolKind.to(info.kind), info.containerName, location.to(info.location));
            result.tags = info.tags && info.tags.map(SymbolTag.to);
            return result;
        }
        WorkspaceSymbol.to = to;
    })(WorkspaceSymbol = exports.WorkspaceSymbol || (exports.WorkspaceSymbol = {}));
    var DocumentSymbol;
    (function (DocumentSymbol) {
        function from(info) {
            const result = {
                name: info.name || '!!MISSING: name!!',
                detail: info.detail,
                range: Range.from(info.range),
                selectionRange: Range.from(info.selectionRange),
                kind: SymbolKind.from(info.kind),
                tags: info.tags ? info.tags.map(SymbolTag.from) : []
            };
            if (info.children) {
                result.children = info.children.map(from);
            }
            return result;
        }
        DocumentSymbol.from = from;
        function to(info) {
            const result = new types.DocumentSymbol(info.name, info.detail, SymbolKind.to(info.kind), Range.to(info.range), Range.to(info.selectionRange));
            if (arrays_1.isNonEmptyArray(info.tags)) {
                result.tags = info.tags.map(SymbolTag.to);
            }
            if (info.children) {
                result.children = info.children.map(to);
            }
            return result;
        }
        DocumentSymbol.to = to;
    })(DocumentSymbol = exports.DocumentSymbol || (exports.DocumentSymbol = {}));
    var CallHierarchyItem;
    (function (CallHierarchyItem) {
        function from(item) {
            return {
                name: item.name,
                detail: item.detail,
                kind: SymbolKind.from(item.kind),
                uri: item.uri,
                range: Range.from(item.range),
                selectionRange: Range.from(item.selectionRange),
            };
        }
        CallHierarchyItem.from = from;
        function to(item) {
            return new types.CallHierarchyItem(SymbolKind.to(item.kind), item.name, item.detail || '', uri_1.URI.revive(item.uri), Range.to(item.range), Range.to(item.selectionRange));
        }
        CallHierarchyItem.to = to;
    })(CallHierarchyItem = exports.CallHierarchyItem || (exports.CallHierarchyItem = {}));
    var location;
    (function (location) {
        function from(value) {
            return {
                range: value.range && Range.from(value.range),
                uri: value.uri
            };
        }
        location.from = from;
        function to(value) {
            return new types.Location(value.uri, Range.to(value.range));
        }
        location.to = to;
    })(location = exports.location || (exports.location = {}));
    var DefinitionLink;
    (function (DefinitionLink) {
        function from(value) {
            const definitionLink = value;
            const location = value;
            return {
                originSelectionRange: definitionLink.originSelectionRange
                    ? Range.from(definitionLink.originSelectionRange)
                    : undefined,
                uri: definitionLink.targetUri ? definitionLink.targetUri : location.uri,
                range: Range.from(definitionLink.targetRange ? definitionLink.targetRange : location.range),
                targetSelectionRange: definitionLink.targetSelectionRange
                    ? Range.from(definitionLink.targetSelectionRange)
                    : undefined,
            };
        }
        DefinitionLink.from = from;
    })(DefinitionLink = exports.DefinitionLink || (exports.DefinitionLink = {}));
    var Hover;
    (function (Hover) {
        function from(hover) {
            return {
                range: Range.from(hover.range),
                contents: MarkdownString.fromMany(hover.contents)
            };
        }
        Hover.from = from;
        function to(info) {
            return new types.Hover(info.contents.map(MarkdownString.to), Range.to(info.range));
        }
        Hover.to = to;
    })(Hover = exports.Hover || (exports.Hover = {}));
    var DocumentHighlight;
    (function (DocumentHighlight) {
        function from(documentHighlight) {
            return {
                range: Range.from(documentHighlight.range),
                kind: documentHighlight.kind
            };
        }
        DocumentHighlight.from = from;
        function to(occurrence) {
            return new types.DocumentHighlight(Range.to(occurrence.range), occurrence.kind);
        }
        DocumentHighlight.to = to;
    })(DocumentHighlight = exports.DocumentHighlight || (exports.DocumentHighlight = {}));
    var CompletionTriggerKind;
    (function (CompletionTriggerKind) {
        function to(kind) {
            switch (kind) {
                case 1 /* TriggerCharacter */:
                    return types.CompletionTriggerKind.TriggerCharacter;
                case 2 /* TriggerForIncompleteCompletions */:
                    return types.CompletionTriggerKind.TriggerForIncompleteCompletions;
                case 0 /* Invoke */:
                default:
                    return types.CompletionTriggerKind.Invoke;
            }
        }
        CompletionTriggerKind.to = to;
    })(CompletionTriggerKind = exports.CompletionTriggerKind || (exports.CompletionTriggerKind = {}));
    var CompletionContext;
    (function (CompletionContext) {
        function to(context) {
            return {
                triggerKind: CompletionTriggerKind.to(context.triggerKind),
                triggerCharacter: context.triggerCharacter
            };
        }
        CompletionContext.to = to;
    })(CompletionContext = exports.CompletionContext || (exports.CompletionContext = {}));
    var CompletionItemTag;
    (function (CompletionItemTag) {
        function from(kind) {
            switch (kind) {
                case types.CompletionItemTag.Deprecated: return 1 /* Deprecated */;
            }
        }
        CompletionItemTag.from = from;
        function to(kind) {
            switch (kind) {
                case 1 /* Deprecated */: return types.CompletionItemTag.Deprecated;
            }
        }
        CompletionItemTag.to = to;
    })(CompletionItemTag = exports.CompletionItemTag || (exports.CompletionItemTag = {}));
    var CompletionItemKind;
    (function (CompletionItemKind) {
        function from(kind) {
            switch (kind) {
                case types.CompletionItemKind.Method: return 0 /* Method */;
                case types.CompletionItemKind.Function: return 1 /* Function */;
                case types.CompletionItemKind.Constructor: return 2 /* Constructor */;
                case types.CompletionItemKind.Field: return 3 /* Field */;
                case types.CompletionItemKind.Variable: return 4 /* Variable */;
                case types.CompletionItemKind.Class: return 5 /* Class */;
                case types.CompletionItemKind.Interface: return 7 /* Interface */;
                case types.CompletionItemKind.Struct: return 6 /* Struct */;
                case types.CompletionItemKind.Module: return 8 /* Module */;
                case types.CompletionItemKind.Property: return 9 /* Property */;
                case types.CompletionItemKind.Unit: return 12 /* Unit */;
                case types.CompletionItemKind.Value: return 13 /* Value */;
                case types.CompletionItemKind.Constant: return 14 /* Constant */;
                case types.CompletionItemKind.Enum: return 15 /* Enum */;
                case types.CompletionItemKind.EnumMember: return 16 /* EnumMember */;
                case types.CompletionItemKind.Keyword: return 17 /* Keyword */;
                case types.CompletionItemKind.Snippet: return 25 /* Snippet */;
                case types.CompletionItemKind.Text: return 18 /* Text */;
                case types.CompletionItemKind.Color: return 19 /* Color */;
                case types.CompletionItemKind.File: return 20 /* File */;
                case types.CompletionItemKind.Reference: return 21 /* Reference */;
                case types.CompletionItemKind.Folder: return 23 /* Folder */;
                case types.CompletionItemKind.Event: return 10 /* Event */;
                case types.CompletionItemKind.Operator: return 11 /* Operator */;
                case types.CompletionItemKind.TypeParameter: return 24 /* TypeParameter */;
            }
            return 9 /* Property */;
        }
        CompletionItemKind.from = from;
        function to(kind) {
            switch (kind) {
                case 0 /* Method */: return types.CompletionItemKind.Method;
                case 1 /* Function */: return types.CompletionItemKind.Function;
                case 2 /* Constructor */: return types.CompletionItemKind.Constructor;
                case 3 /* Field */: return types.CompletionItemKind.Field;
                case 4 /* Variable */: return types.CompletionItemKind.Variable;
                case 5 /* Class */: return types.CompletionItemKind.Class;
                case 7 /* Interface */: return types.CompletionItemKind.Interface;
                case 6 /* Struct */: return types.CompletionItemKind.Struct;
                case 8 /* Module */: return types.CompletionItemKind.Module;
                case 9 /* Property */: return types.CompletionItemKind.Property;
                case 12 /* Unit */: return types.CompletionItemKind.Unit;
                case 13 /* Value */: return types.CompletionItemKind.Value;
                case 14 /* Constant */: return types.CompletionItemKind.Constant;
                case 15 /* Enum */: return types.CompletionItemKind.Enum;
                case 16 /* EnumMember */: return types.CompletionItemKind.EnumMember;
                case 17 /* Keyword */: return types.CompletionItemKind.Keyword;
                case 25 /* Snippet */: return types.CompletionItemKind.Snippet;
                case 18 /* Text */: return types.CompletionItemKind.Text;
                case 19 /* Color */: return types.CompletionItemKind.Color;
                case 20 /* File */: return types.CompletionItemKind.File;
                case 21 /* Reference */: return types.CompletionItemKind.Reference;
                case 23 /* Folder */: return types.CompletionItemKind.Folder;
                case 10 /* Event */: return types.CompletionItemKind.Event;
                case 11 /* Operator */: return types.CompletionItemKind.Operator;
                case 24 /* TypeParameter */: return types.CompletionItemKind.TypeParameter;
            }
            return types.CompletionItemKind.Property;
        }
        CompletionItemKind.to = to;
    })(CompletionItemKind = exports.CompletionItemKind || (exports.CompletionItemKind = {}));
    var CompletionItem;
    (function (CompletionItem) {
        function to(suggestion) {
            const result = new types.CompletionItem(suggestion.label);
            result.insertText = suggestion.insertText;
            result.kind = CompletionItemKind.to(suggestion.kind);
            result.tags = suggestion.tags && suggestion.tags.map(CompletionItemTag.to);
            result.detail = suggestion.detail;
            result.documentation = htmlContent.isMarkdownString(suggestion.documentation) ? MarkdownString.to(suggestion.documentation) : suggestion.documentation;
            result.sortText = suggestion.sortText;
            result.filterText = suggestion.filterText;
            result.preselect = suggestion.preselect;
            result.commitCharacters = suggestion.commitCharacters;
            result.range = Range.to(suggestion.range);
            result.keepWhitespace = typeof suggestion.insertTextRules === 'undefined' ? false : Boolean(suggestion.insertTextRules & 1 /* KeepWhitespace */);
            // 'inserText'-logic
            if (typeof suggestion.insertTextRules !== 'undefined' && suggestion.insertTextRules & 4 /* InsertAsSnippet */) {
                result.insertText = new types.SnippetString(suggestion.insertText);
            }
            else {
                result.insertText = suggestion.insertText;
                result.textEdit = new types.TextEdit(result.range, result.insertText);
            }
            // TODO additionalEdits, command
            return result;
        }
        CompletionItem.to = to;
    })(CompletionItem = exports.CompletionItem || (exports.CompletionItem = {}));
    var ParameterInformation;
    (function (ParameterInformation) {
        function from(info) {
            return {
                label: info.label,
                documentation: info.documentation ? MarkdownString.fromStrict(info.documentation) : undefined
            };
        }
        ParameterInformation.from = from;
        function to(info) {
            return {
                label: info.label,
                documentation: htmlContent.isMarkdownString(info.documentation) ? MarkdownString.to(info.documentation) : info.documentation
            };
        }
        ParameterInformation.to = to;
    })(ParameterInformation = exports.ParameterInformation || (exports.ParameterInformation = {}));
    var SignatureInformation;
    (function (SignatureInformation) {
        function from(info) {
            return {
                label: info.label,
                documentation: info.documentation ? MarkdownString.fromStrict(info.documentation) : undefined,
                parameters: Array.isArray(info.parameters) ? info.parameters.map(ParameterInformation.from) : []
            };
        }
        SignatureInformation.from = from;
        function to(info) {
            return {
                label: info.label,
                documentation: htmlContent.isMarkdownString(info.documentation) ? MarkdownString.to(info.documentation) : info.documentation,
                parameters: Array.isArray(info.parameters) ? info.parameters.map(ParameterInformation.to) : []
            };
        }
        SignatureInformation.to = to;
    })(SignatureInformation = exports.SignatureInformation || (exports.SignatureInformation = {}));
    var SignatureHelp;
    (function (SignatureHelp) {
        function from(help) {
            return {
                activeSignature: help.activeSignature,
                activeParameter: help.activeParameter,
                signatures: Array.isArray(help.signatures) ? help.signatures.map(SignatureInformation.from) : [],
            };
        }
        SignatureHelp.from = from;
        function to(help) {
            return {
                activeSignature: help.activeSignature,
                activeParameter: help.activeParameter,
                signatures: Array.isArray(help.signatures) ? help.signatures.map(SignatureInformation.to) : [],
            };
        }
        SignatureHelp.to = to;
    })(SignatureHelp = exports.SignatureHelp || (exports.SignatureHelp = {}));
    var DocumentLink;
    (function (DocumentLink) {
        function from(link) {
            return {
                range: Range.from(link.range),
                url: link.target,
                tooltip: link.tooltip
            };
        }
        DocumentLink.from = from;
        function to(link) {
            let target = undefined;
            if (link.url) {
                try {
                    target = typeof link.url === 'string' ? uri_1.URI.parse(link.url, true) : uri_1.URI.revive(link.url);
                }
                catch (err) {
                    // ignore
                }
            }
            return new types.DocumentLink(Range.to(link.range), target);
        }
        DocumentLink.to = to;
    })(DocumentLink = exports.DocumentLink || (exports.DocumentLink = {}));
    var ColorPresentation;
    (function (ColorPresentation) {
        function to(colorPresentation) {
            const cp = new types.ColorPresentation(colorPresentation.label);
            if (colorPresentation.textEdit) {
                cp.textEdit = TextEdit.to(colorPresentation.textEdit);
            }
            if (colorPresentation.additionalTextEdits) {
                cp.additionalTextEdits = colorPresentation.additionalTextEdits.map(value => TextEdit.to(value));
            }
            return cp;
        }
        ColorPresentation.to = to;
        function from(colorPresentation) {
            return {
                label: colorPresentation.label,
                textEdit: colorPresentation.textEdit ? TextEdit.from(colorPresentation.textEdit) : undefined,
                additionalTextEdits: colorPresentation.additionalTextEdits ? colorPresentation.additionalTextEdits.map(value => TextEdit.from(value)) : undefined
            };
        }
        ColorPresentation.from = from;
    })(ColorPresentation = exports.ColorPresentation || (exports.ColorPresentation = {}));
    var Color;
    (function (Color) {
        function to(c) {
            return new types.Color(c[0], c[1], c[2], c[3]);
        }
        Color.to = to;
        function from(color) {
            return [color.red, color.green, color.blue, color.alpha];
        }
        Color.from = from;
    })(Color = exports.Color || (exports.Color = {}));
    var SelectionRange;
    (function (SelectionRange) {
        function from(obj) {
            return { range: Range.from(obj.range) };
        }
        SelectionRange.from = from;
        function to(obj) {
            return new types.SelectionRange(Range.to(obj.range));
        }
        SelectionRange.to = to;
    })(SelectionRange = exports.SelectionRange || (exports.SelectionRange = {}));
    var TextDocumentSaveReason;
    (function (TextDocumentSaveReason) {
        function to(reason) {
            switch (reason) {
                case 2 /* AUTO */:
                    return types.TextDocumentSaveReason.AfterDelay;
                case 1 /* EXPLICIT */:
                    return types.TextDocumentSaveReason.Manual;
                case 3 /* FOCUS_CHANGE */:
                case 4 /* WINDOW_CHANGE */:
                    return types.TextDocumentSaveReason.FocusOut;
            }
        }
        TextDocumentSaveReason.to = to;
    })(TextDocumentSaveReason = exports.TextDocumentSaveReason || (exports.TextDocumentSaveReason = {}));
    var TextEditorLineNumbersStyle;
    (function (TextEditorLineNumbersStyle) {
        function from(style) {
            switch (style) {
                case types.TextEditorLineNumbersStyle.Off:
                    return 0 /* Off */;
                case types.TextEditorLineNumbersStyle.Relative:
                    return 2 /* Relative */;
                case types.TextEditorLineNumbersStyle.On:
                default:
                    return 1 /* On */;
            }
        }
        TextEditorLineNumbersStyle.from = from;
        function to(style) {
            switch (style) {
                case 0 /* Off */:
                    return types.TextEditorLineNumbersStyle.Off;
                case 2 /* Relative */:
                    return types.TextEditorLineNumbersStyle.Relative;
                case 1 /* On */:
                default:
                    return types.TextEditorLineNumbersStyle.On;
            }
        }
        TextEditorLineNumbersStyle.to = to;
    })(TextEditorLineNumbersStyle = exports.TextEditorLineNumbersStyle || (exports.TextEditorLineNumbersStyle = {}));
    var EndOfLine;
    (function (EndOfLine) {
        function from(eol) {
            if (eol === types.EndOfLine.CRLF) {
                return 1 /* CRLF */;
            }
            else if (eol === types.EndOfLine.LF) {
                return 0 /* LF */;
            }
            return undefined;
        }
        EndOfLine.from = from;
        function to(eol) {
            if (eol === 1 /* CRLF */) {
                return types.EndOfLine.CRLF;
            }
            else if (eol === 0 /* LF */) {
                return types.EndOfLine.LF;
            }
            return undefined;
        }
        EndOfLine.to = to;
    })(EndOfLine = exports.EndOfLine || (exports.EndOfLine = {}));
    var ProgressLocation;
    (function (ProgressLocation) {
        function from(loc) {
            switch (loc) {
                case types.ProgressLocation.SourceControl: return 3 /* Scm */;
                case types.ProgressLocation.Window: return 10 /* Window */;
                case types.ProgressLocation.Notification: return 15 /* Notification */;
            }
            throw new Error(`Unknown 'ProgressLocation'`);
        }
        ProgressLocation.from = from;
    })(ProgressLocation = exports.ProgressLocation || (exports.ProgressLocation = {}));
    var FoldingRange;
    (function (FoldingRange) {
        function from(r) {
            const range = { start: r.start + 1, end: r.end + 1 };
            if (r.kind) {
                range.kind = FoldingRangeKind.from(r.kind);
            }
            return range;
        }
        FoldingRange.from = from;
    })(FoldingRange = exports.FoldingRange || (exports.FoldingRange = {}));
    var FoldingRangeKind;
    (function (FoldingRangeKind) {
        function from(kind) {
            if (kind) {
                switch (kind) {
                    case types.FoldingRangeKind.Comment:
                        return modes.FoldingRangeKind.Comment;
                    case types.FoldingRangeKind.Imports:
                        return modes.FoldingRangeKind.Imports;
                    case types.FoldingRangeKind.Region:
                        return modes.FoldingRangeKind.Region;
                }
            }
            return undefined;
        }
        FoldingRangeKind.from = from;
    })(FoldingRangeKind = exports.FoldingRangeKind || (exports.FoldingRangeKind = {}));
    var TextEditorOptions;
    (function (TextEditorOptions) {
        function from(options) {
            if (options) {
                return {
                    pinned: typeof options.preview === 'boolean' ? !options.preview : undefined,
                    preserveFocus: options.preserveFocus,
                    selection: typeof options.selection === 'object' ? Range.from(options.selection) : undefined
                };
            }
            return undefined;
        }
        TextEditorOptions.from = from;
    })(TextEditorOptions = exports.TextEditorOptions || (exports.TextEditorOptions = {}));
    var GlobPattern;
    (function (GlobPattern) {
        function from(pattern) {
            if (pattern instanceof types.RelativePattern) {
                return pattern;
            }
            if (typeof pattern === 'string') {
                return pattern;
            }
            if (isRelativePattern(pattern)) {
                return new types.RelativePattern(pattern.base, pattern.pattern);
            }
            return pattern; // preserve `undefined` and `null`
        }
        GlobPattern.from = from;
        function isRelativePattern(obj) {
            const rp = obj;
            return rp && typeof rp.base === 'string' && typeof rp.pattern === 'string';
        }
    })(GlobPattern = exports.GlobPattern || (exports.GlobPattern = {}));
    var LanguageSelector;
    (function (LanguageSelector) {
        function from(selector) {
            if (!selector) {
                return undefined;
            }
            else if (Array.isArray(selector)) {
                return selector.map(from);
            }
            else if (typeof selector === 'string') {
                return selector;
            }
            else {
                return {
                    language: selector.language,
                    scheme: selector.scheme,
                    pattern: typeof selector.pattern === 'undefined' ? undefined : GlobPattern.from(selector.pattern),
                    exclusive: selector.exclusive
                };
            }
        }
        LanguageSelector.from = from;
    })(LanguageSelector = exports.LanguageSelector || (exports.LanguageSelector = {}));
    var LogLevel;
    (function (LogLevel) {
        function from(extLevel) {
            switch (extLevel) {
                case types.LogLevel.Trace:
                    return log_1.LogLevel.Trace;
                case types.LogLevel.Debug:
                    return log_1.LogLevel.Debug;
                case types.LogLevel.Info:
                    return log_1.LogLevel.Info;
                case types.LogLevel.Warning:
                    return log_1.LogLevel.Warning;
                case types.LogLevel.Error:
                    return log_1.LogLevel.Error;
                case types.LogLevel.Critical:
                    return log_1.LogLevel.Critical;
                case types.LogLevel.Off:
                    return log_1.LogLevel.Off;
            }
            return log_1.LogLevel.Info;
        }
        LogLevel.from = from;
        function to(mainLevel) {
            switch (mainLevel) {
                case log_1.LogLevel.Trace:
                    return types.LogLevel.Trace;
                case log_1.LogLevel.Debug:
                    return types.LogLevel.Debug;
                case log_1.LogLevel.Info:
                    return types.LogLevel.Info;
                case log_1.LogLevel.Warning:
                    return types.LogLevel.Warning;
                case log_1.LogLevel.Error:
                    return types.LogLevel.Error;
                case log_1.LogLevel.Critical:
                    return types.LogLevel.Critical;
                case log_1.LogLevel.Off:
                    return types.LogLevel.Off;
            }
            return types.LogLevel.Info;
        }
        LogLevel.to = to;
    })(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
});
//# sourceMappingURL=extHostTypeConverters.js.map