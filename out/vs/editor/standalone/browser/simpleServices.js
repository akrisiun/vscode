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
define(["require", "exports", "vs/base/common/strings", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/common/event", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/severity", "vs/base/common/uri", "vs/editor/browser/editorBrowser", "vs/editor/common/config/commonEditorConfig", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/platform/keybinding/common/abstractKeybindingService", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/platform/notification/common/notification", "vs/platform/workspace/common/workspace", "vs/editor/common/standaloneStrings", "vs/base/common/resources"], function (require, exports, strings, dom, keyboardEvent_1, event_1, keyCodes_1, lifecycle_1, platform_1, severity_1, uri_1, editorBrowser_1, commonEditorConfig_1, editOperation_1, position_1, range_1, modes_1, commands_1, configuration_1, configurationModels_1, abstractKeybindingService_1, keybindingResolver_1, keybindingsRegistry_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1, notification_1, workspace_1, standaloneStrings_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SimpleModel {
        constructor(model) {
            this.model = model;
            this._onDispose = new event_1.Emitter();
        }
        get onDispose() {
            return this._onDispose.event;
        }
        load() {
            return Promise.resolve(this);
        }
        get textEditorModel() {
            return this.model;
        }
        createSnapshot() {
            return this.model.createSnapshot();
        }
        isReadonly() {
            return false;
        }
        dispose() {
            this._onDispose.fire();
        }
    }
    exports.SimpleModel = SimpleModel;
    function withTypedEditor(widget, codeEditorCallback, diffEditorCallback) {
        if (editorBrowser_1.isCodeEditor(widget)) {
            // Single Editor
            return codeEditorCallback(widget);
        }
        else {
            // Diff Editor
            return diffEditorCallback(widget);
        }
    }
    class SimpleEditorModelResolverService {
        setEditor(editor) {
            this.editor = editor;
        }
        createModelReference(resource) {
            let model = null;
            if (this.editor) {
                model = withTypedEditor(this.editor, (editor) => this.findModel(editor, resource), (diffEditor) => this.findModel(diffEditor.getOriginalEditor(), resource) || this.findModel(diffEditor.getModifiedEditor(), resource));
            }
            if (!model) {
                return Promise.reject(new Error(`Model not found`));
            }
            return Promise.resolve(new lifecycle_1.ImmortalReference(new SimpleModel(model)));
        }
        registerTextModelContentProvider(scheme, provider) {
            return {
                dispose: function () { }
            };
        }
        hasTextModelContentProvider(scheme) {
            return false;
        }
        findModel(editor, resource) {
            let model = editor.getModel();
            if (model && model.uri.toString() !== resource.toString()) {
                return null;
            }
            return model;
        }
    }
    exports.SimpleEditorModelResolverService = SimpleEditorModelResolverService;
    class SimpleEditorProgressService {
        show() {
            return SimpleEditorProgressService.NULL_PROGRESS_RUNNER;
        }
        showWhile(promise, delay) {
            return Promise.resolve(undefined);
        }
    }
    exports.SimpleEditorProgressService = SimpleEditorProgressService;
    SimpleEditorProgressService.NULL_PROGRESS_RUNNER = {
        done: () => { },
        total: () => { },
        worked: () => { }
    };
    class SimpleDialogService {
        confirm(confirmation) {
            return this.doConfirm(confirmation).then(confirmed => {
                return {
                    confirmed,
                    checkboxChecked: false // unsupported
                };
            });
        }
        doConfirm(confirmation) {
            let messageText = confirmation.message;
            if (confirmation.detail) {
                messageText = messageText + '\n\n' + confirmation.detail;
            }
            return Promise.resolve(window.confirm(messageText));
        }
        show(severity, message, buttons, options) {
            return Promise.resolve({ choice: 0 });
        }
        about() {
            return Promise.resolve(undefined);
        }
    }
    exports.SimpleDialogService = SimpleDialogService;
    class SimpleNotificationService {
        info(message) {
            return this.notify({ severity: severity_1.default.Info, message });
        }
        warn(message) {
            return this.notify({ severity: severity_1.default.Warning, message });
        }
        error(error) {
            return this.notify({ severity: severity_1.default.Error, message: error });
        }
        notify(notification) {
            switch (notification.severity) {
                case severity_1.default.Error:
                    console.error(notification.message);
                    break;
                case severity_1.default.Warning:
                    console.warn(notification.message);
                    break;
                default:
                    console.log(notification.message);
                    break;
            }
            return SimpleNotificationService.NO_OP;
        }
        prompt(severity, message, choices, options) {
            return SimpleNotificationService.NO_OP;
        }
        status(message, options) {
            return lifecycle_1.Disposable.None;
        }
    }
    exports.SimpleNotificationService = SimpleNotificationService;
    SimpleNotificationService.NO_OP = new notification_1.NoOpNotification();
    class StandaloneCommandService {
        constructor(instantiationService) {
            this._onWillExecuteCommand = new event_1.Emitter();
            this._onDidExecuteCommand = new event_1.Emitter();
            this.onWillExecuteCommand = this._onWillExecuteCommand.event;
            this.onDidExecuteCommand = this._onDidExecuteCommand.event;
            this._instantiationService = instantiationService;
            this._dynamicCommands = Object.create(null);
        }
        addCommand(command) {
            const { id } = command;
            this._dynamicCommands[id] = command;
            return lifecycle_1.toDisposable(() => {
                delete this._dynamicCommands[id];
            });
        }
        executeCommand(id, ...args) {
            const command = (commands_1.CommandsRegistry.getCommand(id) || this._dynamicCommands[id]);
            if (!command) {
                return Promise.reject(new Error(`command '${id}' not found`));
            }
            try {
                this._onWillExecuteCommand.fire({ commandId: id, args });
                const result = this._instantiationService.invokeFunction.apply(this._instantiationService, [command.handler, ...args]);
                this._onDidExecuteCommand.fire({ commandId: id, args });
                return Promise.resolve(result);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    }
    exports.StandaloneCommandService = StandaloneCommandService;
    class StandaloneKeybindingService extends abstractKeybindingService_1.AbstractKeybindingService {
        constructor(contextKeyService, commandService, telemetryService, notificationService, domNode) {
            super(contextKeyService, commandService, telemetryService, notificationService);
            this._cachedResolver = null;
            this._dynamicKeybindings = [];
            this._register(dom.addDisposableListener(domNode, dom.EventType.KEY_DOWN, (e) => {
                let keyEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                let shouldPreventDefault = this._dispatch(keyEvent, keyEvent.target);
                if (shouldPreventDefault) {
                    keyEvent.preventDefault();
                }
            }));
        }
        addDynamicKeybinding(commandId, _keybinding, handler, when) {
            const keybinding = keyCodes_1.createKeybinding(_keybinding, platform_1.OS);
            if (!keybinding) {
                throw new Error(`Invalid keybinding`);
            }
            const toDispose = new lifecycle_1.DisposableStore();
            this._dynamicKeybindings.push({
                keybinding: keybinding,
                command: commandId,
                when: when,
                weight1: 1000,
                weight2: 0
            });
            toDispose.add(lifecycle_1.toDisposable(() => {
                for (let i = 0; i < this._dynamicKeybindings.length; i++) {
                    let kb = this._dynamicKeybindings[i];
                    if (kb.command === commandId) {
                        this._dynamicKeybindings.splice(i, 1);
                        this.updateResolver({ source: 1 /* Default */ });
                        return;
                    }
                }
            }));
            let commandService = this._commandService;
            if (commandService instanceof StandaloneCommandService) {
                toDispose.add(commandService.addCommand({
                    id: commandId,
                    handler: handler
                }));
            }
            else {
                throw new Error('Unknown command service!');
            }
            this.updateResolver({ source: 1 /* Default */ });
            return toDispose;
        }
        updateResolver(event) {
            this._cachedResolver = null;
            this._onDidUpdateKeybindings.fire(event);
        }
        _getResolver() {
            if (!this._cachedResolver) {
                const defaults = this._toNormalizedKeybindingItems(keybindingsRegistry_1.KeybindingsRegistry.getDefaultKeybindings(), true);
                const overrides = this._toNormalizedKeybindingItems(this._dynamicKeybindings, false);
                this._cachedResolver = new keybindingResolver_1.KeybindingResolver(defaults, overrides);
            }
            return this._cachedResolver;
        }
        _documentHasFocus() {
            return document.hasFocus();
        }
        _toNormalizedKeybindingItems(items, isDefault) {
            let result = [], resultLen = 0;
            for (const item of items) {
                const when = item.when || undefined;
                const keybinding = item.keybinding;
                if (!keybinding) {
                    // This might be a removal keybinding item in user settings => accept it
                    result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(undefined, item.command, item.commandArgs, when, isDefault);
                }
                else {
                    const resolvedKeybindings = this.resolveKeybinding(keybinding);
                    for (const resolvedKeybinding of resolvedKeybindings) {
                        result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(resolvedKeybinding, item.command, item.commandArgs, when, isDefault);
                    }
                }
            }
            return result;
        }
        resolveKeybinding(keybinding) {
            return [new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(keybinding, platform_1.OS)];
        }
        resolveKeyboardEvent(keyboardEvent) {
            let keybinding = new keyCodes_1.SimpleKeybinding(keyboardEvent.ctrlKey, keyboardEvent.shiftKey, keyboardEvent.altKey, keyboardEvent.metaKey, keyboardEvent.keyCode).toChord();
            return new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(keybinding, platform_1.OS);
        }
        resolveUserBinding(userBinding) {
            return [];
        }
        _dumpDebugInfo() {
            return '';
        }
        _dumpDebugInfoJSON() {
            return '';
        }
    }
    exports.StandaloneKeybindingService = StandaloneKeybindingService;
    function isConfigurationOverrides(thing) {
        return thing
            && typeof thing === 'object'
            && (!thing.overrideIdentifier || typeof thing.overrideIdentifier === 'string')
            && (!thing.resource || thing.resource instanceof uri_1.URI);
    }
    class SimpleConfigurationService {
        constructor() {
            this._onDidChangeConfiguration = new event_1.Emitter();
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._configuration = new configurationModels_1.Configuration(new configurationModels_1.DefaultConfigurationModel(), new configurationModels_1.ConfigurationModel());
        }
        configuration() {
            return this._configuration;
        }
        getValue(arg1, arg2) {
            const section = typeof arg1 === 'string' ? arg1 : undefined;
            const overrides = isConfigurationOverrides(arg1) ? arg1 : isConfigurationOverrides(arg2) ? arg2 : {};
            return this.configuration().getValue(section, overrides, undefined);
        }
        updateValue(key, value, arg3, arg4) {
            this.configuration().updateValue(key, value);
            return Promise.resolve();
        }
        inspect(key, options = {}) {
            return this.configuration().inspect(key, options, undefined);
        }
        keys() {
            return this.configuration().keys(undefined);
        }
        reloadConfiguration() {
            return Promise.resolve(undefined);
        }
        getConfigurationData() {
            const emptyModel = {
                contents: {},
                keys: [],
                overrides: []
            };
            return {
                defaults: emptyModel,
                user: emptyModel,
                workspace: emptyModel,
                folders: []
            };
        }
    }
    exports.SimpleConfigurationService = SimpleConfigurationService;
    class SimpleResourceConfigurationService {
        constructor(configurationService) {
            this.configurationService = configurationService;
            this._onDidChangeConfiguration = new event_1.Emitter();
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.configurationService.onDidChangeConfiguration((e) => {
                this._onDidChangeConfiguration.fire(e);
            });
        }
        getValue(resource, arg2, arg3) {
            const position = position_1.Position.isIPosition(arg2) ? arg2 : null;
            const section = position ? (typeof arg3 === 'string' ? arg3 : undefined) : (typeof arg2 === 'string' ? arg2 : undefined);
            if (typeof section === 'undefined') {
                return this.configurationService.getValue();
            }
            return this.configurationService.getValue(section);
        }
    }
    exports.SimpleResourceConfigurationService = SimpleResourceConfigurationService;
    let SimpleResourcePropertiesService = class SimpleResourcePropertiesService {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        getEOL(resource) {
            const filesConfiguration = this.configurationService.getValue('files');
            if (filesConfiguration && filesConfiguration.eol) {
                if (filesConfiguration.eol !== 'auto') {
                    return filesConfiguration.eol;
                }
            }
            return (platform_1.isLinux || platform_1.isMacintosh) ? '\n' : '\r\n';
        }
    };
    SimpleResourcePropertiesService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], SimpleResourcePropertiesService);
    exports.SimpleResourcePropertiesService = SimpleResourcePropertiesService;
    class StandaloneTelemetryService {
        constructor() {
            this.isOptedIn = false;
        }
        setEnabled(value) {
        }
        publicLog(eventName, data) {
            return Promise.resolve(undefined);
        }
        publicLog2(eventName, data) {
            return this.publicLog(eventName, data);
        }
        getTelemetryInfo() {
            throw new Error(`Not available`);
        }
    }
    exports.StandaloneTelemetryService = StandaloneTelemetryService;
    class SimpleWorkspaceContextService {
        constructor() {
            this._onDidChangeWorkspaceName = new event_1.Emitter();
            this.onDidChangeWorkspaceName = this._onDidChangeWorkspaceName.event;
            this._onDidChangeWorkspaceFolders = new event_1.Emitter();
            this.onDidChangeWorkspaceFolders = this._onDidChangeWorkspaceFolders.event;
            this._onDidChangeWorkbenchState = new event_1.Emitter();
            this.onDidChangeWorkbenchState = this._onDidChangeWorkbenchState.event;
            const resource = uri_1.URI.from({ scheme: SimpleWorkspaceContextService.SCHEME, authority: 'model', path: '/' });
            this.workspace = { id: '4064f6ec-cb38-4ad0-af64-ee6467e63c82', folders: [new workspace_1.WorkspaceFolder({ uri: resource, name: '', index: 0 })] };
        }
        getCompleteWorkspace() {
            return Promise.resolve(this.getWorkspace());
        }
        getWorkspace() {
            return this.workspace;
        }
        getWorkbenchState() {
            if (this.workspace) {
                if (this.workspace.configuration) {
                    return 3 /* WORKSPACE */;
                }
                return 2 /* FOLDER */;
            }
            return 1 /* EMPTY */;
        }
        getWorkspaceFolder(resource) {
            return resource && resource.scheme === SimpleWorkspaceContextService.SCHEME ? this.workspace.folders[0] : null;
        }
        isInsideWorkspace(resource) {
            return resource && resource.scheme === SimpleWorkspaceContextService.SCHEME;
        }
        isCurrentWorkspace(workspaceIdentifier) {
            return true;
        }
    }
    exports.SimpleWorkspaceContextService = SimpleWorkspaceContextService;
    SimpleWorkspaceContextService.SCHEME = 'inmemory';
    function applyConfigurationValues(configurationService, source, isDiffEditor) {
        if (!source) {
            return;
        }
        if (!(configurationService instanceof SimpleConfigurationService)) {
            return;
        }
        Object.keys(source).forEach((key) => {
            if (commonEditorConfig_1.isEditorConfigurationKey(key)) {
                configurationService.updateValue(`editor.${key}`, source[key]);
            }
            if (isDiffEditor && commonEditorConfig_1.isDiffEditorConfigurationKey(key)) {
                configurationService.updateValue(`diffEditor.${key}`, source[key]);
            }
        });
    }
    exports.applyConfigurationValues = applyConfigurationValues;
    class SimpleBulkEditService {
        constructor(_modelService) {
            this._modelService = _modelService;
            //
        }
        apply(workspaceEdit, options) {
            let edits = new Map();
            if (workspaceEdit.edits) {
                for (let edit of workspaceEdit.edits) {
                    if (!modes_1.isResourceTextEdit(edit)) {
                        return Promise.reject(new Error('bad edit - only text edits are supported'));
                    }
                    let model = this._modelService.getModel(edit.resource);
                    if (!model) {
                        return Promise.reject(new Error('bad edit - model not found'));
                    }
                    let array = edits.get(model);
                    if (!array) {
                        array = [];
                    }
                    edits.set(model, array.concat(edit.edits));
                }
            }
            let totalEdits = 0;
            let totalFiles = 0;
            edits.forEach((edits, model) => {
                model.applyEdits(edits.map(edit => editOperation_1.EditOperation.replaceMove(range_1.Range.lift(edit.range), edit.text)));
                totalFiles += 1;
                totalEdits += edits.length;
            });
            return Promise.resolve({
                selection: undefined,
                ariaSummary: strings.format(standaloneStrings_1.SimpleServicesNLS.bulkEditServiceSummary, totalEdits, totalFiles)
            });
        }
    }
    exports.SimpleBulkEditService = SimpleBulkEditService;
    class SimpleUriLabelService {
        constructor() {
            this._onDidRegisterFormatter = new event_1.Emitter();
            this.onDidChangeFormatters = this._onDidRegisterFormatter.event;
        }
        getUriLabel(resource, options) {
            if (resource.scheme === 'file') {
                return resource.fsPath;
            }
            return resource.path;
        }
        getUriBasenameLabel(resource) {
            return resources_1.basename(resource);
        }
        getWorkspaceLabel(workspace, options) {
            return '';
        }
        getSeparator(scheme, authority) {
            return '/';
        }
        registerFormatter(formatter) {
            throw new Error('Not implemented');
        }
        getHostLabel() {
            return '';
        }
    }
    exports.SimpleUriLabelService = SimpleUriLabelService;
    class SimpleLayoutService {
        constructor(_container) {
            this._container = _container;
            this.onLayout = event_1.Event.None;
        }
        get dimension() {
            if (!this._dimension) {
                this._dimension = dom.getClientArea(window.document.body);
            }
            return this._dimension;
        }
        get container() {
            return this._container;
        }
    }
    exports.SimpleLayoutService = SimpleLayoutService;
});
//# sourceMappingURL=simpleServices.js.map