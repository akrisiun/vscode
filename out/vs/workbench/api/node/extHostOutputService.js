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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/path", "vs/workbench/services/output/node/outputAppender", "vs/base/common/date", "vs/base/node/pfs", "vs/workbench/api/common/extHostOutput", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService", "vs/base/common/lifecycle"], function (require, exports, uri_1, path_1, outputAppender_1, date_1, pfs_1, extHostOutput_1, extHostInitDataService_1, extHostRpcService_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostOutputChannelBackedByFile extends extHostOutput_1.AbstractExtHostOutputChannel {
        constructor(name, appender, proxy) {
            super(name, false, uri_1.URI.file(appender.file), proxy);
            this._appender = appender;
        }
        append(value) {
            super.append(value);
            this._appender.append(value);
            this._onDidAppend.fire();
        }
        update() {
            this._appender.flush();
            super.update();
        }
        show(columnOrPreserveFocus, preserveFocus) {
            this._appender.flush();
            super.show(columnOrPreserveFocus, preserveFocus);
        }
        clear() {
            this._appender.flush();
            super.clear();
        }
    }
    exports.ExtHostOutputChannelBackedByFile = ExtHostOutputChannelBackedByFile;
    let ExtHostOutputService2 = class ExtHostOutputService2 extends extHostOutput_1.ExtHostOutputService {
        constructor(extHostRpc, initData) {
            super(extHostRpc);
            this._namePool = 1;
            this._channels = new Map();
            this._visibleChannelDisposable = new lifecycle_1.MutableDisposable();
            this._logsLocation = initData.logsLocation;
        }
        $setVisibleChannel(channelId) {
            if (channelId) {
                const channel = this._channels.get(channelId);
                if (channel) {
                    this._visibleChannelDisposable.value = channel.onDidAppend(() => channel.update());
                }
            }
        }
        createOutputChannel(name) {
            name = name.trim();
            if (!name) {
                throw new Error('illegal argument `name`. must not be falsy');
            }
            const extHostOutputChannel = this._doCreateOutChannel(name);
            extHostOutputChannel.then(channel => channel._id.then(id => this._channels.set(id, channel)));
            return new extHostOutput_1.LazyOutputChannel(name, extHostOutputChannel);
        }
        async _doCreateOutChannel(name) {
            try {
                const outputDirPath = path_1.join(this._logsLocation.fsPath, `output_logging_${date_1.toLocalISOString(new Date()).replace(/-|:|\.\d+Z$/g, '')}`);
                const outputDir = await pfs_1.dirExists(outputDirPath).then(exists => exists || pfs_1.mkdirp(outputDirPath).then(() => true)).then(() => outputDirPath);
                const fileName = `${this._namePool++}-${name.replace(/[\\/:\*\?"<>\|]/g, '')}`;
                const file = uri_1.URI.file(path_1.join(outputDir, `${fileName}.log`));
                const appender = new outputAppender_1.OutputAppender(fileName, file.fsPath);
                return new ExtHostOutputChannelBackedByFile(name, appender, this._proxy);
            }
            catch (error) {
                // Do not crash if logger cannot be created
                console.log(error);
                return new extHostOutput_1.ExtHostPushOutputChannel(name, this._proxy);
            }
        }
    };
    ExtHostOutputService2 = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService)
    ], ExtHostOutputService2);
    exports.ExtHostOutputService2 = ExtHostOutputService2;
});
//# sourceMappingURL=extHostOutputService.js.map