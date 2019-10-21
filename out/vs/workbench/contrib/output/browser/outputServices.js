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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/workbench/contrib/output/common/output", "vs/workbench/services/panel/common/panelService", "vs/workbench/contrib/output/common/outputLinkProvider", "vs/editor/common/services/resolverService", "vs/workbench/common/editor/resourceEditorInput", "vs/platform/log/common/log", "vs/platform/lifecycle/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/base/common/cancellation", "vs/workbench/services/output/common/outputChannelModel"], function (require, exports, nls, event_1, uri_1, lifecycle_1, instantiation_1, storage_1, platform_1, editor_1, output_1, panelService_1, outputLinkProvider_1, resolverService_1, resourceEditorInput_1, log_1, lifecycle_2, contextkey_1, cancellation_1, outputChannelModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const OUTPUT_ACTIVE_CHANNEL_KEY = 'output.activechannel';
    let OutputChannel = class OutputChannel extends lifecycle_1.Disposable {
        constructor(outputChannelDescriptor, outputChannelModelService) {
            super();
            this.outputChannelDescriptor = outputChannelDescriptor;
            this.scrollLock = false;
            this.id = outputChannelDescriptor.id;
            this.label = outputChannelDescriptor.label;
            this.model = this._register(outputChannelModelService.createOutputChannelModel(this.id, uri_1.URI.from({ scheme: output_1.OUTPUT_SCHEME, path: this.id }), outputChannelDescriptor.log ? output_1.LOG_MIME : output_1.OUTPUT_MIME, outputChannelDescriptor.file));
        }
        append(output) {
            this.model.append(output);
        }
        update() {
            this.model.update();
        }
        clear(till) {
            this.model.clear(till);
        }
    };
    OutputChannel = __decorate([
        __param(1, outputChannelModel_1.IOutputChannelModelService)
    ], OutputChannel);
    let OutputService = class OutputService extends lifecycle_1.Disposable {
        constructor(storageService, instantiationService, panelService, textModelResolverService, logService, lifecycleService, contextKeyService) {
            super();
            this.storageService = storageService;
            this.instantiationService = instantiationService;
            this.panelService = panelService;
            this.logService = logService;
            this.lifecycleService = lifecycleService;
            this.contextKeyService = contextKeyService;
            this.channels = new Map();
            this._onActiveOutputChannel = this._register(new event_1.Emitter());
            this.onActiveOutputChannel = this._onActiveOutputChannel.event;
            this.activeChannelIdInStorage = this.storageService.get(OUTPUT_ACTIVE_CHANNEL_KEY, 1 /* WORKSPACE */, '');
            // Register as text model content provider for output
            textModelResolverService.registerTextModelContentProvider(output_1.OUTPUT_SCHEME, this);
            instantiationService.createInstance(outputLinkProvider_1.OutputLinkProvider);
            // Create output channels for already registered channels
            const registry = platform_1.Registry.as(output_1.Extensions.OutputChannels);
            for (const channelIdentifier of registry.getChannels()) {
                this.onDidRegisterChannel(channelIdentifier.id);
            }
            this._register(registry.onDidRegisterChannel(this.onDidRegisterChannel, this));
            this._register(panelService.onDidPanelOpen(({ panel, focus }) => this.onDidPanelOpen(panel, !focus), this));
            this._register(panelService.onDidPanelClose(this.onDidPanelClose, this));
            // Set active channel to first channel if not set
            if (!this.activeChannel) {
                const channels = this.getChannelDescriptors();
                this.setActiveChannel(channels && channels.length > 0 ? this.getChannel(channels[0].id) : undefined);
            }
            this._register(this.lifecycleService.onShutdown(() => this.dispose()));
        }
        provideTextContent(resource) {
            const channel = this.getChannel(resource.path);
            if (channel) {
                return channel.model.loadModel();
            }
            return null;
        }
        showChannel(id, preserveFocus) {
            const channel = this.getChannel(id);
            if (!channel || this.isChannelShown(channel)) {
                if (this._outputPanel && !preserveFocus) {
                    this._outputPanel.focus();
                }
                return Promise.resolve(undefined);
            }
            this.setActiveChannel(channel);
            let promise;
            if (this.isPanelShown()) {
                promise = this.doShowChannel(channel, !!preserveFocus);
            }
            else {
                this.panelService.openPanel(output_1.OUTPUT_PANEL_ID);
                promise = this.doShowChannel(channel, !!preserveFocus);
            }
            return promise.then(() => this._onActiveOutputChannel.fire(id));
        }
        getChannel(id) {
            return this.channels.get(id);
        }
        getChannelDescriptors() {
            return platform_1.Registry.as(output_1.Extensions.OutputChannels).getChannels();
        }
        getActiveChannel() {
            return this.activeChannel;
        }
        onDidRegisterChannel(channelId) {
            const channel = this.createChannel(channelId);
            this.channels.set(channelId, channel);
            if (!this.activeChannel || this.activeChannelIdInStorage === channelId) {
                this.setActiveChannel(channel);
                this.onDidPanelOpen(this.panelService.getActivePanel(), true)
                    .then(() => this._onActiveOutputChannel.fire(channelId));
            }
        }
        onDidPanelOpen(panel, preserveFocus) {
            if (panel && panel.getId() === output_1.OUTPUT_PANEL_ID) {
                this._outputPanel = this.panelService.getActivePanel();
                if (this.activeChannel) {
                    return this.doShowChannel(this.activeChannel, preserveFocus);
                }
            }
            return Promise.resolve(undefined);
        }
        onDidPanelClose(panel) {
            if (this._outputPanel && panel.getId() === output_1.OUTPUT_PANEL_ID) {
                output_1.CONTEXT_ACTIVE_LOG_OUTPUT.bindTo(this.contextKeyService).set(false);
                this._outputPanel.clearInput();
            }
        }
        createChannel(id) {
            const channelDisposables = [];
            const channel = this.instantiateChannel(id);
            channel.model.onDidAppendedContent(() => {
                if (!channel.scrollLock) {
                    const panel = this.panelService.getActivePanel();
                    if (panel && panel.getId() === output_1.OUTPUT_PANEL_ID && this.isChannelShown(channel)) {
                        let outputPanel = panel;
                        outputPanel.revealLastLine();
                    }
                }
            }, channelDisposables);
            channel.model.onDispose(() => {
                if (this.activeChannel === channel) {
                    const channels = this.getChannelDescriptors();
                    const channel = channels.length ? this.getChannel(channels[0].id) : undefined;
                    if (channel && this.isPanelShown()) {
                        this.showChannel(channel.id, true);
                    }
                    else {
                        this.setActiveChannel(channel);
                        if (this.activeChannel) {
                            this._onActiveOutputChannel.fire(this.activeChannel.id);
                        }
                    }
                }
                platform_1.Registry.as(output_1.Extensions.OutputChannels).removeChannel(id);
                lifecycle_1.dispose(channelDisposables);
            }, channelDisposables);
            return channel;
        }
        instantiateChannel(id) {
            const channelData = platform_1.Registry.as(output_1.Extensions.OutputChannels).getChannel(id);
            if (!channelData) {
                this.logService.error(`Channel '${id}' is not registered yet`);
                throw new Error(`Channel '${id}' is not registered yet`);
            }
            return this.instantiationService.createInstance(OutputChannel, channelData);
        }
        doShowChannel(channel, preserveFocus) {
            if (this._outputPanel) {
                output_1.CONTEXT_ACTIVE_LOG_OUTPUT.bindTo(this.contextKeyService).set(!!channel.outputChannelDescriptor.file && channel.outputChannelDescriptor.log);
                return this._outputPanel.setInput(this.createInput(channel), editor_1.EditorOptions.create({ preserveFocus }), cancellation_1.CancellationToken.None)
                    .then(() => {
                    if (!preserveFocus && this._outputPanel) {
                        this._outputPanel.focus();
                    }
                });
            }
            return Promise.resolve(undefined);
        }
        isChannelShown(channel) {
            return this.isPanelShown() && this.activeChannel === channel;
        }
        isPanelShown() {
            const panel = this.panelService.getActivePanel();
            return !!panel && panel.getId() === output_1.OUTPUT_PANEL_ID;
        }
        createInput(channel) {
            const resource = uri_1.URI.from({ scheme: output_1.OUTPUT_SCHEME, path: channel.id });
            return this.instantiationService.createInstance(resourceEditorInput_1.ResourceEditorInput, nls.localize('output', "{0} - Output", channel.label), nls.localize('channel', "Output channel for '{0}'", channel.label), resource, undefined);
        }
        setActiveChannel(channel) {
            this.activeChannel = channel;
            if (this.activeChannel) {
                this.storageService.store(OUTPUT_ACTIVE_CHANNEL_KEY, this.activeChannel.id, 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(OUTPUT_ACTIVE_CHANNEL_KEY, 1 /* WORKSPACE */);
            }
        }
    };
    OutputService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, panelService_1.IPanelService),
        __param(3, resolverService_1.ITextModelService),
        __param(4, log_1.ILogService),
        __param(5, lifecycle_2.ILifecycleService),
        __param(6, contextkey_1.IContextKeyService)
    ], OutputService);
    exports.OutputService = OutputService;
    let LogContentProvider = class LogContentProvider {
        constructor(outputService, outputChannelModelService) {
            this.outputService = outputService;
            this.outputChannelModelService = outputChannelModelService;
            this.channelModels = new Map();
        }
        provideTextContent(resource) {
            if (resource.scheme === output_1.LOG_SCHEME) {
                let channelModel = this.getChannelModel(resource);
                if (channelModel) {
                    return channelModel.loadModel();
                }
            }
            return null;
        }
        getChannelModel(resource) {
            const channelId = resource.path;
            let channelModel = this.channelModels.get(channelId);
            if (!channelModel) {
                const channelDisposables = [];
                const outputChannelDescriptor = this.outputService.getChannelDescriptors().filter(({ id }) => id === channelId)[0];
                if (outputChannelDescriptor && outputChannelDescriptor.file) {
                    channelModel = this.outputChannelModelService.createOutputChannelModel(channelId, resource, outputChannelDescriptor.log ? output_1.LOG_MIME : output_1.OUTPUT_MIME, outputChannelDescriptor.file);
                    channelModel.onDispose(() => lifecycle_1.dispose(channelDisposables), channelDisposables);
                    this.channelModels.set(channelId, channelModel);
                }
            }
            return channelModel;
        }
    };
    LogContentProvider = __decorate([
        __param(0, output_1.IOutputService),
        __param(1, outputChannelModel_1.IOutputChannelModelService)
    ], LogContentProvider);
    exports.LogContentProvider = LogContentProvider;
});
//# sourceMappingURL=outputServices.js.map