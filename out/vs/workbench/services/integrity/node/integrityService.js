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
define(["require", "exports", "vs/nls", "crypto", "fs", "vs/base/common/severity", "vs/base/common/uri", "vs/workbench/services/integrity/common/integrity", "vs/platform/lifecycle/common/lifecycle", "vs/platform/product/common/product", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/extensions", "vs/platform/opener/common/opener"], function (require, exports, nls, crypto, fs, severity_1, uri_1, integrity_1, lifecycle_1, product_1, notification_1, storage_1, extensions_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class IntegrityStorage {
        constructor(storageService) {
            this.storageService = storageService;
            this.value = this._read();
        }
        _read() {
            let jsonValue = this.storageService.get(IntegrityStorage.KEY, 0 /* GLOBAL */);
            if (!jsonValue) {
                return null;
            }
            try {
                return JSON.parse(jsonValue);
            }
            catch (err) {
                return null;
            }
        }
        get() {
            return this.value;
        }
        set(data) {
            this.value = data;
            this.storageService.store(IntegrityStorage.KEY, JSON.stringify(this.value), 0 /* GLOBAL */);
        }
    }
    IntegrityStorage.KEY = 'integrityService';
    let IntegrityServiceImpl = class IntegrityServiceImpl {
        constructor(notificationService, storageService, lifecycleService, openerService) {
            this.notificationService = notificationService;
            this.lifecycleService = lifecycleService;
            this.openerService = openerService;
            this._storage = new IntegrityStorage(storageService);
            this._isPurePromise = this._isPure();
            this.isPure().then(r => {
                if (r.isPure) {
                    return; // all is good
                }
                this._prompt();
            });
        }
        _prompt() {
            var _a;
            const storedData = this._storage.get();
            if (((_a = storedData) === null || _a === void 0 ? void 0 : _a.dontShowPrompt) && storedData.commit === product_1.default.commit) {
                return; // Do not prompt
            }
            const checksumFailMoreInfoUrl = product_1.default.checksumFailMoreInfoUrl;
            const message = nls.localize('integrity.prompt', "Your {0} installation appears to be corrupt. Please reinstall.", product_1.default.nameShort);
            if (checksumFailMoreInfoUrl) {
                this.notificationService.prompt(severity_1.default.Warning, message, [
                    {
                        label: nls.localize('integrity.moreInformation', "More Information"),
                        run: () => this.openerService.open(uri_1.URI.parse(checksumFailMoreInfoUrl))
                    },
                    {
                        label: nls.localize('integrity.dontShowAgain', "Don't Show Again"),
                        isSecondary: true,
                        run: () => this._storage.set({ dontShowPrompt: true, commit: product_1.default.commit })
                    }
                ], { sticky: true });
            }
            else {
                this.notificationService.notify({
                    severity: severity_1.default.Warning,
                    message,
                    sticky: true
                });
            }
        }
        isPure() {
            return this._isPurePromise;
        }
        async _isPure() {
            const expectedChecksums = product_1.default.checksums || {};
            await this.lifecycleService.when(4 /* Eventually */);
            const allResults = await Promise.all(Object.keys(expectedChecksums).map(filename => this._resolve(filename, expectedChecksums[filename])));
            let isPure = true;
            for (let i = 0, len = allResults.length; i < len; i++) {
                if (!allResults[i].isPure) {
                    isPure = false;
                    break;
                }
            }
            return {
                isPure: isPure,
                proof: allResults
            };
        }
        _resolve(filename, expected) {
            let fileUri = uri_1.URI.parse(require.toUrl(filename));
            return new Promise((resolve, reject) => {
                fs.readFile(fileUri.fsPath, (err, buff) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(IntegrityServiceImpl._createChecksumPair(fileUri, this._computeChecksum(buff), expected));
                });
            });
        }
        _computeChecksum(buff) {
            let hash = crypto
                .createHash('md5')
                .update(buff)
                .digest('base64')
                .replace(/=+$/, '');
            return hash;
        }
        static _createChecksumPair(uri, actual, expected) {
            return {
                uri: uri,
                actual: actual,
                expected: expected,
                isPure: (actual === expected)
            };
        }
    };
    IntegrityServiceImpl = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, storage_1.IStorageService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, opener_1.IOpenerService)
    ], IntegrityServiceImpl);
    exports.IntegrityServiceImpl = IntegrityServiceImpl;
    extensions_1.registerSingleton(integrity_1.IIntegrityService, IntegrityServiceImpl, true);
});
//# sourceMappingURL=integrityService.js.map