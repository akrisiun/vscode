var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService"], function (require, exports, event_1, instantiation_1, extHost_protocol_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtHostNodeProxy = class ExtHostNodeProxy {
        constructor(rpc) {
            this._onMessage = new event_1.Emitter();
            this.onMessage = this._onMessage.event;
            this._onClose = new event_1.Emitter();
            this.onClose = this._onClose.event;
            this._onDown = new event_1.Emitter();
            this.onDown = this._onDown.event;
            this._onUp = new event_1.Emitter();
            this.onUp = this._onUp.event;
            this.proxy = rpc.getProxy(extHost_protocol_1.MainContext.MainThreadNodeProxy);
        }
        $onMessage(message) {
            this._onMessage.fire(message);
        }
        $onClose() {
            this._onClose.fire();
        }
        $onUp() {
            this._onUp.fire();
        }
        $onDown() {
            this._onDown.fire();
        }
        send(message) {
            this.proxy.$send(message);
        }
    };
    ExtHostNodeProxy = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostNodeProxy);
    exports.ExtHostNodeProxy = ExtHostNodeProxy;
    exports.IExtHostNodeProxy = instantiation_1.createDecorator('IExtHostNodeProxy');
});
//# sourceMappingURL=extHostNodeProxy.js.map