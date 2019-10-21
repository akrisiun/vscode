/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/services/bulkEditService", "vs/editor/browser/services/codeEditorService", "vs/editor/common/services/editorWorkerService", "vs/editor/common/services/editorWorkerServiceImpl", "vs/editor/common/services/modeService", "vs/editor/common/services/modeServiceImpl", "vs/editor/common/services/modelService", "vs/editor/common/services/modelServiceImpl", "vs/editor/common/services/resourceConfiguration", "vs/editor/standalone/browser/simpleServices", "vs/editor/standalone/browser/standaloneCodeServiceImpl", "vs/editor/standalone/browser/standaloneThemeServiceImpl", "vs/editor/standalone/common/standaloneThemeService", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextMenuService", "vs/platform/contextview/browser/contextView", "vs/platform/contextview/browser/contextViewService", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/log/common/log", "vs/platform/markers/common/markerService", "vs/platform/markers/common/markers", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/platform/actions/common/menuService", "vs/editor/common/services/markersDecorationService", "vs/editor/common/services/markerDecorationsServiceImpl", "vs/platform/accessibility/common/accessibility", "vs/platform/accessibility/common/accessibilityService", "vs/platform/layout/browser/layoutService", "vs/platform/instantiation/common/extensions"], function (require, exports, lifecycle_1, bulkEditService_1, codeEditorService_1, editorWorkerService_1, editorWorkerServiceImpl_1, modeService_1, modeServiceImpl_1, modelService_1, modelServiceImpl_1, resourceConfiguration_1, simpleServices_1, standaloneCodeServiceImpl_1, standaloneThemeServiceImpl_1, standaloneThemeService_1, actions_1, commands_1, configuration_1, contextKeyService_1, contextkey_1, contextMenuService_1, contextView_1, contextViewService_1, dialogs_1, instantiation_1, instantiationService_1, serviceCollection_1, keybinding_1, label_1, listService_1, log_1, markerService_1, markers_1, notification_1, progress_1, storage_1, telemetry_1, themeService_1, workspace_1, menuService_1, markersDecorationService_1, markerDecorationsServiceImpl_1, accessibility_1, accessibilityService_1, layoutService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var StaticServices;
    (function (StaticServices) {
        const _serviceCollection = new serviceCollection_1.ServiceCollection();
        class LazyStaticService {
            constructor(serviceId, factory) {
                this._serviceId = serviceId;
                this._factory = factory;
                this._value = null;
            }
            get id() { return this._serviceId; }
            get(overrides) {
                if (!this._value) {
                    if (overrides) {
                        this._value = overrides[this._serviceId.toString()];
                    }
                    if (!this._value) {
                        this._value = this._factory(overrides);
                    }
                    if (!this._value) {
                        throw new Error('Service ' + this._serviceId + ' is missing!');
                    }
                    _serviceCollection.set(this._serviceId, this._value);
                }
                return this._value;
            }
        }
        StaticServices.LazyStaticService = LazyStaticService;
        let _all = [];
        function define(serviceId, factory) {
            let r = new LazyStaticService(serviceId, factory);
            _all.push(r);
            return r;
        }
        function init(overrides) {
            // Create a fresh service collection
            let result = new serviceCollection_1.ServiceCollection();
            // make sure to add all services that use `registerSingleton`
            for (const [id, descriptor] of extensions_1.getSingletonServiceDescriptors()) {
                result.set(id, descriptor);
            }
            // Initialize the service collection with the overrides
            for (let serviceId in overrides) {
                if (overrides.hasOwnProperty(serviceId)) {
                    result.set(instantiation_1.createDecorator(serviceId), overrides[serviceId]);
                }
            }
            // Make sure the same static services are present in all service collections
            _all.forEach(service => result.set(service.id, service.get(overrides)));
            // Ensure the collection gets the correct instantiation service
            let instantiationService = new instantiationService_1.InstantiationService(result, true);
            result.set(instantiation_1.IInstantiationService, instantiationService);
            return [result, instantiationService];
        }
        StaticServices.init = init;
        StaticServices.instantiationService = define(instantiation_1.IInstantiationService, () => new instantiationService_1.InstantiationService(_serviceCollection, true));
        const configurationServiceImpl = new simpleServices_1.SimpleConfigurationService();
        StaticServices.configurationService = define(configuration_1.IConfigurationService, () => configurationServiceImpl);
        StaticServices.resourceConfigurationService = define(resourceConfiguration_1.ITextResourceConfigurationService, () => new simpleServices_1.SimpleResourceConfigurationService(configurationServiceImpl));
        StaticServices.resourcePropertiesService = define(resourceConfiguration_1.ITextResourcePropertiesService, () => new simpleServices_1.SimpleResourcePropertiesService(configurationServiceImpl));
        StaticServices.contextService = define(workspace_1.IWorkspaceContextService, () => new simpleServices_1.SimpleWorkspaceContextService());
        StaticServices.labelService = define(label_1.ILabelService, () => new simpleServices_1.SimpleUriLabelService());
        StaticServices.telemetryService = define(telemetry_1.ITelemetryService, () => new simpleServices_1.StandaloneTelemetryService());
        StaticServices.dialogService = define(dialogs_1.IDialogService, () => new simpleServices_1.SimpleDialogService());
        StaticServices.notificationService = define(notification_1.INotificationService, () => new simpleServices_1.SimpleNotificationService());
        StaticServices.markerService = define(markers_1.IMarkerService, () => new markerService_1.MarkerService());
        StaticServices.modeService = define(modeService_1.IModeService, (o) => new modeServiceImpl_1.ModeServiceImpl());
        StaticServices.modelService = define(modelService_1.IModelService, (o) => new modelServiceImpl_1.ModelServiceImpl(StaticServices.configurationService.get(o), StaticServices.resourcePropertiesService.get(o)));
        StaticServices.markerDecorationsService = define(markersDecorationService_1.IMarkerDecorationsService, (o) => new markerDecorationsServiceImpl_1.MarkerDecorationsService(StaticServices.modelService.get(o), StaticServices.markerService.get(o)));
        StaticServices.standaloneThemeService = define(standaloneThemeService_1.IStandaloneThemeService, () => new standaloneThemeServiceImpl_1.StandaloneThemeServiceImpl());
        StaticServices.codeEditorService = define(codeEditorService_1.ICodeEditorService, (o) => new standaloneCodeServiceImpl_1.StandaloneCodeEditorServiceImpl(StaticServices.standaloneThemeService.get(o)));
        StaticServices.editorProgressService = define(progress_1.IEditorProgressService, () => new simpleServices_1.SimpleEditorProgressService());
        StaticServices.storageService = define(storage_1.IStorageService, () => new storage_1.InMemoryStorageService());
        StaticServices.logService = define(log_1.ILogService, () => new log_1.NullLogService());
        StaticServices.editorWorkerService = define(editorWorkerService_1.IEditorWorkerService, (o) => new editorWorkerServiceImpl_1.EditorWorkerServiceImpl(StaticServices.modelService.get(o), StaticServices.resourceConfigurationService.get(o), StaticServices.logService.get(o)));
    })(StaticServices = exports.StaticServices || (exports.StaticServices = {}));
    class DynamicStandaloneServices extends lifecycle_1.Disposable {
        constructor(domElement, overrides) {
            super();
            const [_serviceCollection, _instantiationService] = StaticServices.init(overrides);
            this._serviceCollection = _serviceCollection;
            this._instantiationService = _instantiationService;
            const configurationService = this.get(configuration_1.IConfigurationService);
            const notificationService = this.get(notification_1.INotificationService);
            const telemetryService = this.get(telemetry_1.ITelemetryService);
            const themeService = this.get(themeService_1.IThemeService);
            let ensure = (serviceId, factory) => {
                let value = null;
                if (overrides) {
                    value = overrides[serviceId.toString()];
                }
                if (!value) {
                    value = factory();
                }
                this._serviceCollection.set(serviceId, value);
                return value;
            };
            let contextKeyService = ensure(contextkey_1.IContextKeyService, () => this._register(new contextKeyService_1.ContextKeyService(configurationService)));
            ensure(accessibility_1.IAccessibilityService, () => new accessibilityService_1.BrowserAccessibilityService(contextKeyService, configurationService));
            ensure(listService_1.IListService, () => new listService_1.ListService(contextKeyService));
            let commandService = ensure(commands_1.ICommandService, () => new simpleServices_1.StandaloneCommandService(this._instantiationService));
            let keybindingService = ensure(keybinding_1.IKeybindingService, () => this._register(new simpleServices_1.StandaloneKeybindingService(contextKeyService, commandService, telemetryService, notificationService, domElement)));
            let layoutService = ensure(layoutService_1.ILayoutService, () => new simpleServices_1.SimpleLayoutService(domElement));
            let contextViewService = ensure(contextView_1.IContextViewService, () => this._register(new contextViewService_1.ContextViewService(layoutService)));
            ensure(contextView_1.IContextMenuService, () => {
                const contextMenuService = new contextMenuService_1.ContextMenuService(telemetryService, notificationService, contextViewService, keybindingService, themeService);
                contextMenuService.configure({ blockMouse: false }); // we do not want that in the standalone editor
                return this._register(contextMenuService);
            });
            ensure(actions_1.IMenuService, () => new menuService_1.MenuService(commandService));
            ensure(bulkEditService_1.IBulkEditService, () => new simpleServices_1.SimpleBulkEditService(StaticServices.modelService.get(modelService_1.IModelService)));
        }
        get(serviceId) {
            let r = this._serviceCollection.get(serviceId);
            if (!r) {
                throw new Error('Missing service ' + serviceId);
            }
            return r;
        }
        set(serviceId, instance) {
            this._serviceCollection.set(serviceId, instance);
        }
        has(serviceId) {
            return this._serviceCollection.has(serviceId);
        }
    }
    exports.DynamicStandaloneServices = DynamicStandaloneServices;
});
//# sourceMappingURL=standaloneServices.js.map