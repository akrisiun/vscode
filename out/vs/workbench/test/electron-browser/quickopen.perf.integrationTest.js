/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vscode-minimist", "vs/base/common/path", "vs/base/common/cancellation", "vs/base/common/uri", "vs/editor/common/services/modelService", "vs/editor/common/services/modelServiceImpl", "vs/editor/common/services/resourceConfiguration", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/registry/common/platform", "vs/workbench/services/search/common/search", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/browser/quickopen", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/search/node/searchService", "vs/workbench/services/untitled/common/untitledEditorService", "vs/workbench/test/workbenchTestServices", "vs/workbench/contrib/search/browser/search.contribution"], function (require, exports, assert, minimist, path, cancellation_1, uri_1, modelService_1, modelServiceImpl_1, resourceConfiguration_1, configuration_1, testConfigurationService_1, environment_1, descriptors_1, instantiationService_1, serviceCollection_1, platform_1, search_1, telemetry_1, workspace_1, testWorkspace_1, quickopen_1, editorService_1, editorGroupsService_1, searchService_1, untitledEditorService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Checkout sources to run against:
    // git clone --separate-git-dir=testGit --no-checkout --single-branch https://chromium.googlesource.com/chromium/src testWorkspace
    // cd testWorkspace; git checkout 39a7f93d67f7
    // Run from repository root folder with (test.bat on Windows): ./scripts/test.sh --grep QuickOpen.performance --timeout 180000 --testWorkspace <path>
    suite.skip('QuickOpen performance (integration)', () => {
        test('Measure', () => {
            if (process.env['VSCODE_PID']) {
                return undefined; // TODO@Christoph find out why test fails when run from within VS Code
            }
            const n = 3;
            const argv = minimist(process.argv);
            const testWorkspaceArg = argv['testWorkspace'];
            const verboseResults = argv['verboseResults'];
            const testWorkspacePath = testWorkspaceArg ? path.resolve(testWorkspaceArg) : __dirname;
            const telemetryService = new TestTelemetryService();
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            const textResourcePropertiesService = new workbenchTestServices_1.TestTextResourcePropertiesService(configurationService);
            const instantiationService = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([telemetry_1.ITelemetryService, telemetryService], [configuration_1.IConfigurationService, configurationService], [resourceConfiguration_1.ITextResourcePropertiesService, textResourcePropertiesService], [modelService_1.IModelService, new modelServiceImpl_1.ModelServiceImpl(configurationService, textResourcePropertiesService)], [workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService(testWorkspace_1.testWorkspace(uri_1.URI.file(testWorkspacePath)))], [editorService_1.IEditorService, new workbenchTestServices_1.TestEditorService()], [editorGroupsService_1.IEditorGroupsService, new workbenchTestServices_1.TestEditorGroupsService()], [environment_1.IEnvironmentService, workbenchTestServices_1.TestEnvironmentService], [untitledEditorService_1.IUntitledEditorService, descriptors_1.createSyncDescriptor(untitledEditorService_1.UntitledEditorService)], [search_1.ISearchService, descriptors_1.createSyncDescriptor(searchService_1.LocalSearchService)]));
            const registry = platform_1.Registry.as(quickopen_1.Extensions.Quickopen);
            const descriptor = registry.getDefaultQuickOpenHandler();
            assert.ok(descriptor);
            function measure() {
                const handler = descriptor.instantiate(instantiationService);
                handler.onOpen();
                return handler.getResults('a', cancellation_1.CancellationToken.None).then(result => {
                    const uncachedEvent = popEvent();
                    assert.strictEqual(uncachedEvent.data.symbols.fromCache, false, 'symbols.fromCache');
                    assert.strictEqual(uncachedEvent.data.files.fromCache, true, 'files.fromCache');
                    if (testWorkspaceArg) {
                        assert.ok(!!uncachedEvent.data.files.joined, 'files.joined');
                    }
                    return uncachedEvent;
                }).then(uncachedEvent => {
                    return handler.getResults('ab', cancellation_1.CancellationToken.None).then(result => {
                        const cachedEvent = popEvent();
                        assert.strictEqual(uncachedEvent.data.symbols.fromCache, false, 'symbols.fromCache');
                        assert.ok(cachedEvent.data.files.fromCache, 'filesFromCache');
                        handler.onClose(false);
                        return [uncachedEvent, cachedEvent];
                    });
                });
            }
            function popEvent() {
                const events = telemetryService.events
                    .filter(event => event.name === 'openAnything');
                assert.strictEqual(events.length, 1);
                const event = events[0];
                telemetryService.events.length = 0;
                return event;
            }
            function printResult(data) {
                if (verboseResults) {
                    console.log(JSON.stringify(data, null, '  ') + ',');
                }
                else {
                    console.log(JSON.stringify({
                        filesfromCacheNotJoined: data.files.fromCache && !data.files.joined,
                        searchLength: data.searchLength,
                        sortedResultDuration: data.sortedResultDuration,
                        filesResultCount: data.files.resultCount,
                        errorCount: data.files.errors && data.files.errors.length || undefined
                    }) + ',');
                }
            }
            return measure() // Warm-up first
                .then(() => {
                if (testWorkspaceArg || verboseResults) { // Don't measure by default
                    const cachedEvents = [];
                    let i = n;
                    return (function iterate() {
                        if (!i--) {
                            return undefined;
                        }
                        return measure()
                            .then(([uncachedEvent, cachedEvent]) => {
                            printResult(uncachedEvent.data);
                            cachedEvents.push(cachedEvent);
                            return iterate();
                        });
                    })().then(() => {
                        console.log();
                        cachedEvents.forEach(cachedEvent => {
                            printResult(cachedEvent.data);
                        });
                    });
                }
                return undefined;
            });
        });
    });
    class TestTelemetryService {
        constructor() {
            this.isOptedIn = true;
            this.events = [];
        }
        setEnabled(value) {
        }
        publicLog(eventName, data) {
            this.events.push({ name: eventName, data: data });
            return Promise.resolve(undefined);
        }
        publicLog2(eventName, data) {
            return this.publicLog(eventName, data);
        }
        getTelemetryInfo() {
            return Promise.resolve({
                instanceId: 'someValue.instanceId',
                sessionId: 'someValue.sessionId',
                machineId: 'someValue.machineId'
            });
        }
    }
});
//# sourceMappingURL=quickopen.perf.integrationTest.js.map