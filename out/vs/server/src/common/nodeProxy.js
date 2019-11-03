define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INodeProxyService = instantiation_1.createDecorator("nodeProxyService");
    class NodeProxyChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case "onMessage": return this.service.onMessage;
            }
            throw new Error(`Invalid listen ${event}`);
        }
        async call(_, command, args) {
            switch (command) {
                case "send": return this.service.send(args[0]);
            }
            throw new Error(`Invalid call ${command}`);
        }
    }
    exports.NodeProxyChannel = NodeProxyChannel;
    class NodeProxyChannelClient {
        constructor(channel) {
            this.channel = channel;
            this.onMessage = this.channel.listen("onMessage");
        }
        send(data) {
            this.channel.call("send", [data]);
        }
    }
    exports.NodeProxyChannelClient = NodeProxyChannelClient;
});
//# sourceMappingURL=nodeProxy.js.map