/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "vs/platform/workspace/common/workspace", "vs/platform/instantiation/common/descriptors", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/search/common/search", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/untitled/common/untitledEditorService", "vs/workbench/services/editor/common/editorService", "vscode-minimist", "vs/base/common/path", "vs/workbench/services/search/node/searchService", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/test/workbenchTestServices", "vs/platform/environment/common/environment", "vs/base/common/uri", "vs/platform/instantiation/common/instantiationService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration", "vs/editor/common/services/modelServiceImpl", "vs/editor/common/services/modelService", "vs/workbench/contrib/search/common/searchModel", "vs/workbench/contrib/search/common/queryBuilder", "vs/base/common/event", "vs/platform/workspace/test/common/testWorkspace", "vs/platform/log/common/log", "vs/editor/common/services/resourceConfiguration", "vs/workbench/contrib/search/browser/search.contribution"], function (require, exports, assert, fs, workspace_1, descriptors_1, editorGroupsService_1, search_1, telemetry_1, untitledEditorService_1, editorService_1, minimist, path, searchService_1, serviceCollection_1, workbenchTestServices_1, environment_1, uri_1, instantiationService_1, testConfigurationService_1, configuration_1, modelServiceImpl_1, modelService_1, searchModel_1, queryBuilder_1, event_1, testWorkspace_1, log_1, resourceConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Checkout sources to run against:
    // git clone --separate-git-dir=testGit --no-checkout --single-branch https://chromium.googlesource.com/chromium/src testWorkspace
    // cd testWorkspace; git checkout 39a7f93d67f7
    // Run from repository root folder with (test.bat on Windows): ./scripts/test-int-mocha.sh --grep TextSearch.performance --timeout 500000 --testWorkspace <path>
    suite.skip('TextSearch performance (integration)', () => {
        test('Measure', () => {
            if (process.env['VSCODE_PID']) {
                return undefined; // TODO@Rob find out why test fails when run from within VS Code
            }
            const n = 3;
            const argv = minimist(process.argv);
            const testWorkspaceArg = argv['testWorkspace'];
            const testWorkspacePath = testWorkspaceArg ? path.resolve(testWorkspaceArg) : __dirname;
            if (!fs.existsSync(testWorkspacePath)) {
                throw new Error(`--testWorkspace doesn't exist`);
            }
            const telemetryService = new TestTelemetryService();
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            const textResourcePropertiesService = new workbenchTestServices_1.TestTextResourcePropertiesService(configurationService);
            const instantiationService = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([telemetry_1.ITelemetryService, telemetryService], [configuration_1.IConfigurationService, configurationService], [resourceConfiguration_1.ITextResourcePropertiesService, textResourcePropertiesService], [modelService_1.IModelService, new modelServiceImpl_1.ModelServiceImpl(configurationService, textResourcePropertiesService)], [workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService(testWorkspace_1.testWorkspace(uri_1.URI.file(testWorkspacePath)))], [editorService_1.IEditorService, new workbenchTestServices_1.TestEditorService()], [editorGroupsService_1.IEditorGroupsService, new workbenchTestServices_1.TestEditorGroupsService()], [environment_1.IEnvironmentService, workbenchTestServices_1.TestEnvironmentService], [untitledEditorService_1.IUntitledEditorService, descriptors_1.createSyncDescriptor(untitledEditorService_1.UntitledEditorService)], [search_1.ISearchService, descriptors_1.createSyncDescriptor(searchService_1.LocalSearchService)], [log_1.ILogService, new log_1.NullLogService()]));
            const queryOptions = {
                maxResults: 2048
            };
            const searchModel = instantiationService.createInstance(searchModel_1.SearchModel);
            function runSearch() {
                const queryBuilder = instantiationService.createInstance(queryBuilder_1.QueryBuilder);
                const query = queryBuilder.text({ pattern: 'static_library(' }, [uri_1.URI.file(testWorkspacePath)], queryOptions);
                // Wait for the 'searchResultsFinished' event, which is fired after the search() promise is resolved
                const onSearchResultsFinished = event_1.Event.filter(telemetryService.eventLogged, e => e.name === 'searchResultsFinished');
                event_1.Event.once(onSearchResultsFinished)(onComplete);
                function onComplete() {
                    try {
                        const allEvents = telemetryService.events.map(e => JSON.stringify(e)).join('\n');
                        assert.equal(telemetryService.events.length, 3, 'Expected 3 telemetry events, got:\n' + allEvents);
                        const [firstRenderEvent, resultsShownEvent, resultsFinishedEvent] = telemetryService.events;
                        assert.equal(firstRenderEvent.name, 'searchResultsFirstRender');
                        assert.equal(resultsShownEvent.name, 'searchResultsShown');
                        assert.equal(resultsFinishedEvent.name, 'searchResultsFinished');
                        telemetryService.events = [];
                        resolve(resultsFinishedEvent);
                    }
                    catch (e) {
                        // Fail the runSearch() promise
                        error(e);
                    }
                }
                let resolve;
                let error;
                return new Promise((_resolve, _error) => {
                    resolve = _resolve;
                    error = _error;
                    // Don't wait on this promise, we're waiting on the event fired above
                    searchModel.search(query).then(null, _error);
                });
            }
            const finishedEvents = [];
            return runSearch() // Warm-up first
                .then(() => {
                if (testWorkspaceArg) { // Don't measure by default
                    let i = n;
                    return (function iterate() {
                        if (!i--) {
                            return;
                        }
                        return runSearch()
                            .then((resultsFinishedEvent) => {
                            console.log(`Iteration ${n - i}: ${resultsFinishedEvent.data.duration / 1000}s`);
                            finishedEvents.push(resultsFinishedEvent);
                            return iterate();
                        });
                    })().then(() => {
                        const totalTime = finishedEvents.reduce((sum, e) => sum + e.data.duration, 0);
                        console.log(`Avg duration: ${totalTime / n / 1000}s`);
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
            this.emitter = new event_1.Emitter();
        }
        get eventLogged() {
            return this.emitter.event;
        }
        setEnabled(value) {
        }
        publicLog(eventName, data) {
            const event = { name: eventName, data: data };
            this.events.push(event);
            this.emitter.fire(event);
            return Promise.resolve();
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
//# sourceMappingURL=textsearch.perf.integrationTest.js.map