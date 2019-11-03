var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/platform/instantiation/common/extensions", "vs/platform/localizations/common/localizations", "vs/platform/telemetry/common/telemetry", "vs/server/src/browser/api", "vs/server/src/browser/upload", "vs/server/src/common/nodeProxy", "vs/server/src/common/telemetry", "vs/server/src/common/util", "vs/workbench/services/localizations/electron-browser/localizationsService", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/contrib/localizations/browser/localizations.contribution"], function (require, exports, event_1, uri_1, extensions_1, localizations_1, telemetry_1, api_1, upload_1, nodeProxy_1, telemetry_2, util_1, localizationsService_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TelemetryService = class TelemetryService extends telemetry_2.TelemetryChannelClient {
        constructor(remoteAgentService) {
            super(remoteAgentService.getConnection().getChannel("telemetry"));
        }
    };
    TelemetryService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService)
    ], TelemetryService);
    let NodeProxyService = class NodeProxyService extends nodeProxy_1.NodeProxyChannelClient {
        constructor(remoteAgentService) {
            super(remoteAgentService.getConnection().getChannel("nodeProxy"));
            this._onClose = new event_1.Emitter();
            this.onClose = this._onClose.event;
            this._onDown = new event_1.Emitter();
            this.onDown = this._onDown.event;
            this._onUp = new event_1.Emitter();
            this.onUp = this._onUp.event;
            remoteAgentService.getConnection().onDidStateChange((state) => {
                switch (state.type) {
                    case 4 /* ConnectionGain */:
                        return this._onUp.fire();
                    case 0 /* ConnectionLost */:
                        return this._onDown.fire();
                    case 3 /* ReconnectionPermanentFailure */:
                        return this._onClose.fire();
                }
            });
        }
    };
    NodeProxyService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService)
    ], NodeProxyService);
    extensions_1.registerSingleton(localizations_1.ILocalizationsService, localizationsService_1.LocalizationsService);
    extensions_1.registerSingleton(nodeProxy_1.INodeProxyService, NodeProxyService);
    extensions_1.registerSingleton(telemetry_1.ITelemetryService, TelemetryService);
    extensions_1.registerSingleton(upload_1.IUploadService, upload_1.UploadService, true);
    /**
     * This is called by vs/workbench/browser/web.main.ts after the workbench has
     * been initialized so we can initialize our own client-side code.
     */
    exports.initialize = async (services) => {
        const target = window;
        target.ide = api_1.coderApi(services);
        target.vscode = api_1.vscodeApi(services);
        const event = new CustomEvent("ide-ready");
        event.ide = target.ide;
        event.vscode = target.vscode;
        window.dispatchEvent(event);
    };
    /**
     * Return the URL modified with the specified query variables. It's pretty
     * stupid so it probably doesn't cover any edge cases. Undefined values will
     * unset existing values. Doesn't allow duplicates.
     */
    exports.withQuery = (url, replace) => {
        const uri = uri_1.URI.parse(url);
        const query = Object.assign({}, replace);
        uri.query.split("&").forEach((kv) => {
            const [key, value] = util_1.split(kv, "=");
            if (!(key in query)) {
                query[key] = value;
            }
        });
        return uri.with({
            query: Object.keys(query)
                .filter((k) => typeof query[k] !== "undefined")
                .map((k) => `${k}=${query[k]}`).join("&"),
        }).toString(true);
    };
});
//# sourceMappingURL=client.js.map