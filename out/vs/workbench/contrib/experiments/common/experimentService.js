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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/lifecycle/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/extensionManagement/common/extensionManagement", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/base/common/glob", "vs/platform/request/common/request", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/cancellation", "vs/base/common/arrays", "vs/platform/product/common/productService", "vs/workbench/contrib/stats/common/workspaceStats"], function (require, exports, instantiation_1, event_1, storage_1, telemetry_1, lifecycle_1, configuration_1, extensionManagement_1, platform_1, lifecycle_2, glob_1, request_1, textfiles_1, cancellation_1, arrays_1, productService_1, workspaceStats_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ExperimentState;
    (function (ExperimentState) {
        ExperimentState[ExperimentState["Evaluating"] = 0] = "Evaluating";
        ExperimentState[ExperimentState["NoRun"] = 1] = "NoRun";
        ExperimentState[ExperimentState["Run"] = 2] = "Run";
        ExperimentState[ExperimentState["Complete"] = 3] = "Complete";
    })(ExperimentState = exports.ExperimentState || (exports.ExperimentState = {}));
    var ExperimentActionType;
    (function (ExperimentActionType) {
        ExperimentActionType["Custom"] = "Custom";
        ExperimentActionType["Prompt"] = "Prompt";
        ExperimentActionType["AddToRecommendations"] = "AddToRecommendations";
        ExperimentActionType["ExtensionSearchResults"] = "ExtensionSearchResults";
    })(ExperimentActionType = exports.ExperimentActionType || (exports.ExperimentActionType = {}));
    exports.IExperimentService = instantiation_1.createDecorator('experimentService');
    let ExperimentService = class ExperimentService extends lifecycle_2.Disposable {
        constructor(storageService, extensionManagementService, textFileService, telemetryService, lifecycleService, requestService, configurationService, productService, workspaceStatsService) {
            super();
            this.storageService = storageService;
            this.extensionManagementService = extensionManagementService;
            this.textFileService = textFileService;
            this.telemetryService = telemetryService;
            this.lifecycleService = lifecycleService;
            this.requestService = requestService;
            this.configurationService = configurationService;
            this.productService = productService;
            this.workspaceStatsService = workspaceStatsService;
            this._experiments = [];
            this._curatedMapping = Object.create(null);
            this._onExperimentEnabled = this._register(new event_1.Emitter());
            this.onExperimentEnabled = this._onExperimentEnabled.event;
            this._loadExperimentsPromise = Promise.resolve(this.lifecycleService.when(4 /* Eventually */)).then(() => this.loadExperiments());
        }
        getExperimentById(id) {
            return this._loadExperimentsPromise.then(() => {
                return this._experiments.filter(x => x.id === id)[0];
            });
        }
        getExperimentsByType(type) {
            return this._loadExperimentsPromise.then(() => {
                if (type === ExperimentActionType.Custom) {
                    return this._experiments.filter(x => x.enabled && (!x.action || x.action.type === type));
                }
                return this._experiments.filter(x => x.enabled && x.action && x.action.type === type);
            });
        }
        getCuratedExtensionsList(curatedExtensionsKey) {
            return this._loadExperimentsPromise.then(() => {
                for (const experiment of this._experiments) {
                    if (experiment.enabled
                        && experiment.state === 2 /* Run */
                        && this._curatedMapping[experiment.id]
                        && this._curatedMapping[experiment.id].curatedExtensionsKey === curatedExtensionsKey) {
                        return this._curatedMapping[experiment.id].curatedExtensionsList;
                    }
                }
                return [];
            });
        }
        markAsCompleted(experimentId) {
            const storageKey = 'experiments.' + experimentId;
            const experimentState = safeParse(this.storageService.get(storageKey, 0 /* GLOBAL */), {});
            experimentState.state = 3 /* Complete */;
            this.storageService.store(storageKey, JSON.stringify(experimentState), 0 /* GLOBAL */);
        }
        getExperiments() {
            if (!this.productService.experimentsUrl || this.configurationService.getValue('workbench.enableExperiments') === false) {
                return Promise.resolve([]);
            }
            return this.requestService.request({ type: 'GET', url: this.productService.experimentsUrl }, cancellation_1.CancellationToken.None).then(context => {
                if (context.res.statusCode !== 200) {
                    return Promise.resolve(null);
                }
                return request_1.asJson(context).then((result) => {
                    return result && Array.isArray(result['experiments']) ? result['experiments'] : [];
                });
            }, () => Promise.resolve(null));
        }
        loadExperiments() {
            return this.getExperiments().then(rawExperiments => {
                // Offline mode
                if (!rawExperiments) {
                    const allExperimentIdsFromStorage = safeParse(this.storageService.get('allExperiments', 0 /* GLOBAL */), []);
                    if (Array.isArray(allExperimentIdsFromStorage)) {
                        allExperimentIdsFromStorage.forEach(experimentId => {
                            const storageKey = 'experiments.' + experimentId;
                            const experimentState = safeParse(this.storageService.get(storageKey, 0 /* GLOBAL */), null);
                            if (experimentState) {
                                this._experiments.push({
                                    id: experimentId,
                                    enabled: experimentState.enabled,
                                    state: experimentState.state
                                });
                            }
                        });
                    }
                    return Promise.resolve(null);
                }
                // Clear disbaled/deleted experiments from storage
                const allExperimentIdsFromStorage = safeParse(this.storageService.get('allExperiments', 0 /* GLOBAL */), []);
                const enabledExperiments = rawExperiments.filter(experiment => !!experiment.enabled).map(experiment => experiment.id.toLowerCase());
                if (Array.isArray(allExperimentIdsFromStorage)) {
                    allExperimentIdsFromStorage.forEach(experiment => {
                        if (enabledExperiments.indexOf(experiment) === -1) {
                            this.storageService.remove(`experiments.${experiment}`, 0 /* GLOBAL */);
                        }
                    });
                }
                if (enabledExperiments.length) {
                    this.storageService.store('allExperiments', JSON.stringify(enabledExperiments), 0 /* GLOBAL */);
                }
                else {
                    this.storageService.remove('allExperiments', 0 /* GLOBAL */);
                }
                const promises = rawExperiments.map(experiment => {
                    const processedExperiment = {
                        id: experiment.id,
                        enabled: !!experiment.enabled,
                        state: !!experiment.enabled ? 0 /* Evaluating */ : 1 /* NoRun */
                    };
                    if (experiment.action) {
                        processedExperiment.action = {
                            type: ExperimentActionType[experiment.action.type] || ExperimentActionType.Custom,
                            properties: experiment.action.properties
                        };
                        if (processedExperiment.action.type === ExperimentActionType.Prompt) {
                            (processedExperiment.action.properties.commands || []).forEach(x => {
                                if (x.curatedExtensionsKey && Array.isArray(x.curatedExtensionsList)) {
                                    this._curatedMapping[experiment.id] = x;
                                }
                            });
                        }
                        if (!processedExperiment.action.properties) {
                            processedExperiment.action.properties = {};
                        }
                    }
                    this._experiments.push(processedExperiment);
                    if (!processedExperiment.enabled) {
                        return Promise.resolve(null);
                    }
                    const storageKey = 'experiments.' + experiment.id;
                    const experimentState = safeParse(this.storageService.get(storageKey, 0 /* GLOBAL */), {});
                    if (!experimentState.hasOwnProperty('enabled')) {
                        experimentState.enabled = processedExperiment.enabled;
                    }
                    if (!experimentState.hasOwnProperty('state')) {
                        experimentState.state = processedExperiment.enabled ? 0 /* Evaluating */ : 1 /* NoRun */;
                    }
                    else {
                        processedExperiment.state = experimentState.state;
                    }
                    return this.shouldRunExperiment(experiment, processedExperiment).then((state) => {
                        experimentState.state = processedExperiment.state = state;
                        this.storageService.store(storageKey, JSON.stringify(experimentState), 0 /* GLOBAL */);
                        if (state === 2 /* Run */) {
                            this.fireRunExperiment(processedExperiment);
                        }
                        return Promise.resolve(null);
                    });
                });
                return Promise.all(promises).then(() => {
                    this.telemetryService.publicLog2('experiments', { experiments: this._experiments });
                });
            });
        }
        fireRunExperiment(experiment) {
            this._onExperimentEnabled.fire(experiment);
            const runExperimentIdsFromStorage = safeParse(this.storageService.get('currentOrPreviouslyRunExperiments', 0 /* GLOBAL */), []);
            if (runExperimentIdsFromStorage.indexOf(experiment.id) === -1) {
                runExperimentIdsFromStorage.push(experiment.id);
            }
            // Ensure we dont store duplicates
            const distinctExperiments = arrays_1.distinct(runExperimentIdsFromStorage);
            if (runExperimentIdsFromStorage.length !== distinctExperiments.length) {
                this.storageService.store('currentOrPreviouslyRunExperiments', JSON.stringify(distinctExperiments), 0 /* GLOBAL */);
            }
        }
        checkExperimentDependencies(experiment) {
            const experimentsPreviouslyRun = experiment.condition ? experiment.condition.experimentsPreviouslyRun : undefined;
            if (experimentsPreviouslyRun) {
                const runExperimentIdsFromStorage = safeParse(this.storageService.get('currentOrPreviouslyRunExperiments', 0 /* GLOBAL */), []);
                let includeCheck = true;
                let excludeCheck = true;
                const includes = experimentsPreviouslyRun.includes;
                if (Array.isArray(includes)) {
                    includeCheck = runExperimentIdsFromStorage.some(x => includes.indexOf(x) > -1);
                }
                const excludes = experimentsPreviouslyRun.excludes;
                if (includeCheck && Array.isArray(excludes)) {
                    excludeCheck = !runExperimentIdsFromStorage.some(x => excludes.indexOf(x) > -1);
                }
                if (!includeCheck || !excludeCheck) {
                    return false;
                }
            }
            return true;
        }
        shouldRunExperiment(experiment, processedExperiment) {
            if (processedExperiment.state !== 0 /* Evaluating */) {
                return Promise.resolve(processedExperiment.state);
            }
            if (!experiment.enabled) {
                return Promise.resolve(1 /* NoRun */);
            }
            const condition = experiment.condition;
            if (!condition) {
                return Promise.resolve(2 /* Run */);
            }
            if (!this.checkExperimentDependencies(experiment)) {
                return Promise.resolve(1 /* NoRun */);
            }
            if (this.productService.quality === 'stable' && condition.insidersOnly === true) {
                return Promise.resolve(1 /* NoRun */);
            }
            const isNewUser = !this.storageService.get(telemetry_1.lastSessionDateStorageKey, 0 /* GLOBAL */);
            if ((condition.newUser === true && !isNewUser)
                || (condition.newUser === false && isNewUser)) {
                return Promise.resolve(1 /* NoRun */);
            }
            if (typeof condition.displayLanguage === 'string') {
                let localeToCheck = condition.displayLanguage.toLowerCase();
                let displayLanguage = platform_1.language.toLowerCase();
                if (localeToCheck !== displayLanguage) {
                    const a = displayLanguage.indexOf('-');
                    const b = localeToCheck.indexOf('-');
                    if (a > -1) {
                        displayLanguage = displayLanguage.substr(0, a);
                    }
                    if (b > -1) {
                        localeToCheck = localeToCheck.substr(0, b);
                    }
                    if (displayLanguage !== localeToCheck) {
                        return Promise.resolve(1 /* NoRun */);
                    }
                }
            }
            if (!condition.userProbability) {
                condition.userProbability = 1;
            }
            let extensionsCheckPromise = Promise.resolve(true);
            const installedExtensions = condition.installedExtensions;
            if (installedExtensions) {
                extensionsCheckPromise = this.extensionManagementService.getInstalled(1 /* User */).then(locals => {
                    let includesCheck = true;
                    let excludesCheck = true;
                    const localExtensions = locals.map(local => `${local.manifest.publisher.toLowerCase()}.${local.manifest.name.toLowerCase()}`);
                    if (Array.isArray(installedExtensions.includes) && installedExtensions.includes.length) {
                        const extensionIncludes = installedExtensions.includes.map(e => e.toLowerCase());
                        includesCheck = localExtensions.some(e => extensionIncludes.indexOf(e) > -1);
                    }
                    if (Array.isArray(installedExtensions.excludes) && installedExtensions.excludes.length) {
                        const extensionExcludes = installedExtensions.excludes.map(e => e.toLowerCase());
                        excludesCheck = !localExtensions.some(e => extensionExcludes.indexOf(e) > -1);
                    }
                    return includesCheck && excludesCheck;
                });
            }
            const storageKey = 'experiments.' + experiment.id;
            const experimentState = safeParse(this.storageService.get(storageKey, 0 /* GLOBAL */), {});
            return extensionsCheckPromise.then(success => {
                const fileEdits = condition.fileEdits;
                if (!success || !fileEdits || typeof fileEdits.minEditCount !== 'number') {
                    const runExperiment = success && typeof condition.userProbability === 'number' && Math.random() < condition.userProbability;
                    return runExperiment ? 2 /* Run */ : 1 /* NoRun */;
                }
                experimentState.editCount = experimentState.editCount || 0;
                if (experimentState.editCount >= fileEdits.minEditCount) {
                    return 2 /* Run */;
                }
                const onSaveHandler = this.textFileService.models.onModelsSaved(e => {
                    const date = new Date().toDateString();
                    const latestExperimentState = safeParse(this.storageService.get(storageKey, 0 /* GLOBAL */), {});
                    if (latestExperimentState.state !== 0 /* Evaluating */) {
                        onSaveHandler.dispose();
                        return;
                    }
                    e.forEach(async (event) => {
                        if (event.kind !== 3 /* SAVED */
                            || latestExperimentState.state !== 0 /* Evaluating */
                            || date === latestExperimentState.lastEditedDate
                            || (typeof latestExperimentState.editCount === 'number' && latestExperimentState.editCount >= fileEdits.minEditCount)) {
                            return;
                        }
                        let filePathCheck = true;
                        let workspaceCheck = true;
                        if (typeof fileEdits.filePathPattern === 'string') {
                            filePathCheck = glob_1.match(fileEdits.filePathPattern, event.resource.fsPath);
                        }
                        if (Array.isArray(fileEdits.workspaceIncludes) && fileEdits.workspaceIncludes.length) {
                            const tags = await this.workspaceStatsService.getTags();
                            workspaceCheck = !!tags && fileEdits.workspaceIncludes.some(x => !!tags[x]);
                        }
                        if (workspaceCheck && Array.isArray(fileEdits.workspaceExcludes) && fileEdits.workspaceExcludes.length) {
                            const tags = await this.workspaceStatsService.getTags();
                            workspaceCheck = !!tags && !fileEdits.workspaceExcludes.some(x => !!tags[x]);
                        }
                        if (filePathCheck && workspaceCheck) {
                            latestExperimentState.editCount = (latestExperimentState.editCount || 0) + 1;
                            latestExperimentState.lastEditedDate = date;
                            this.storageService.store(storageKey, JSON.stringify(latestExperimentState), 0 /* GLOBAL */);
                        }
                    });
                    if (typeof latestExperimentState.editCount === 'number' && latestExperimentState.editCount >= fileEdits.minEditCount) {
                        processedExperiment.state = latestExperimentState.state = (typeof condition.userProbability === 'number' && Math.random() < condition.userProbability && this.checkExperimentDependencies(experiment)) ? 2 /* Run */ : 1 /* NoRun */;
                        this.storageService.store(storageKey, JSON.stringify(latestExperimentState), 0 /* GLOBAL */);
                        if (latestExperimentState.state === 2 /* Run */ && experiment.action && ExperimentActionType[experiment.action.type] === ExperimentActionType.Prompt) {
                            this.fireRunExperiment(processedExperiment);
                        }
                    }
                });
                this._register(onSaveHandler);
                return 0 /* Evaluating */;
            });
        }
    };
    ExperimentService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, extensionManagement_1.IExtensionManagementService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, lifecycle_1.ILifecycleService),
        __param(5, request_1.IRequestService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, productService_1.IProductService),
        __param(8, workspaceStats_1.IWorkspaceStatsService)
    ], ExperimentService);
    exports.ExperimentService = ExperimentService;
    function safeParse(text, defaultObject) {
        try {
            return text ? JSON.parse(text) || defaultObject : defaultObject;
        }
        catch (e) {
            return defaultObject;
        }
    }
});
//# sourceMappingURL=experimentService.js.map