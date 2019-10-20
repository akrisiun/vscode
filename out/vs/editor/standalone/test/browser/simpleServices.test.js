define(["require", "exports", "assert", "vs/editor/standalone/browser/simpleServices", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, assert, simpleServices_1, contextKeyService_1, instantiationService_1, serviceCollection_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('StandaloneKeybindingService', () => {
        class TestStandaloneKeybindingService extends simpleServices_1.StandaloneKeybindingService {
            testDispatch(e) {
                super._dispatch(e, null);
            }
        }
        test('issue Microsoft/monaco-editor#167', () => {
            let serviceCollection = new serviceCollection_1.ServiceCollection();
            const instantiationService = new instantiationService_1.InstantiationService(serviceCollection, true);
            let configurationService = new simpleServices_1.SimpleConfigurationService();
            let contextKeyService = new contextKeyService_1.ContextKeyService(configurationService);
            let commandService = new simpleServices_1.StandaloneCommandService(instantiationService);
            let notificationService = new simpleServices_1.SimpleNotificationService();
            let domElement = document.createElement('div');
            let keybindingService = new TestStandaloneKeybindingService(contextKeyService, commandService, telemetryUtils_1.NullTelemetryService, notificationService, domElement);
            let commandInvoked = false;
            keybindingService.addDynamicKeybinding('testCommand', 67 /* F9 */, () => {
                commandInvoked = true;
            }, undefined);
            keybindingService.testDispatch({
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                keyCode: 67 /* F9 */,
                code: null
            });
            assert.ok(commandInvoked, 'command invoked');
        });
    });
});
//# sourceMappingURL=simpleServices.test.js.map