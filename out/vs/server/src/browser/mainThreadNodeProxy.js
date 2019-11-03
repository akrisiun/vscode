var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/server/src/common/nodeProxy", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCustomers"], function (require, exports, nodeProxy_1, extHost_protocol_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MainThreadNodeProxy = class MainThreadNodeProxy {
        constructor(extHostContext, proxyService) {
            this.proxyService = proxyService;
            this.disposed = false;
            this.disposables = [];
            if (!extHostContext.remoteAuthority) { // HACK: A terrible way to detect if running in the worker.
                const proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNodeProxy);
                this.disposables = [
                    this.proxyService.onMessage((message) => proxy.$onMessage(message)),
                    this.proxyService.onClose(() => proxy.$onClose()),
                    this.proxyService.onDown(() => proxy.$onDown()),
                    this.proxyService.onUp(() => proxy.$onUp()),
                ];
            }
        }
        $send(message) {
            if (!this.disposed) {
                this.proxyService.send(message);
            }
        }
        dispose() {
            this.disposables.forEach((d) => d.dispose());
            this.disposables = [];
            this.disposed = true;
        }
    };
    MainThreadNodeProxy = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadNodeProxy),
        __param(1, nodeProxy_1.INodeProxyService)
    ], MainThreadNodeProxy);
    exports.MainThreadNodeProxy = MainThreadNodeProxy;
});
//# sourceMappingURL=mainThreadNodeProxy.js.map