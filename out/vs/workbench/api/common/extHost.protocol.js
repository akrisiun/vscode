/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, uri_1, proxyIdentifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var UIKind;
    (function (UIKind) {
        UIKind[UIKind["Desktop"] = 1] = "Desktop";
        UIKind[UIKind["Web"] = 2] = "Web";
    })(UIKind = exports.UIKind || (exports.UIKind = {}));
    var TextEditorRevealType;
    (function (TextEditorRevealType) {
        TextEditorRevealType[TextEditorRevealType["Default"] = 0] = "Default";
        TextEditorRevealType[TextEditorRevealType["InCenter"] = 1] = "InCenter";
        TextEditorRevealType[TextEditorRevealType["InCenterIfOutsideViewport"] = 2] = "InCenterIfOutsideViewport";
        TextEditorRevealType[TextEditorRevealType["AtTop"] = 3] = "AtTop";
    })(TextEditorRevealType = exports.TextEditorRevealType || (exports.TextEditorRevealType = {}));
    var ObjectIdentifier;
    (function (ObjectIdentifier) {
        ObjectIdentifier.name = '$ident';
        function mixin(obj, id) {
            Object.defineProperty(obj, ObjectIdentifier.name, { value: id, enumerable: true });
            return obj;
        }
        ObjectIdentifier.mixin = mixin;
        function of(obj) {
            return obj[ObjectIdentifier.name];
        }
        ObjectIdentifier.of = of;
    })(ObjectIdentifier = exports.ObjectIdentifier || (exports.ObjectIdentifier = {}));
    class IdObject {
        static mixin(object) {
            object._id = IdObject._n++;
            return object;
        }
    }
    exports.IdObject = IdObject;
    IdObject._n = 0;
    var ISuggestDataDtoField;
    (function (ISuggestDataDtoField) {
        ISuggestDataDtoField["label"] = "a";
        ISuggestDataDtoField["kind"] = "b";
        ISuggestDataDtoField["detail"] = "c";
        ISuggestDataDtoField["documentation"] = "d";
        ISuggestDataDtoField["sortText"] = "e";
        ISuggestDataDtoField["filterText"] = "f";
        ISuggestDataDtoField["preselect"] = "g";
        ISuggestDataDtoField["insertText"] = "h";
        ISuggestDataDtoField["insertTextRules"] = "i";
        ISuggestDataDtoField["range"] = "j";
        ISuggestDataDtoField["commitCharacters"] = "k";
        ISuggestDataDtoField["additionalTextEdits"] = "l";
        ISuggestDataDtoField["command"] = "m";
        ISuggestDataDtoField["kindModifier"] = "n";
    })(ISuggestDataDtoField = exports.ISuggestDataDtoField || (exports.ISuggestDataDtoField = {}));
    function reviveWorkspaceEditDto(data) {
        if (data && data.edits) {
            for (const edit of data.edits) {
                if (typeof edit.resource === 'object') {
                    edit.resource = uri_1.URI.revive(edit.resource);
                }
                else {
                    edit.newUri = uri_1.URI.revive(edit.newUri);
                    edit.oldUri = uri_1.URI.revive(edit.oldUri);
                }
            }
        }
        return data;
    }
    exports.reviveWorkspaceEditDto = reviveWorkspaceEditDto;
    // --- proxy identifiers
    exports.MainContext = {
        MainThreadClipboard: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadClipboard'),
        MainThreadCommands: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadCommands'),
        MainThreadComments: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadComments'),
        MainThreadConfiguration: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadConfiguration'),
        MainThreadConsole: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadConsole'),
        MainThreadDebugService: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadDebugService'),
        MainThreadDecorations: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadDecorations'),
        MainThreadDiagnostics: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadDiagnostics'),
        MainThreadDialogs: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadDiaglogs'),
        MainThreadDocuments: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadDocuments'),
        MainThreadDocumentContentProviders: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadDocumentContentProviders'),
        MainThreadTextEditors: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadTextEditors'),
        MainThreadEditorInsets: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadEditorInsets'),
        MainThreadErrors: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadErrors'),
        MainThreadTreeViews: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadTreeViews'),
        MainThreadDownloadService: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadDownloadService'),
        MainThreadKeytar: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadKeytar'),
        MainThreadLanguageFeatures: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadLanguageFeatures'),
        MainThreadLanguages: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadLanguages'),
        MainThreadLog: proxyIdentifier_1.createMainContextProxyIdentifier('MainThread'),
        MainThreadMessageService: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadMessageService'),
        MainThreadOutputService: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadOutputService'),
        MainThreadProgress: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadProgress'),
        MainThreadQuickOpen: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadQuickOpen'),
        MainThreadStatusBar: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadStatusBar'),
        MainThreadStorage: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadStorage'),
        MainThreadTelemetry: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadTelemetry'),
        MainThreadTerminalService: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadTerminalService'),
        MainThreadWebviews: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadWebviews'),
        MainThreadUrls: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadUrls'),
        MainThreadWorkspace: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadWorkspace'),
        MainThreadFileSystem: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadFileSystem'),
        MainThreadExtensionService: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadExtensionService'),
        MainThreadSCM: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadSCM'),
        MainThreadSearch: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadSearch'),
        MainThreadTask: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadTask'),
        MainThreadWindow: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadWindow'),
        MainThreadLabelService: proxyIdentifier_1.createMainContextProxyIdentifier('MainThreadLabelService')
    };
    exports.ExtHostContext = {
        ExtHostCommands: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostCommands'),
        ExtHostConfiguration: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostConfiguration'),
        ExtHostDiagnostics: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostDiagnostics'),
        ExtHostDebugService: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostDebugService'),
        ExtHostDecorations: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostDecorations'),
        ExtHostDocumentsAndEditors: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostDocumentsAndEditors'),
        ExtHostDocuments: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostDocuments'),
        ExtHostDocumentContentProviders: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostDocumentContentProviders'),
        ExtHostDocumentSaveParticipant: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostDocumentSaveParticipant'),
        ExtHostEditors: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostEditors'),
        ExtHostTreeViews: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostTreeViews'),
        ExtHostFileSystem: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostFileSystem'),
        ExtHostFileSystemEventService: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostFileSystemEventService'),
        ExtHostLanguageFeatures: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostLanguageFeatures'),
        ExtHostQuickOpen: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostQuickOpen'),
        ExtHostExtensionService: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostExtensionService'),
        ExtHostLogService: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostLogService'),
        ExtHostTerminalService: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostTerminalService'),
        ExtHostSCM: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostSCM'),
        ExtHostSearch: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostSearch'),
        ExtHostTask: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostTask'),
        ExtHostWorkspace: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostWorkspace'),
        ExtHostWindow: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostWindow'),
        ExtHostWebviews: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostWebviews'),
        ExtHostEditorInsets: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostEditorInsets'),
        ExtHostProgress: proxyIdentifier_1.createMainContextProxyIdentifier('ExtHostProgress'),
        ExtHostComments: proxyIdentifier_1.createMainContextProxyIdentifier('ExtHostComments'),
        ExtHostStorage: proxyIdentifier_1.createMainContextProxyIdentifier('ExtHostStorage'),
        ExtHostUrls: proxyIdentifier_1.createExtHostContextProxyIdentifier('ExtHostUrls'),
        ExtHostOutputService: proxyIdentifier_1.createMainContextProxyIdentifier('ExtHostOutputService'),
        ExtHosLabelService: proxyIdentifier_1.createMainContextProxyIdentifier('ExtHostLabelService')
    };
});
//# sourceMappingURL=extHost.protocol.js.map