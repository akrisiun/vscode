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
define(["require", "exports", "vs/platform/environment/common/environment", "crypto", "vs/base/node/paths", "os", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/decorators", "vs/platform/product/common/product", "vs/base/common/date", "vs/base/common/platform", "vs/base/common/amd", "vs/base/common/uri"], function (require, exports, environment_1, crypto, paths, os, path, resources, decorators_1, product_1, date_1, platform_1, amd_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Read this before there's any chance it is overwritten
    // Related to https://github.com/Microsoft/vscode/issues/30624
    exports.xdgRuntimeDir = process.env['XDG_RUNTIME_DIR'];
    function getNixIPCHandle(userDataPath, type) {
        const vscodePortable = process.env['VSCODE_PORTABLE'];
        if (exports.xdgRuntimeDir && !vscodePortable) {
            const scope = crypto.createHash('md5').update(userDataPath).digest('hex').substr(0, 8);
            return path.join(exports.xdgRuntimeDir, `vscode-${scope}-${product_1.default.version}-${type}.sock`);
        }
        return path.join(userDataPath, `${product_1.default.version}-${type}.sock`);
    }
    function getWin32IPCHandle(userDataPath, type) {
        const scope = crypto.createHash('md5').update(userDataPath).digest('hex');
        return `\\\\.\\pipe\\${scope}-${product_1.default.version}-${type}-sock`;
    }
    function getIPCHandle(userDataPath, type) {
        if (platform_1.isWindows) {
            return getWin32IPCHandle(userDataPath, type);
        }
        return getNixIPCHandle(userDataPath, type);
    }
    function getCLIPath(execPath, appRoot, isBuilt) {
        // Windows
        if (platform_1.isWindows) {
            if (isBuilt) {
                return path.join(path.dirname(execPath), 'bin', `${product_1.default.applicationName}.cmd`);
            }
            return path.join(appRoot, 'scripts', 'code-cli.bat');
        }
        // Linux
        if (platform_1.isLinux) {
            if (isBuilt) {
                return path.join(path.dirname(execPath), 'bin', `${product_1.default.applicationName}`);
            }
            return path.join(appRoot, 'scripts', 'code-cli.sh');
        }
        // macOS
        if (isBuilt) {
            return path.join(appRoot, 'bin', 'code');
        }
        return path.join(appRoot, 'scripts', 'code-cli.sh');
    }
    class EnvironmentService {
        constructor(_args, _execPath) {
            this._args = _args;
            this._execPath = _execPath;
            if (!process.env['VSCODE_LOGS']) {
                const key = date_1.toLocalISOString(new Date()).replace(/-|:|\.\d+Z$/g, '');
                process.env['VSCODE_LOGS'] = path.join(this.userDataPath, 'logs', key);
            }
            this.logsPath = process.env['VSCODE_LOGS'];
        }
        get args() { return this._args; }
        get appRoot() { return path.dirname(amd_1.getPathFromAmdModule(require, '')); }
        get execPath() { return this._execPath; }
        get cliPath() { return getCLIPath(this.execPath, this.appRoot, this.isBuilt); }
        get userHome() { return os.homedir(); }
        get userDataPath() {
            const vscodePortable = process.env['VSCODE_PORTABLE'];
            if (vscodePortable) {
                return path.join(vscodePortable, 'user-data');
            }
            return parseUserDataDir(this._args, process);
        }
        get appNameLong() { return product_1.default.nameLong; }
        get appQuality() { return product_1.default.quality; }
        get appSettingsHome() { return uri_1.URI.file(path.join(this.userDataPath, 'User')); }
        get userRoamingDataHome() { return this.appSettingsHome; }
        get settingsResource() { return resources.joinPath(this.userRoamingDataHome, 'settings.json'); }
        get settingsSyncPreviewResource() { return resources.joinPath(this.userRoamingDataHome, '.settings.json'); }
        get userDataSyncLogResource() { return uri_1.URI.file(path.join(this.logsPath, 'userDataSync.log')); }
        get machineSettingsHome() { return uri_1.URI.file(path.join(this.userDataPath, 'Machine')); }
        get machineSettingsResource() { return resources.joinPath(this.machineSettingsHome, 'settings.json'); }
        get globalStorageHome() { return path.join(this.appSettingsHome.fsPath, 'globalStorage'); }
        get workspaceStorageHome() { return path.join(this.appSettingsHome.fsPath, 'workspaceStorage'); }
        get keybindingsResource() { return resources.joinPath(this.userRoamingDataHome, 'keybindings.json'); }
        get keyboardLayoutResource() { return resources.joinPath(this.userRoamingDataHome, 'keyboardLayout.json'); }
        get argvResource() {
            const vscodePortable = process.env['VSCODE_PORTABLE'];
            if (vscodePortable) {
                return uri_1.URI.file(path.join(vscodePortable, 'argv.json'));
            }
            return uri_1.URI.file(path.join(this.userHome, product_1.default.dataFolderName, 'argv.json'));
        }
        get isExtensionDevelopment() { return !!this._args.extensionDevelopmentPath; }
        get backupHome() { return uri_1.URI.file(path.join(this.userDataPath, environment_1.BACKUPS)); }
        get backupWorkspacesPath() { return path.join(this.backupHome.fsPath, 'workspaces.json'); }
        get untitledWorkspacesHome() { return uri_1.URI.file(path.join(this.userDataPath, 'Workspaces')); }
        get installSourcePath() { return path.join(this.userDataPath, 'installSource'); }
        get builtinExtensionsPath() {
            const fromArgs = parsePathArg(this._args['builtin-extensions-dir'], process);
            if (fromArgs) {
                return fromArgs;
            }
            else {
                return path.normalize(path.join(amd_1.getPathFromAmdModule(require, ''), '..', 'extensions'));
            }
        }
        get extensionsPath() {
            const fromArgs = parsePathArg(this._args['extensions-dir'], process);
            if (fromArgs) {
                return fromArgs;
            }
            const vscodeExtensions = process.env['VSCODE_EXTENSIONS'];
            if (vscodeExtensions) {
                return vscodeExtensions;
            }
            const vscodePortable = process.env['VSCODE_PORTABLE'];
            if (vscodePortable) {
                return path.join(vscodePortable, 'extensions');
            }
            return path.join(this.userHome, product_1.default.dataFolderName, 'extensions');
        }
        get extensionDevelopmentLocationURI() {
            const s = this._args.extensionDevelopmentPath;
            if (Array.isArray(s)) {
                return s.map(p => {
                    if (/^[^:/?#]+?:\/\//.test(p)) {
                        return uri_1.URI.parse(p);
                    }
                    return uri_1.URI.file(path.normalize(p));
                });
            }
            return undefined;
        }
        get extensionTestsLocationURI() {
            const s = this._args.extensionTestsPath;
            if (s) {
                if (/^[^:/?#]+?:\/\//.test(s)) {
                    return uri_1.URI.parse(s);
                }
                return uri_1.URI.file(path.normalize(s));
            }
            return undefined;
        }
        get disableExtensions() {
            if (this._args['disable-extensions']) {
                return true;
            }
            const disableExtensions = this._args['disable-extension'];
            if (disableExtensions) {
                if (typeof disableExtensions === 'string') {
                    return [disableExtensions];
                }
                if (Array.isArray(disableExtensions) && disableExtensions.length > 0) {
                    return disableExtensions;
                }
            }
            return false;
        }
        get debugExtensionHost() { return parseExtensionHostPort(this._args, this.isBuilt); }
        get isBuilt() { return !process.env['VSCODE_DEV']; }
        get verbose() { return !!this._args.verbose; }
        get log() { return this._args.log; }
        get wait() { return !!this._args.wait; }
        get status() { return !!this._args.status; }
        get mainIPCHandle() { return getIPCHandle(this.userDataPath, 'main'); }
        get sharedIPCHandle() { return getIPCHandle(this.userDataPath, 'shared'); }
        get nodeCachedDataDir() { return process.env['VSCODE_NODE_CACHED_DATA_DIR'] || undefined; }
        get galleryMachineIdResource() { return resources.joinPath(uri_1.URI.file(this.userDataPath), 'machineid'); }
        get disableUpdates() { return !!this._args['disable-updates']; }
        get disableCrashReporter() { return !!this._args['disable-crash-reporter']; }
        get driverHandle() { return this._args['driver']; }
        get driverVerbose() { return !!this._args['driver-verbose']; }
    }
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "appRoot", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "cliPath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "userHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "userDataPath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "appSettingsHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "userRoamingDataHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "settingsResource", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "settingsSyncPreviewResource", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "userDataSyncLogResource", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "machineSettingsHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "machineSettingsResource", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "globalStorageHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "workspaceStorageHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "keybindingsResource", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "keyboardLayoutResource", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "argvResource", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "isExtensionDevelopment", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "backupHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "backupWorkspacesPath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "untitledWorkspacesHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "installSourcePath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "builtinExtensionsPath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "extensionsPath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "extensionDevelopmentLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "extensionTestsLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "debugExtensionHost", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "mainIPCHandle", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "sharedIPCHandle", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "nodeCachedDataDir", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "galleryMachineIdResource", null);
    exports.EnvironmentService = EnvironmentService;
    function parseExtensionHostPort(args, isBuild) {
        return parseDebugPort(args['inspect-extensions'], args['inspect-brk-extensions'], 5870, isBuild, args.debugId);
    }
    exports.parseExtensionHostPort = parseExtensionHostPort;
    function parseSearchPort(args, isBuild) {
        return parseDebugPort(args['inspect-search'], args['inspect-brk-search'], 5876, isBuild);
    }
    exports.parseSearchPort = parseSearchPort;
    function parseDebugPort(debugArg, debugBrkArg, defaultBuildPort, isBuild, debugId) {
        const portStr = debugBrkArg || debugArg;
        const port = Number(portStr) || (!isBuild ? defaultBuildPort : null);
        const brk = port ? Boolean(!!debugBrkArg) : false;
        return { port, break: brk, debugId };
    }
    function parsePathArg(arg, process) {
        if (!arg) {
            return undefined;
        }
        // Determine if the arg is relative or absolute, if relative use the original CWD
        // (VSCODE_CWD), not the potentially overridden one (process.cwd()).
        const resolved = path.resolve(arg);
        if (path.normalize(arg) === resolved) {
            return resolved;
        }
        return path.resolve(process.env['VSCODE_CWD'] || process.cwd(), arg);
    }
    exports.parsePathArg = parsePathArg;
    function parseUserDataDir(args, process) {
        return parsePathArg(args['user-data-dir'], process) || path.resolve(paths.getDefaultUserDataPath(process.platform));
    }
    exports.parseUserDataDir = parseUserDataDir;
});
//# sourceMappingURL=environmentService.js.map