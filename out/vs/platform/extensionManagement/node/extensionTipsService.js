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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/path", "vs/platform/product/common/productService", "vs/platform/environment/common/environment", "vs/base/common/process", "vs/platform/files/common/files", "vs/base/common/platform", "vs/base/common/arrays", "vs/base/common/collections", "vs/platform/request/common/request", "vs/platform/log/common/log", "vs/platform/extensionManagement/common/extensionTipsService"], function (require, exports, uri_1, path_1, productService_1, environment_1, process_1, files_1, platform_1, arrays_1, collections_1, request_1, log_1, extensionTipsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionTipsService = void 0;
    let ExtensionTipsService = /** @class */ (() => {
        let ExtensionTipsService = class ExtensionTipsService extends extensionTipsService_1.ExtensionTipsService {
            constructor(environmentService, fileService, productService, requestService, logService) {
                super(fileService, productService, requestService, logService);
                this.environmentService = environmentService;
                this.allImportantExecutableTips = {};
                this.allOtherExecutableTips = {};
                if (productService.exeBasedExtensionTips) {
                    collections_1.forEach(productService.exeBasedExtensionTips, ({ key, value }) => {
                        if (value.important) {
                            this.allImportantExecutableTips[key] = value;
                        }
                        else {
                            this.allOtherExecutableTips[key] = value;
                        }
                    });
                }
            }
            getImportantExecutableBasedTips() {
                return this.getValidExecutableBasedExtensionTips(this.allImportantExecutableTips);
            }
            getOtherExecutableBasedTips() {
                return this.getValidExecutableBasedExtensionTips(this.allOtherExecutableTips);
            }
            async getValidExecutableBasedExtensionTips(executableTips) {
                const result = [];
                const checkedExecutables = new Map();
                for (const exeName of Object.keys(executableTips)) {
                    const extensionTip = executableTips[exeName];
                    if (!arrays_1.isNonEmptyArray(extensionTip === null || extensionTip === void 0 ? void 0 : extensionTip.recommendations)) {
                        continue;
                    }
                    const exePaths = [];
                    if (platform_1.isWindows) {
                        if (extensionTip.windowsPath) {
                            exePaths.push(extensionTip.windowsPath.replace('%USERPROFILE%', process_1.env['USERPROFILE'])
                                .replace('%ProgramFiles(x86)%', process_1.env['ProgramFiles(x86)'])
                                .replace('%ProgramFiles%', process_1.env['ProgramFiles'])
                                .replace('%APPDATA%', process_1.env['APPDATA'])
                                .replace('%WINDIR%', process_1.env['WINDIR']));
                        }
                    }
                    else {
                        exePaths.push(path_1.join('/usr/local/bin', exeName));
                        exePaths.push(path_1.join(this.environmentService.userHome.fsPath, exeName));
                    }
                    for (const exePath of exePaths) {
                        let exists = checkedExecutables.get(exePath);
                        if (exists === undefined) {
                            exists = await this.fileService.exists(uri_1.URI.file(exePath));
                            checkedExecutables.set(exePath, exists);
                        }
                        if (exists) {
                            extensionTip.recommendations.forEach(recommendation => result.push({
                                extensionId: recommendation,
                                friendlyName: extensionTip.friendlyName,
                                exeFriendlyName: extensionTip.exeFriendlyName,
                                windowsPath: extensionTip.windowsPath,
                            }));
                        }
                    }
                }
                return result;
            }
        };
        ExtensionTipsService = __decorate([
            __param(0, environment_1.IEnvironmentService),
            __param(1, files_1.IFileService),
            __param(2, productService_1.IProductService),
            __param(3, request_1.IRequestService),
            __param(4, log_1.ILogService)
        ], ExtensionTipsService);
        return ExtensionTipsService;
    })();
    exports.ExtensionTipsService = ExtensionTipsService;
});
//# sourceMappingURL=extensionTipsService.js.map