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
define(["require", "exports", "electron", "vs/nls", "vs/base/browser/dom", "vs/base/common/collections", "vs/base/browser/browser", "vs/base/common/strings", "vs/platform/product/common/product", "os", "vs/base/common/decorators", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc", "vs/base/parts/ipc/node/ipc.net", "vs/platform/instantiation/common/serviceCollection", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/node/telemetryIpc", "vs/platform/instantiation/common/instantiationService", "vs/platform/telemetry/node/commonProperties", "vs/platform/ipc/electron-browser/mainProcessService", "vs/platform/environment/node/environmentService", "vs/code/electron-browser/issue/issueReporterModel", "vs/code/electron-browser/issue/issueReporterPage", "vs/platform/log/common/logIpc", "vs/platform/log/common/log", "vs/base/browser/ui/codiconLabel/codiconLabel", "vs/code/common/issue/issueReporterUtil", "vs/base/browser/ui/button/button", "vs/platform/diagnostics/common/diagnostics", "vs/platform/log/node/spdlogService", "vs/css!./media/issueReporter"], function (require, exports, electron_1, nls_1, dom_1, collections, browser, strings_1, product_1, os, decorators_1, platform, lifecycle_1, ipc_1, ipc_2, ipc_net_1, serviceCollection_1, telemetryUtils_1, telemetryService_1, telemetryIpc_1, instantiationService_1, commonProperties_1, mainProcessService_1, environmentService_1, issueReporterModel_1, issueReporterPage_1, logIpc_1, log_1, codiconLabel_1, issueReporterUtil_1, button_1, diagnostics_1, spdlogService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const MAX_URL_LENGTH = 2045;
    function startup(configuration) {
        document.body.innerHTML = issueReporterPage_1.default();
        const issueReporter = new IssueReporter(configuration);
        issueReporter.render();
        document.body.style.display = 'block';
        issueReporter.setInitialFocus();
    }
    exports.startup = startup;
    class IssueReporter extends lifecycle_1.Disposable {
        constructor(configuration) {
            super();
            this.numberOfSearchResultsDisplayed = 0;
            this.receivedSystemInfo = false;
            this.receivedPerformanceInfo = false;
            this.shouldQueueSearch = false;
            this.hasBeenSubmitted = false;
            this.initServices(configuration);
            const isSnap = process.platform === 'linux' && process.env.SNAP && process.env.SNAP_REVISION;
            this.issueReporterModel = new issueReporterModel_1.IssueReporterModel({
                issueType: configuration.data.issueType || 0 /* Bug */,
                versionInfo: {
                    vscodeVersion: `${product_1.default.nameShort} ${product_1.default.version} (${product_1.default.commit || 'Commit unknown'}, ${product_1.default.date || 'Date unknown'})`,
                    os: `${os.type()} ${os.arch()} ${os.release()}${isSnap ? ' snap' : ''}`
                },
                extensionsDisabled: !!this.environmentService.disableExtensions,
                fileOnExtension: configuration.data.extensionId ? true : undefined,
                selectedExtension: configuration.data.extensionId ? configuration.data.enabledExtensions.filter(extension => extension.id === configuration.data.extensionId)[0] : undefined
            });
            const issueReporterElement = this.getElementById('issue-reporter');
            if (issueReporterElement) {
                this.previewButton = new button_1.Button(issueReporterElement);
            }
            electron_1.ipcRenderer.on('vscode:issuePerformanceInfoResponse', (_, info) => {
                this.logService.trace('issueReporter: Received performance data');
                this.issueReporterModel.update(info);
                this.receivedPerformanceInfo = true;
                const state = this.issueReporterModel.getData();
                this.updateProcessInfo(state);
                this.updateWorkspaceInfo(state);
                this.updatePreviewButtonState();
            });
            electron_1.ipcRenderer.on('vscode:issueSystemInfoResponse', (_, info) => {
                this.logService.trace('issueReporter: Received system data');
                this.issueReporterModel.update({ systemInfo: info });
                this.receivedSystemInfo = true;
                this.updateSystemInfo(this.issueReporterModel.getData());
                this.updatePreviewButtonState();
            });
            electron_1.ipcRenderer.send('vscode:issueSystemInfoRequest');
            if (configuration.data.issueType === 1 /* PerformanceIssue */) {
                electron_1.ipcRenderer.send('vscode:issuePerformanceInfoRequest');
            }
            this.logService.trace('issueReporter: Sent data requests');
            if (window.document.documentElement.lang !== 'en') {
                show(this.getElementById('english'));
            }
            this.setUpTypes();
            this.setEventHandlers();
            this.applyZoom(configuration.data.zoomLevel);
            this.applyStyles(configuration.data.styles);
            this.handleExtensionData(configuration.data.enabledExtensions);
            if (configuration.data.issueType === 3 /* SettingsSearchIssue */) {
                this.handleSettingsSearchData(configuration.data);
            }
        }
        render() {
            this.renderBlocks();
        }
        setInitialFocus() {
            const { fileOnExtension } = this.issueReporterModel.getData();
            if (fileOnExtension) {
                const issueTitle = document.getElementById('issue-title');
                if (issueTitle) {
                    issueTitle.focus();
                }
            }
            else {
                const issueType = document.getElementById('issue-type');
                if (issueType) {
                    issueType.focus();
                }
            }
        }
        applyZoom(zoomLevel) {
            electron_1.webFrame.setZoomLevel(zoomLevel);
            browser.setZoomFactor(electron_1.webFrame.getZoomFactor());
            // See https://github.com/Microsoft/vscode/issues/26151
            // Cannot be trusted because the webFrame might take some time
            // until it really applies the new zoom level
            browser.setZoomLevel(electron_1.webFrame.getZoomLevel(), /*isTrusted*/ false);
        }
        applyStyles(styles) {
            const styleTag = document.createElement('style');
            const content = [];
            if (styles.inputBackground) {
                content.push(`input[type="text"], textarea, select, .issues-container > .issue > .issue-state, .block-info { background-color: ${styles.inputBackground}; }`);
            }
            if (styles.inputBorder) {
                content.push(`input[type="text"], textarea, select { border: 1px solid ${styles.inputBorder}; }`);
            }
            else {
                content.push(`input[type="text"], textarea, select { border: 1px solid transparent; }`);
            }
            if (styles.inputForeground) {
                content.push(`input[type="text"], textarea, select, .issues-container > .issue > .issue-state, .block-info { color: ${styles.inputForeground}; }`);
            }
            if (styles.inputErrorBorder) {
                content.push(`.invalid-input, .invalid-input:focus { border: 1px solid ${styles.inputErrorBorder} !important; }`);
                content.push(`.validation-error, .required-input { color: ${styles.inputErrorBorder}; }`);
            }
            if (styles.inputActiveBorder) {
                content.push(`input[type='text']:focus, textarea:focus, select:focus, summary:focus, button:focus, a:focus, .workbenchCommand:focus  { border: 1px solid ${styles.inputActiveBorder}; outline-style: none; }`);
            }
            if (styles.textLinkColor) {
                content.push(`a, .workbenchCommand { color: ${styles.textLinkColor}; }`);
            }
            if (styles.textLinkColor) {
                content.push(`a { color: ${styles.textLinkColor}; }`);
            }
            if (styles.textLinkActiveForeground) {
                content.push(`a:hover, .workbenchCommand:hover { color: ${styles.textLinkActiveForeground}; }`);
            }
            if (styles.sliderBackgroundColor) {
                content.push(`::-webkit-scrollbar-thumb { background-color: ${styles.sliderBackgroundColor}; }`);
            }
            if (styles.sliderActiveColor) {
                content.push(`::-webkit-scrollbar-thumb:active { background-color: ${styles.sliderActiveColor}; }`);
            }
            if (styles.sliderHoverColor) {
                content.push(`::--webkit-scrollbar-thumb:hover { background-color: ${styles.sliderHoverColor}; }`);
            }
            if (styles.buttonBackground) {
                content.push(`.monaco-text-button { background-color: ${styles.buttonBackground} !important; }`);
            }
            if (styles.buttonForeground) {
                content.push(`.monaco-text-button { color: ${styles.buttonForeground} !important; }`);
            }
            if (styles.buttonHoverBackground) {
                content.push(`.monaco-text-button:hover, .monaco-text-button:focus { background-color: ${styles.buttonHoverBackground} !important; }`);
            }
            styleTag.innerHTML = content.join('\n');
            document.head.appendChild(styleTag);
            document.body.style.color = styles.color || '';
        }
        handleExtensionData(extensions) {
            const { nonThemes, themes } = collections.groupBy(extensions, ext => {
                return ext.isTheme ? 'themes' : 'nonThemes';
            });
            const numberOfThemeExtesions = themes && themes.length;
            this.issueReporterModel.update({ numberOfThemeExtesions, enabledNonThemeExtesions: nonThemes, allExtensions: extensions });
            this.updateExtensionTable(nonThemes, numberOfThemeExtesions);
            if (this.environmentService.disableExtensions || extensions.length === 0) {
                this.getElementById('disableExtensions').disabled = true;
            }
            this.updateExtensionSelector(extensions);
        }
        handleSettingsSearchData(data) {
            this.issueReporterModel.update({
                actualSearchResults: data.actualSearchResults,
                query: data.query,
                filterResultCount: data.filterResultCount
            });
            this.updateSearchedExtensionTable(data.enabledExtensions);
            this.updateSettingsSearchDetails(data);
        }
        updateSettingsSearchDetails(data) {
            const target = document.querySelector('.block-settingsSearchResults .block-info');
            if (target) {
                const details = `
			<div class='block-settingsSearchResults-details'>
				<div>Query: "${data.query}"</div>
				<div>Literal match count: ${data.filterResultCount}</div>
			</div>
			`;
                let table = `
				<tr>
					<th>Setting</th>
					<th>Extension</th>
					<th>Score</th>
				</tr>`;
                data.actualSearchResults
                    .forEach(setting => {
                    table += `
						<tr>
							<td>${setting.key}</td>
							<td>${setting.extensionId}</td>
							<td>${String(setting.score).slice(0, 5)}</td>
						</tr>`;
                });
                target.innerHTML = `${details}<table>${table}</table>`;
            }
        }
        initServices(configuration) {
            const serviceCollection = new serviceCollection_1.ServiceCollection();
            const mainProcessService = new mainProcessService_1.MainProcessService(configuration.windowId);
            serviceCollection.set(mainProcessService_1.IMainProcessService, mainProcessService);
            this.environmentService = new environmentService_1.EnvironmentService(configuration, configuration.execPath);
            const logService = new spdlogService_1.SpdLogService(`issuereporter${configuration.windowId}`, this.environmentService.logsPath, log_1.getLogLevel(this.environmentService));
            const loggerClient = new logIpc_1.LoggerChannelClient(mainProcessService.getChannel('logger'));
            this.logService = new logIpc_1.FollowerLogService(loggerClient, logService);
            const sharedProcessService = ipc_2.createChannelSender(mainProcessService.getChannel('sharedProcess'));
            const sharedProcess = sharedProcessService.whenSharedProcessReady()
                .then(() => ipc_net_1.connect(this.environmentService.sharedIPCHandle, `window:${configuration.windowId}`));
            const instantiationService = new instantiationService_1.InstantiationService(serviceCollection, true);
            if (!this.environmentService.isExtensionDevelopment && !this.environmentService.args['disable-telemetry'] && !!product_1.default.enableTelemetry) {
                const channel = ipc_1.getDelayedChannel(sharedProcess.then(c => c.getChannel('telemetryAppender')));
                const appender = telemetryUtils_1.combinedAppender(new telemetryIpc_1.TelemetryAppenderClient(channel), new telemetryUtils_1.LogAppender(logService));
                const commonProperties = commonProperties_1.resolveCommonProperties(product_1.default.commit || 'Commit unknown', product_1.default.version, configuration.machineId, product_1.default.msftInternalDomains, this.environmentService.installSourcePath);
                const piiPaths = this.environmentService.extensionsPath ? [this.environmentService.appRoot, this.environmentService.extensionsPath] : [this.environmentService.appRoot];
                const config = { appender, commonProperties, piiPaths };
                const telemetryService = instantiationService.createInstance(telemetryService_1.TelemetryService, config);
                this._register(telemetryService);
                this.telemetryService = telemetryService;
            }
            else {
                this.telemetryService = telemetryUtils_1.NullTelemetryService;
            }
        }
        setEventHandlers() {
            this.addEventListener('issue-type', 'change', (event) => {
                const issueType = parseInt(event.target.value);
                this.issueReporterModel.update({ issueType: issueType });
                if (issueType === 1 /* PerformanceIssue */ && !this.receivedPerformanceInfo) {
                    electron_1.ipcRenderer.send('vscode:issuePerformanceInfoRequest');
                }
                this.updatePreviewButtonState();
                this.setSourceOptions();
                this.render();
            });
            ['includeSystemInfo', 'includeProcessInfo', 'includeWorkspaceInfo', 'includeExtensions', 'includeSearchedExtensions', 'includeSettingsSearchDetails'].forEach(elementId => {
                this.addEventListener(elementId, 'click', (event) => {
                    event.stopPropagation();
                    this.issueReporterModel.update({ [elementId]: !this.issueReporterModel.getData()[elementId] });
                });
            });
            const showInfoElements = document.getElementsByClassName('showInfo');
            for (let i = 0; i < showInfoElements.length; i++) {
                const showInfo = showInfoElements.item(i);
                showInfo.addEventListener('click', (e) => {
                    e.preventDefault();
                    const label = e.target;
                    if (label) {
                        const containingElement = label.parentElement && label.parentElement.parentElement;
                        const info = containingElement && containingElement.lastElementChild;
                        if (info && info.classList.contains('hidden')) {
                            show(info);
                            label.textContent = nls_1.localize('hide', "hide");
                        }
                        else {
                            hide(info);
                            label.textContent = nls_1.localize('show', "show");
                        }
                    }
                });
            }
            this.addEventListener('issue-source', 'change', (e) => {
                const value = e.target.value;
                const problemSourceHelpText = this.getElementById('problem-source-help-text');
                if (value === '') {
                    this.issueReporterModel.update({ fileOnExtension: undefined });
                    show(problemSourceHelpText);
                    this.clearSearchResults();
                    this.render();
                    return;
                }
                else {
                    hide(problemSourceHelpText);
                }
                const fileOnExtension = JSON.parse(value);
                this.issueReporterModel.update({ fileOnExtension: fileOnExtension });
                this.render();
                const title = this.getElementById('issue-title').value;
                if (fileOnExtension) {
                    this.searchExtensionIssues(title);
                }
                else {
                    const description = this.issueReporterModel.getData().issueDescription;
                    this.searchVSCodeIssues(title, description);
                }
            });
            this.addEventListener('description', 'input', (e) => {
                const issueDescription = e.target.value;
                this.issueReporterModel.update({ issueDescription });
                // Only search for extension issues on title change
                if (this.issueReporterModel.fileOnExtension() === false) {
                    const title = this.getElementById('issue-title').value;
                    this.searchVSCodeIssues(title, issueDescription);
                }
            });
            this.addEventListener('issue-title', 'input', (e) => {
                const title = e.target.value;
                const lengthValidationMessage = this.getElementById('issue-title-length-validation-error');
                if (title && this.getIssueUrlWithTitle(title).length > MAX_URL_LENGTH) {
                    show(lengthValidationMessage);
                }
                else {
                    hide(lengthValidationMessage);
                }
                const fileOnExtension = this.issueReporterModel.fileOnExtension();
                if (fileOnExtension === undefined) {
                    return;
                }
                if (fileOnExtension) {
                    this.searchExtensionIssues(title);
                }
                else {
                    const description = this.issueReporterModel.getData().issueDescription;
                    this.searchVSCodeIssues(title, description);
                }
            });
            this.previewButton.onDidClick(() => this.createIssue());
            function sendWorkbenchCommand(commandId) {
                electron_1.ipcRenderer.send('vscode:workbenchCommand', { id: commandId, from: 'issueReporter' });
            }
            this.addEventListener('disableExtensions', 'click', () => {
                sendWorkbenchCommand('workbench.action.reloadWindowWithExtensionsDisabled');
            });
            this.addEventListener('disableExtensions', 'keydown', (e) => {
                e.stopPropagation();
                if (e.keyCode === 13 || e.keyCode === 32) {
                    sendWorkbenchCommand('workbench.extensions.action.disableAll');
                    sendWorkbenchCommand('workbench.action.reloadWindow');
                }
            });
            document.onkeydown = async (e) => {
                const cmdOrCtrlKey = platform.isMacintosh ? e.metaKey : e.ctrlKey;
                // Cmd/Ctrl+Enter previews issue and closes window
                if (cmdOrCtrlKey && e.keyCode === 13) {
                    if (await this.createIssue()) {
                        electron_1.ipcRenderer.send('vscode:closeIssueReporter');
                    }
                }
                // Cmd/Ctrl + w closes issue window
                if (cmdOrCtrlKey && e.keyCode === 87) {
                    e.stopPropagation();
                    e.preventDefault();
                    const issueTitle = this.getElementById('issue-title').value;
                    const { issueDescription } = this.issueReporterModel.getData();
                    if (!this.hasBeenSubmitted && (issueTitle || issueDescription)) {
                        electron_1.ipcRenderer.send('vscode:issueReporterConfirmClose');
                    }
                    else {
                        electron_1.ipcRenderer.send('vscode:closeIssueReporter');
                    }
                }
                // Cmd/Ctrl + zooms in
                if (cmdOrCtrlKey && e.keyCode === 187) {
                    this.applyZoom(electron_1.webFrame.getZoomLevel() + 1);
                }
                // Cmd/Ctrl - zooms out
                if (cmdOrCtrlKey && e.keyCode === 189) {
                    this.applyZoom(electron_1.webFrame.getZoomLevel() - 1);
                }
                // With latest electron upgrade, cmd+a is no longer propagating correctly for inputs in this window on mac
                // Manually perform the selection
                if (platform.isMacintosh) {
                    if (cmdOrCtrlKey && e.keyCode === 65 && e.target) {
                        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                            e.target.select();
                        }
                    }
                }
            };
        }
        updatePreviewButtonState() {
            if (this.isPreviewEnabled()) {
                this.previewButton.label = nls_1.localize('previewOnGitHub', "Preview on GitHub");
                this.previewButton.enabled = true;
            }
            else {
                this.previewButton.enabled = false;
                this.previewButton.label = nls_1.localize('loadingData', "Loading data...");
            }
        }
        isPreviewEnabled() {
            const issueType = this.issueReporterModel.getData().issueType;
            if (issueType === 0 /* Bug */ && this.receivedSystemInfo) {
                return true;
            }
            if (issueType === 1 /* PerformanceIssue */ && this.receivedSystemInfo && this.receivedPerformanceInfo) {
                return true;
            }
            if (issueType === 2 /* FeatureRequest */) {
                return true;
            }
            if (issueType === 3 /* SettingsSearchIssue */) {
                return true;
            }
            return false;
        }
        getExtensionRepositoryUrl() {
            const selectedExtension = this.issueReporterModel.getData().selectedExtension;
            return selectedExtension && selectedExtension.repositoryUrl;
        }
        getExtensionBugsUrl() {
            const selectedExtension = this.issueReporterModel.getData().selectedExtension;
            return selectedExtension && selectedExtension.bugsUrl;
        }
        searchVSCodeIssues(title, issueDescription) {
            if (title) {
                this.searchDuplicates(title, issueDescription);
            }
            else {
                this.clearSearchResults();
            }
        }
        searchExtensionIssues(title) {
            const url = this.getExtensionGitHubUrl();
            if (title) {
                const matches = /^https?:\/\/github\.com\/(.*)/.exec(url);
                if (matches && matches.length) {
                    const repo = matches[1];
                    return this.searchGitHub(repo, title);
                }
                // If the extension has no repository, display empty search results
                if (this.issueReporterModel.getData().selectedExtension) {
                    this.clearSearchResults();
                    return this.displaySearchResults([]);
                }
            }
            this.clearSearchResults();
        }
        clearSearchResults() {
            const similarIssues = this.getElementById('similar-issues');
            similarIssues.innerHTML = '';
            this.numberOfSearchResultsDisplayed = 0;
        }
        searchGitHub(repo, title) {
            const query = `is:issue+repo:${repo}+${title}`;
            const similarIssues = this.getElementById('similar-issues');
            window.fetch(`https://api.github.com/search/issues?q=${query}`).then((response) => {
                response.json().then(result => {
                    similarIssues.innerHTML = '';
                    if (result && result.items) {
                        this.displaySearchResults(result.items);
                    }
                    else {
                        // If the items property isn't present, the rate limit has been hit
                        const message = dom_1.$('div.list-title');
                        message.textContent = nls_1.localize('rateLimited', "GitHub query limit exceeded. Please wait.");
                        similarIssues.appendChild(message);
                        const resetTime = response.headers.get('X-RateLimit-Reset');
                        const timeToWait = resetTime ? parseInt(resetTime) - Math.floor(Date.now() / 1000) : 1;
                        if (this.shouldQueueSearch) {
                            this.shouldQueueSearch = false;
                            setTimeout(() => {
                                this.searchGitHub(repo, title);
                                this.shouldQueueSearch = true;
                            }, timeToWait * 1000);
                        }
                    }
                }).catch(e => {
                    this.logSearchError(e);
                });
            }).catch(e => {
                this.logSearchError(e);
            });
        }
        searchDuplicates(title, body) {
            const url = 'https://vscode-probot.westus.cloudapp.azure.com:7890/duplicate_candidates';
            const init = {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    body
                }),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            };
            window.fetch(url, init).then((response) => {
                response.json().then(result => {
                    this.clearSearchResults();
                    if (result && result.candidates) {
                        this.displaySearchResults(result.candidates);
                    }
                    else {
                        throw new Error('Unexpected response, no candidates property');
                    }
                }).catch((error) => {
                    this.logSearchError(error);
                });
            }).catch((error) => {
                this.logSearchError(error);
            });
        }
        displaySearchResults(results) {
            const similarIssues = this.getElementById('similar-issues');
            if (results.length) {
                const issues = dom_1.$('div.issues-container');
                const issuesText = dom_1.$('div.list-title');
                issuesText.textContent = nls_1.localize('similarIssues', "Similar issues");
                this.numberOfSearchResultsDisplayed = results.length < 5 ? results.length : 5;
                for (let i = 0; i < this.numberOfSearchResultsDisplayed; i++) {
                    const issue = results[i];
                    const link = dom_1.$('a.issue-link', { href: issue.html_url });
                    link.textContent = issue.title;
                    link.title = issue.title;
                    link.addEventListener('click', (e) => this.openLink(e));
                    link.addEventListener('auxclick', (e) => this.openLink(e));
                    let issueState;
                    let item;
                    if (issue.state) {
                        issueState = dom_1.$('span.issue-state');
                        const issueIcon = dom_1.$('span.issue-icon');
                        const codicon = new codiconLabel_1.CodiconLabel(issueIcon);
                        codicon.text = issue.state === 'open' ? '$(issue-opened)' : '$(issue-closed)';
                        const issueStateLabel = dom_1.$('span.issue-state.label');
                        issueStateLabel.textContent = issue.state === 'open' ? nls_1.localize('open', "Open") : nls_1.localize('closed', "Closed");
                        issueState.title = issue.state === 'open' ? nls_1.localize('open', "Open") : nls_1.localize('closed', "Closed");
                        issueState.appendChild(issueIcon);
                        issueState.appendChild(issueStateLabel);
                        item = dom_1.$('div.issue', {}, issueState, link);
                    }
                    else {
                        item = dom_1.$('div.issue', {}, link);
                    }
                    issues.appendChild(item);
                }
                similarIssues.appendChild(issuesText);
                similarIssues.appendChild(issues);
            }
            else {
                const message = dom_1.$('div.list-title');
                message.textContent = nls_1.localize('noSimilarIssues', "No similar issues found");
                similarIssues.appendChild(message);
            }
        }
        logSearchError(error) {
            this.logService.warn('issueReporter#search ', error.message);
            this.telemetryService.publicLog2('issueReporterSearchError', { message: error.message });
        }
        setUpTypes() {
            const makeOption = (issueType, description) => `<option value="${issueType.valueOf()}">${strings_1.escape(description)}</option>`;
            const typeSelect = this.getElementById('issue-type');
            const { issueType } = this.issueReporterModel.getData();
            if (issueType === 3 /* SettingsSearchIssue */) {
                typeSelect.innerHTML = makeOption(3 /* SettingsSearchIssue */, nls_1.localize('settingsSearchIssue', "Settings Search Issue"));
                typeSelect.disabled = true;
            }
            else {
                typeSelect.innerHTML = [
                    makeOption(0 /* Bug */, nls_1.localize('bugReporter', "Bug Report")),
                    makeOption(2 /* FeatureRequest */, nls_1.localize('featureRequest', "Feature Request")),
                    makeOption(1 /* PerformanceIssue */, nls_1.localize('performanceIssue', "Performance Issue"))
                ].join('\n');
            }
            typeSelect.value = issueType.toString();
            this.setSourceOptions();
        }
        makeOption(value, description, disabled) {
            const option = document.createElement('option');
            option.disabled = disabled;
            option.value = value;
            option.textContent = description;
            return option;
        }
        setSourceOptions() {
            const sourceSelect = this.getElementById('issue-source');
            const { issueType, fileOnExtension } = this.issueReporterModel.getData();
            let selected = sourceSelect.selectedIndex;
            if (selected === -1 && fileOnExtension !== undefined) {
                selected = fileOnExtension ? 2 : 1;
            }
            sourceSelect.innerHTML = '';
            if (issueType === 2 /* FeatureRequest */) {
                sourceSelect.append(...[
                    this.makeOption('', nls_1.localize('selectSource', "Select source"), true),
                    this.makeOption('false', nls_1.localize('vscode', "Visual Studio Code"), false),
                    this.makeOption('true', nls_1.localize('extension', "An extension"), false)
                ]);
            }
            else {
                sourceSelect.append(...[
                    this.makeOption('', nls_1.localize('selectSource', "Select source"), true),
                    this.makeOption('false', nls_1.localize('vscode', "Visual Studio Code"), false),
                    this.makeOption('true', nls_1.localize('extension', "An extension"), false),
                    this.makeOption('', nls_1.localize('unknown', "Don't Know"), false)
                ]);
            }
            if (selected !== -1 && selected < sourceSelect.options.length) {
                sourceSelect.selectedIndex = selected;
            }
            else {
                sourceSelect.selectedIndex = 0;
                hide(this.getElementById('problem-source-help-text'));
            }
        }
        renderBlocks() {
            // Depending on Issue Type, we render different blocks and text
            const { issueType, fileOnExtension } = this.issueReporterModel.getData();
            const blockContainer = this.getElementById('block-container');
            const systemBlock = document.querySelector('.block-system');
            const processBlock = document.querySelector('.block-process');
            const workspaceBlock = document.querySelector('.block-workspace');
            const extensionsBlock = document.querySelector('.block-extensions');
            const searchedExtensionsBlock = document.querySelector('.block-searchedExtensions');
            const settingsSearchResultsBlock = document.querySelector('.block-settingsSearchResults');
            const problemSource = this.getElementById('problem-source');
            const descriptionTitle = this.getElementById('issue-description-label');
            const descriptionSubtitle = this.getElementById('issue-description-subtitle');
            const extensionSelector = this.getElementById('extension-selection');
            // Hide all by default
            hide(blockContainer);
            hide(systemBlock);
            hide(processBlock);
            hide(workspaceBlock);
            hide(extensionsBlock);
            hide(searchedExtensionsBlock);
            hide(settingsSearchResultsBlock);
            hide(problemSource);
            hide(extensionSelector);
            if (issueType === 0 /* Bug */) {
                show(blockContainer);
                show(systemBlock);
                show(problemSource);
                if (fileOnExtension) {
                    show(extensionSelector);
                }
                else {
                    show(extensionsBlock);
                }
                descriptionTitle.innerHTML = `${nls_1.localize('stepsToReproduce', "Steps to Reproduce")} <span class="required-input">*</span>`;
                descriptionSubtitle.innerHTML = nls_1.localize('bugDescription', "Share the steps needed to reliably reproduce the problem. Please include actual and expected results. We support GitHub-flavored Markdown. You will be able to edit your issue and add screenshots when we preview it on GitHub.");
            }
            else if (issueType === 1 /* PerformanceIssue */) {
                show(blockContainer);
                show(systemBlock);
                show(processBlock);
                show(workspaceBlock);
                show(problemSource);
                if (fileOnExtension) {
                    show(extensionSelector);
                }
                else {
                    show(extensionsBlock);
                }
                descriptionTitle.innerHTML = `${nls_1.localize('stepsToReproduce', "Steps to Reproduce")} <span class="required-input">*</span>`;
                descriptionSubtitle.innerHTML = nls_1.localize('performanceIssueDesciption', "When did this performance issue happen? Does it occur on startup or after a specific series of actions? We support GitHub-flavored Markdown. You will be able to edit your issue and add screenshots when we preview it on GitHub.");
            }
            else if (issueType === 2 /* FeatureRequest */) {
                descriptionTitle.innerHTML = `${nls_1.localize('description', "Description")} <span class="required-input">*</span>`;
                descriptionSubtitle.innerHTML = nls_1.localize('featureRequestDescription', "Please describe the feature you would like to see. We support GitHub-flavored Markdown. You will be able to edit your issue and add screenshots when we preview it on GitHub.");
                show(problemSource);
                if (fileOnExtension) {
                    show(extensionSelector);
                }
            }
            else if (issueType === 3 /* SettingsSearchIssue */) {
                show(blockContainer);
                show(searchedExtensionsBlock);
                show(settingsSearchResultsBlock);
                descriptionTitle.innerHTML = `${nls_1.localize('expectedResults', "Expected Results")} <span class="required-input">*</span>`;
                descriptionSubtitle.innerHTML = nls_1.localize('settingsSearchResultsDescription', "Please list the results that you were expecting to see when you searched with this query. We support GitHub-flavored Markdown. You will be able to edit your issue and add screenshots when we preview it on GitHub.");
            }
        }
        validateInput(inputId) {
            const inputElement = this.getElementById(inputId);
            if (!inputElement.value) {
                inputElement.classList.add('invalid-input');
                return false;
            }
            else {
                inputElement.classList.remove('invalid-input');
                return true;
            }
        }
        validateInputs() {
            let isValid = true;
            ['issue-title', 'description', 'issue-source'].forEach(elementId => {
                isValid = this.validateInput(elementId) && isValid;
            });
            if (this.issueReporterModel.fileOnExtension()) {
                isValid = this.validateInput('extension-selector') && isValid;
            }
            return isValid;
        }
        async createIssue() {
            if (!this.validateInputs()) {
                // If inputs are invalid, set focus to the first one and add listeners on them
                // to detect further changes
                const invalidInput = document.getElementsByClassName('invalid-input');
                if (invalidInput.length) {
                    invalidInput[0].focus();
                }
                this.addEventListener('issue-title', 'input', _ => {
                    this.validateInput('issue-title');
                });
                this.addEventListener('description', 'input', _ => {
                    this.validateInput('description');
                });
                this.addEventListener('issue-source', 'change', _ => {
                    this.validateInput('issue-source');
                });
                if (this.issueReporterModel.fileOnExtension()) {
                    this.addEventListener('extension-selector', 'change', _ => {
                        this.validateInput('extension-selector');
                    });
                }
                return false;
            }
            this.telemetryService.publicLog2('issueReporterSubmit', { issueType: this.issueReporterModel.getData().issueType, numSimilarIssuesDisplayed: this.numberOfSearchResultsDisplayed });
            this.hasBeenSubmitted = true;
            const baseUrl = this.getIssueUrlWithTitle(this.getElementById('issue-title').value);
            const issueBody = this.issueReporterModel.serialize();
            let url = baseUrl + `&body=${encodeURIComponent(issueBody)}`;
            if (url.length > MAX_URL_LENGTH) {
                try {
                    url = await this.writeToClipboard(baseUrl, issueBody);
                }
                catch (_) {
                    return false;
                }
            }
            electron_1.ipcRenderer.send('vscode:openExternal', url);
            return true;
        }
        async writeToClipboard(baseUrl, issueBody) {
            return new Promise((resolve, reject) => {
                electron_1.ipcRenderer.once('vscode:issueReporterClipboardResponse', (_, shouldWrite) => {
                    if (shouldWrite) {
                        electron_1.clipboard.writeText(issueBody);
                        resolve(baseUrl + `&body=${encodeURIComponent(nls_1.localize('pasteData', "We have written the needed data into your clipboard because it was too large to send. Please paste."))}`);
                    }
                    else {
                        reject();
                    }
                });
                electron_1.ipcRenderer.send('vscode:issueReporterClipboard');
            });
        }
        getExtensionGitHubUrl() {
            let repositoryUrl = '';
            const bugsUrl = this.getExtensionBugsUrl();
            const extensionUrl = this.getExtensionRepositoryUrl();
            // If given, try to match the extension's bug url
            if (bugsUrl && bugsUrl.match(/^https?:\/\/github\.com\/(.*)/)) {
                repositoryUrl = issueReporterUtil_1.normalizeGitHubUrl(bugsUrl);
            }
            else if (extensionUrl && extensionUrl.match(/^https?:\/\/github\.com\/(.*)/)) {
                repositoryUrl = issueReporterUtil_1.normalizeGitHubUrl(extensionUrl);
            }
            return repositoryUrl;
        }
        getIssueUrlWithTitle(issueTitle) {
            let repositoryUrl = product_1.default.reportIssueUrl;
            if (this.issueReporterModel.fileOnExtension()) {
                const extensionGitHubUrl = this.getExtensionGitHubUrl();
                if (extensionGitHubUrl) {
                    repositoryUrl = extensionGitHubUrl + '/issues/new';
                }
            }
            const queryStringPrefix = product_1.default.reportIssueUrl && product_1.default.reportIssueUrl.indexOf('?') === -1 ? '?' : '&';
            return `${repositoryUrl}${queryStringPrefix}title=${encodeURIComponent(issueTitle)}`;
        }
        updateSystemInfo(state) {
            const target = document.querySelector('.block-system .block-info');
            if (target) {
                const systemInfo = state.systemInfo;
                let renderedData = `
			<table>
				<tr><td>CPUs</td><td>${systemInfo.cpus}</td></tr>
				<tr><td>GPU Status</td><td>${Object.keys(systemInfo.gpuStatus).map(key => `${key}: ${systemInfo.gpuStatus[key]}`).join('<br>')}</td></tr>
				<tr><td>Load (avg)</td><td>${systemInfo.load}</td></tr>
				<tr><td>Memory (System)</td><td>${systemInfo.memory}</td></tr>
				<tr><td>Process Argv</td><td>${systemInfo.processArgs}</td></tr>
				<tr><td>Screen Reader</td><td>${systemInfo.screenReader}</td></tr>
				<tr><td>VM</td><td>${systemInfo.vmHint}</td></tr>
			</table>`;
                systemInfo.remoteData.forEach(remote => {
                    if (diagnostics_1.isRemoteDiagnosticError(remote)) {
                        renderedData += `
					<hr>
					<table>
						<tr><td>Remote</td><td>${remote.hostName}</td></tr>
						<tr><td></td><td>${remote.errorMessage}</td></tr>
					</table>`;
                    }
                    else {
                        renderedData += `
					<hr>
					<table>
						<tr><td>Remote</td><td>${remote.hostName}</td></tr>
						<tr><td>OS</td><td>${remote.machineInfo.os}</td></tr>
						<tr><td>CPUs</td><td>${remote.machineInfo.cpus}</td></tr>
						<tr><td>Memory (System)</td><td>${remote.machineInfo.memory}</td></tr>
						<tr><td>VM</td><td>${remote.machineInfo.vmHint}</td></tr>
					</table>`;
                    }
                });
                target.innerHTML = renderedData;
            }
        }
        updateExtensionSelector(extensions) {
            const extensionOptions = extensions.map(extension => {
                return {
                    name: extension.displayName || extension.name || '',
                    id: extension.id
                };
            });
            // Sort extensions by name
            extensionOptions.sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                if (aName > bName) {
                    return 1;
                }
                if (aName < bName) {
                    return -1;
                }
                return 0;
            });
            const makeOption = (extension, selectedExtension) => {
                const selected = selectedExtension && extension.id === selectedExtension.id;
                return `<option value="${extension.id}" ${selected ? 'selected' : ''}>${strings_1.escape(extension.name)}</option>`;
            };
            const extensionsSelector = this.getElementById('extension-selector');
            if (extensionsSelector) {
                const { selectedExtension } = this.issueReporterModel.getData();
                extensionsSelector.innerHTML = '<option></option>' + extensionOptions.map(extension => makeOption(extension, selectedExtension)).join('\n');
                this.addEventListener('extension-selector', 'change', (e) => {
                    const selectedExtensionId = e.target.value;
                    const extensions = this.issueReporterModel.getData().allExtensions;
                    const matches = extensions.filter(extension => extension.id === selectedExtensionId);
                    if (matches.length) {
                        this.issueReporterModel.update({ selectedExtension: matches[0] });
                        const title = this.getElementById('issue-title').value;
                        this.searchExtensionIssues(title);
                    }
                    else {
                        this.issueReporterModel.update({ selectedExtension: undefined });
                        this.clearSearchResults();
                    }
                });
            }
        }
        updateProcessInfo(state) {
            const target = document.querySelector('.block-process .block-info');
            if (target) {
                target.innerHTML = `<code>${state.processInfo}</code>`;
            }
        }
        updateWorkspaceInfo(state) {
            document.querySelector('.block-workspace .block-info code').textContent = '\n' + state.workspaceInfo;
        }
        updateExtensionTable(extensions, numThemeExtensions) {
            const target = document.querySelector('.block-extensions .block-info');
            if (target) {
                if (this.environmentService.disableExtensions) {
                    target.innerHTML = nls_1.localize('disabledExtensions', "Extensions are disabled");
                    return;
                }
                const themeExclusionStr = numThemeExtensions ? `\n(${numThemeExtensions} theme extensions excluded)` : '';
                extensions = extensions || [];
                if (!extensions.length) {
                    target.innerHTML = 'Extensions: none' + themeExclusionStr;
                    return;
                }
                const table = this.getExtensionTableHtml(extensions);
                target.innerHTML = `<table>${table}</table>${themeExclusionStr}`;
            }
        }
        updateSearchedExtensionTable(extensions) {
            const target = document.querySelector('.block-searchedExtensions .block-info');
            if (target) {
                if (!extensions.length) {
                    target.innerHTML = 'Extensions: none';
                    return;
                }
                const table = this.getExtensionTableHtml(extensions);
                target.innerHTML = `<table>${table}</table>`;
            }
        }
        getExtensionTableHtml(extensions) {
            let table = `
			<tr>
				<th>Extension</th>
				<th>Author (truncated)</th>
				<th>Version</th>
			</tr>`;
            table += extensions.map(extension => {
                return `
				<tr>
					<td>${extension.name}</td>
					<td>${extension.publisher.substr(0, 3)}</td>
					<td>${extension.version}</td>
				</tr>`;
            }).join('');
            return table;
        }
        openLink(event) {
            event.preventDefault();
            event.stopPropagation();
            // Exclude right click
            if (event.which < 3) {
                electron_1.shell.openExternal(event.target.href);
                this.telemetryService.publicLog2('issueReporterViewSimilarIssue');
            }
        }
        getElementById(elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                return element;
            }
            else {
                const error = new Error(`${elementId} not found.`);
                this.logService.error(error);
                this.telemetryService.publicLog2('issueReporterGetElementError', { message: error.message });
                return undefined;
            }
        }
        addEventListener(elementId, eventType, handler) {
            const element = this.getElementById(elementId);
            if (element) {
                element.addEventListener(eventType, handler);
            }
        }
    }
    __decorate([
        decorators_1.debounce(300)
    ], IssueReporter.prototype, "searchGitHub", null);
    __decorate([
        decorators_1.debounce(300)
    ], IssueReporter.prototype, "searchDuplicates", null);
    exports.IssueReporter = IssueReporter;
    // helper functions
    function hide(el) {
        if (el) {
            el.classList.add('hidden');
        }
    }
    function show(el) {
        if (el) {
            el.classList.remove('hidden');
        }
    }
});
//# sourceMappingURL=issueReporterMain.js.map