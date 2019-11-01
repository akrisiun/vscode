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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/contrib/output/common/output", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/panel/common/panelService", "../common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, platform_1, output_1, layoutService_1, panelService_1, extHost_protocol_1, extHostCustomers_1, uri_1, lifecycle_1, event_1) {
    "use strict";
    var MainThreadOutputService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    "use strict";
    let MainThreadOutputService = MainThreadOutputService_1 = class MainThreadOutputService extends lifecycle_1.Disposable {
        constructor(extHostContext, outputService, layoutService, panelService) {
            super();
            this._outputService = outputService;
            this._layoutService = layoutService;
            this._panelService = panelService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostOutputService);
            const setVisibleChannel = () => {
                const panel = this._panelService.getActivePanel();
                const visibleChannel = panel && panel.getId() === output_1.OUTPUT_PANEL_ID ? this._outputService.getActiveChannel() : undefined;
                this._proxy.$setVisibleChannel(visibleChannel ? visibleChannel.id : null);
            };
            this._register(event_1.Event.any(this._outputService.onActiveOutputChannel, this._panelService.onDidPanelOpen, this._panelService.onDidPanelClose)(() => setVisibleChannel()));
            setVisibleChannel();
        }
        $register(label, log, file) {
            const id = 'extension-output-#' + (MainThreadOutputService_1._idPool++);
            platform_1.Registry.as(output_1.Extensions.OutputChannels).registerChannel({ id, label, file: file ? uri_1.URI.revive(file) : undefined, log });
            this._register(lifecycle_1.toDisposable(() => this.$dispose(id)));
            return Promise.resolve(id);
        }
        $append(channelId, value) {
            const channel = this._getChannel(channelId);
            if (channel) {
                channel.append(value);
            }
            return undefined;
        }
        $update(channelId) {
            const channel = this._getChannel(channelId);
            if (channel) {
                channel.update();
            }
            return undefined;
        }
        $clear(channelId, till) {
            const channel = this._getChannel(channelId);
            if (channel) {
                channel.clear(till);
            }
            return undefined;
        }
        $reveal(channelId, preserveFocus) {
            const channel = this._getChannel(channelId);
            if (channel) {
                this._outputService.showChannel(channel.id, preserveFocus);
            }
            return undefined;
        }
        $close(channelId) {
            const panel = this._panelService.getActivePanel();
            if (panel && panel.getId() === output_1.OUTPUT_PANEL_ID) {
                const activeChannel = this._outputService.getActiveChannel();
                if (activeChannel && channelId === activeChannel.id) {
                    this._layoutService.setPanelHidden(true);
                }
            }
            return undefined;
        }
        $dispose(channelId) {
            const channel = this._getChannel(channelId);
            if (channel) {
                channel.dispose();
            }
            return undefined;
        }
        _getChannel(channelId) {
            return this._outputService.getChannel(channelId);
        }
    };
    MainThreadOutputService._idPool = 1;
    MainThreadOutputService = MainThreadOutputService_1 = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadOutputService),
        __param(1, output_1.IOutputService),
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, panelService_1.IPanelService)
    ], MainThreadOutputService);
    exports.MainThreadOutputService = MainThreadOutputService;
});
//# sourceMappingURL=mainThreadOutputService.js.map