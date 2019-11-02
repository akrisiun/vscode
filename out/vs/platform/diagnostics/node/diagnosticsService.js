var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "os", "vs/base/node/id", "vs/platform/diagnostics/common/diagnostics", "fs", "vs/base/common/path", "vs/base/common/json", "vs/base/node/ps", "vs/platform/product/common/product", "vs/base/common/strings", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation"], function (require, exports, osLib, id_1, diagnostics_1, fs_1, path_1, json_1, ps_1, product_1, strings_1, platform_1, uri_1, telemetry_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ID = 'diagnosticsService';
    exports.IDiagnosticsService = instantiation_1.createDecorator(exports.ID);
    function collectWorkspaceStats(folder, filter) {
        const configFilePatterns = [
            { 'tag': 'grunt.js', 'pattern': /^gruntfile\.js$/i },
            { 'tag': 'gulp.js', 'pattern': /^gulpfile\.js$/i },
            { 'tag': 'tsconfig.json', 'pattern': /^tsconfig\.json$/i },
            { 'tag': 'package.json', 'pattern': /^package\.json$/i },
            { 'tag': 'jsconfig.json', 'pattern': /^jsconfig\.json$/i },
            { 'tag': 'tslint.json', 'pattern': /^tslint\.json$/i },
            { 'tag': 'eslint.json', 'pattern': /^eslint\.json$/i },
            { 'tag': 'tasks.json', 'pattern': /^tasks\.json$/i },
            { 'tag': 'launch.json', 'pattern': /^launch\.json$/i },
            { 'tag': 'settings.json', 'pattern': /^settings\.json$/i },
            { 'tag': 'webpack.config.js', 'pattern': /^webpack\.config\.js$/i },
            { 'tag': 'project.json', 'pattern': /^project\.json$/i },
            { 'tag': 'makefile', 'pattern': /^makefile$/i },
            { 'tag': 'sln', 'pattern': /^.+\.sln$/i },
            { 'tag': 'csproj', 'pattern': /^.+\.csproj$/i },
            { 'tag': 'cmake', 'pattern': /^.+\.cmake$/i }
        ];
        const fileTypes = new Map();
        const configFiles = new Map();
        const MAX_FILES = 20000;
        function walk(dir, filter, token, done) {
            let results = [];
            fs_1.readdir(dir, async (err, files) => {
                // Ignore folders that can't be read
                if (err) {
                    return done(results);
                }
                if (token.count > MAX_FILES) {
                    token.count += files.length;
                    token.maxReached = true;
                    return done(results);
                }
                let pending = files.length;
                if (pending === 0) {
                    return done(results);
                }
                let filesToRead = files;
                if (token.count + files.length > MAX_FILES) {
                    token.maxReached = true;
                    pending = MAX_FILES - token.count;
                    filesToRead = files.slice(0, pending);
                }
                token.count += files.length;
                for (const file of filesToRead) {
                    fs_1.stat(path_1.join(dir, file), (err, stats) => {
                        // Ignore files that can't be read
                        if (err) {
                            if (--pending === 0) {
                                return done(results);
                            }
                        }
                        else {
                            if (stats.isDirectory()) {
                                if (filter.indexOf(file) === -1) {
                                    walk(path_1.join(dir, file), filter, token, (res) => {
                                        results = results.concat(res);
                                        if (--pending === 0) {
                                            return done(results);
                                        }
                                    });
                                }
                                else {
                                    if (--pending === 0) {
                                        done(results);
                                    }
                                }
                            }
                            else {
                                results.push(file);
                                if (--pending === 0) {
                                    done(results);
                                }
                            }
                        }
                    });
                }
            });
        }
        const addFileType = (fileType) => {
            if (fileTypes.has(fileType)) {
                fileTypes.set(fileType, fileTypes.get(fileType) + 1);
            }
            else {
                fileTypes.set(fileType, 1);
            }
        };
        const addConfigFiles = (fileName) => {
            for (const each of configFilePatterns) {
                if (each.pattern.test(fileName)) {
                    if (configFiles.has(each.tag)) {
                        configFiles.set(each.tag, configFiles.get(each.tag) + 1);
                    }
                    else {
                        configFiles.set(each.tag, 1);
                    }
                }
            }
        };
        const acceptFile = (name) => {
            if (name.lastIndexOf('.') >= 0) {
                const suffix = name.split('.').pop();
                if (suffix) {
                    addFileType(suffix);
                }
            }
            addConfigFiles(name);
        };
        const token = { count: 0, maxReached: false };
        return new Promise((resolve, reject) => {
            walk(folder, filter, token, async (files) => {
                files.forEach(acceptFile);
                const launchConfigs = await collectLaunchConfigs(folder);
                resolve({
                    configFiles: asSortedItems(configFiles),
                    fileTypes: asSortedItems(fileTypes),
                    fileCount: token.count,
                    maxFilesReached: token.maxReached,
                    launchConfigFiles: launchConfigs
                });
            });
        });
    }
    exports.collectWorkspaceStats = collectWorkspaceStats;
    function asSortedItems(map) {
        const a = [];
        map.forEach((value, index) => a.push({ name: index, count: value }));
        return a.sort((a, b) => b.count - a.count);
    }
    function getMachineInfo() {
        const MB = 1024 * 1024;
        const GB = 1024 * MB;
        const machineInfo = {
            os: `${osLib.type()} ${osLib.arch()} ${osLib.release()}`,
            memory: `${(osLib.totalmem() / GB).toFixed(2)}GB (${(osLib.freemem() / GB).toFixed(2)}GB free)`,
            vmHint: `${Math.round((id_1.virtualMachineHint.value() * 100))}%`,
        };
        const cpus = osLib.cpus();
        if (cpus && cpus.length > 0) {
            machineInfo.cpus = `${cpus[0].model} (${cpus.length} x ${cpus[0].speed})`;
        }
        return machineInfo;
    }
    exports.getMachineInfo = getMachineInfo;
    function collectLaunchConfigs(folder) {
        let launchConfigs = new Map();
        let launchConfig = path_1.join(folder, '.vscode', 'launch.json');
        return new Promise((resolve, reject) => {
            fs_1.exists(launchConfig, (doesExist) => {
                if (doesExist) {
                    fs_1.readFile(launchConfig, (err, contents) => {
                        if (err) {
                            return resolve([]);
                        }
                        const errors = [];
                        const json = json_1.parse(contents.toString(), errors);
                        if (errors.length) {
                            console.log(`Unable to parse ${launchConfig}`);
                            return resolve([]);
                        }
                        if (json_1.getNodeType(json) === 'object' && json['configurations']) {
                            for (const each of json['configurations']) {
                                const type = each['type'];
                                if (type) {
                                    if (launchConfigs.has(type)) {
                                        launchConfigs.set(type, launchConfigs.get(type) + 1);
                                    }
                                    else {
                                        launchConfigs.set(type, 1);
                                    }
                                }
                            }
                        }
                        return resolve(asSortedItems(launchConfigs));
                    });
                }
                else {
                    return resolve([]);
                }
            });
        });
    }
    exports.collectLaunchConfigs = collectLaunchConfigs;
    let DiagnosticsService = class DiagnosticsService {
        constructor(telemetryService) {
            this.telemetryService = telemetryService;
        }
        formatMachineInfo(info) {
            const output = [];
            output.push(`OS Version:       ${info.os}`);
            output.push(`CPUs:             ${info.cpus}`);
            output.push(`Memory (System):  ${info.memory}`);
            output.push(`VM:               ${info.vmHint}`);
            return output.join('\n');
        }
        formatEnvironment(info) {
            const MB = 1024 * 1024;
            const GB = 1024 * MB;
            const output = [];
            output.push(`Version:          ${product_1.default.nameShort} ${product_1.default.version} (${product_1.default.commit || 'Commit unknown'}, ${product_1.default.date || 'Date unknown'})`);
            output.push(`OS Version:       ${osLib.type()} ${osLib.arch()} ${osLib.release()}`);
            const cpus = osLib.cpus();
            if (cpus && cpus.length > 0) {
                output.push(`CPUs:             ${cpus[0].model} (${cpus.length} x ${cpus[0].speed})`);
            }
            output.push(`Memory (System):  ${(osLib.totalmem() / GB).toFixed(2)}GB (${(osLib.freemem() / GB).toFixed(2)}GB free)`);
            if (!platform_1.isWindows) {
                output.push(`Load (avg):       ${osLib.loadavg().map(l => Math.round(l)).join(', ')}`); // only provided on Linux/macOS
            }
            output.push(`VM:               ${Math.round((id_1.virtualMachineHint.value() * 100))}%`);
            output.push(`Screen Reader:    ${info.screenReader ? 'yes' : 'no'}`);
            output.push(`Process Argv:     ${info.mainArguments.join(' ')}`);
            output.push(`GPU Status:       ${this.expandGPUFeatures(info.gpuFeatureStatus)}`);
            return output.join('\n');
        }
        async getPerformanceInfo(info, remoteData) {
            return Promise.all([ps_1.listProcesses(info.mainPID), this.formatWorkspaceMetadata(info)]).then(async (result) => {
                let [rootProcess, workspaceInfo] = result;
                let processInfo = this.formatProcessList(info, rootProcess);
                remoteData.forEach(diagnostics => {
                    if (diagnostics_1.isRemoteDiagnosticError(diagnostics)) {
                        processInfo += `\n${diagnostics.errorMessage}`;
                        workspaceInfo += `\n${diagnostics.errorMessage}`;
                    }
                    else {
                        processInfo += `\n\nRemote: ${diagnostics.hostName}`;
                        if (diagnostics.processes) {
                            processInfo += `\n${this.formatProcessList(info, diagnostics.processes)}`;
                        }
                        if (diagnostics.workspaceMetadata) {
                            workspaceInfo += `\n|  Remote: ${diagnostics.hostName}`;
                            for (const folder of Object.keys(diagnostics.workspaceMetadata)) {
                                const metadata = diagnostics.workspaceMetadata[folder];
                                let countMessage = `${metadata.fileCount} files`;
                                if (metadata.maxFilesReached) {
                                    countMessage = `more than ${countMessage}`;
                                }
                                workspaceInfo += `|    Folder (${folder}): ${countMessage}`;
                                workspaceInfo += this.formatWorkspaceStats(metadata);
                            }
                        }
                    }
                });
                return {
                    processInfo,
                    workspaceInfo
                };
            });
        }
        async getSystemInfo(info, remoteData) {
            const { memory, vmHint, os, cpus } = getMachineInfo();
            const systemInfo = {
                os,
                memory,
                cpus,
                vmHint,
                processArgs: `${info.mainArguments.join(' ')}`,
                gpuStatus: info.gpuFeatureStatus,
                screenReader: `${info.screenReader ? 'yes' : 'no'}`,
                remoteData
            };
            if (!platform_1.isWindows) {
                systemInfo.load = `${osLib.loadavg().map(l => Math.round(l)).join(', ')}`;
            }
            return Promise.resolve(systemInfo);
        }
        async getDiagnostics(info, remoteDiagnostics) {
            const output = [];
            return ps_1.listProcesses(info.mainPID).then(async (rootProcess) => {
                // Environment Info
                output.push('');
                output.push(this.formatEnvironment(info));
                // Process List
                output.push('');
                output.push(this.formatProcessList(info, rootProcess));
                // Workspace Stats
                if (info.windows.some(window => window.folderURIs && window.folderURIs.length > 0 && !window.remoteAuthority)) {
                    output.push('');
                    output.push('Workspace Stats: ');
                    output.push(await this.formatWorkspaceMetadata(info));
                }
                remoteDiagnostics.forEach(diagnostics => {
                    if (diagnostics_1.isRemoteDiagnosticError(diagnostics)) {
                        output.push(`\n${diagnostics.errorMessage}`);
                    }
                    else {
                        output.push('\n\n');
                        output.push(`Remote:           ${diagnostics.hostName}`);
                        output.push(this.formatMachineInfo(diagnostics.machineInfo));
                        if (diagnostics.processes) {
                            output.push(this.formatProcessList(info, diagnostics.processes));
                        }
                        if (diagnostics.workspaceMetadata) {
                            for (const folder of Object.keys(diagnostics.workspaceMetadata)) {
                                const metadata = diagnostics.workspaceMetadata[folder];
                                let countMessage = `${metadata.fileCount} files`;
                                if (metadata.maxFilesReached) {
                                    countMessage = `more than ${countMessage}`;
                                }
                                output.push(`Folder (${folder}): ${countMessage}`);
                                output.push(this.formatWorkspaceStats(metadata));
                            }
                        }
                    }
                });
                output.push('');
                output.push('');
                return output.join('\n');
            });
        }
        formatWorkspaceStats(workspaceStats) {
            const output = [];
            const lineLength = 60;
            let col = 0;
            const appendAndWrap = (name, count) => {
                const item = ` ${name}(${count})`;
                if (col + item.length > lineLength) {
                    output.push(line);
                    line = '|                 ';
                    col = line.length;
                }
                else {
                    col += item.length;
                }
                line += item;
            };
            // File Types
            let line = '|      File types:';
            const maxShown = 10;
            let max = workspaceStats.fileTypes.length > maxShown ? maxShown : workspaceStats.fileTypes.length;
            for (let i = 0; i < max; i++) {
                const item = workspaceStats.fileTypes[i];
                appendAndWrap(item.name, item.count);
            }
            output.push(line);
            // Conf Files
            if (workspaceStats.configFiles.length >= 0) {
                line = '|      Conf files:';
                col = 0;
                workspaceStats.configFiles.forEach((item) => {
                    appendAndWrap(item.name, item.count);
                });
                output.push(line);
            }
            if (workspaceStats.launchConfigFiles.length > 0) {
                let line = '|      Launch Configs:';
                workspaceStats.launchConfigFiles.forEach(each => {
                    const item = each.count > 1 ? ` ${each.name}(${each.count})` : ` ${each.name}`;
                    line += item;
                });
                output.push(line);
            }
            return output.join('\n');
        }
        expandGPUFeatures(gpuFeatures) {
            const longestFeatureName = Math.max(...Object.keys(gpuFeatures).map(feature => feature.length));
            // Make columns aligned by adding spaces after feature name
            return Object.keys(gpuFeatures).map(feature => `${feature}:  ${strings_1.repeat(' ', longestFeatureName - feature.length)}  ${gpuFeatures[feature]}`).join('\n                  ');
        }
        formatWorkspaceMetadata(info) {
            const output = [];
            const workspaceStatPromises = [];
            info.windows.forEach(window => {
                if (window.folderURIs.length === 0 || !!window.remoteAuthority) {
                    return;
                }
                output.push(`|  Window (${window.title})`);
                window.folderURIs.forEach(uriComponents => {
                    const folderUri = uri_1.URI.revive(uriComponents);
                    if (folderUri.scheme === 'file') {
                        const folder = folderUri.fsPath;
                        workspaceStatPromises.push(collectWorkspaceStats(folder, ['node_modules', '.git']).then(stats => {
                            let countMessage = `${stats.fileCount} files`;
                            if (stats.maxFilesReached) {
                                countMessage = `more than ${countMessage}`;
                            }
                            output.push(`|    Folder (${path_1.basename(folder)}): ${countMessage}`);
                            output.push(this.formatWorkspaceStats(stats));
                        }).catch(error => {
                            output.push(`|      Error: Unable to collect workspace stats for folder ${folder} (${error.toString()})`);
                        }));
                    }
                    else {
                        output.push(`|    Folder (${folderUri.toString()}): Workspace stats not available.`);
                    }
                });
            });
            return Promise.all(workspaceStatPromises)
                .then(_ => output.join('\n'))
                .catch(e => `Unable to collect workspace stats: ${e}`);
        }
        formatProcessList(info, rootProcess) {
            const mapPidToWindowTitle = new Map();
            info.windows.forEach(window => mapPidToWindowTitle.set(window.pid, window.title));
            const output = [];
            output.push('CPU %\tMem MB\t   PID\tProcess');
            if (rootProcess) {
                this.formatProcessItem(info.mainPID, mapPidToWindowTitle, output, rootProcess, 0);
            }
            return output.join('\n');
        }
        formatProcessItem(mainPid, mapPidToWindowTitle, output, item, indent) {
            const isRoot = (indent === 0);
            const MB = 1024 * 1024;
            // Format name with indent
            let name;
            if (isRoot) {
                name = item.pid === mainPid ? `${product_1.default.applicationName} main` : 'remote agent';
            }
            else {
                name = `${strings_1.repeat('  ', indent)} ${item.name}`;
                if (item.name === 'window') {
                    name = `${name} (${mapPidToWindowTitle.get(item.pid)})`;
                }
            }
            const memory = process.platform === 'win32' ? item.mem : (osLib.totalmem() * (item.mem / 100));
            output.push(`${strings_1.pad(Number(item.load.toFixed(0)), 5, ' ')}\t${strings_1.pad(Number((memory / MB).toFixed(0)), 6, ' ')}\t${strings_1.pad(Number((item.pid).toFixed(0)), 6, ' ')}\t${name}`);
            // Recurse into children if any
            if (Array.isArray(item.children)) {
                item.children.forEach(child => this.formatProcessItem(mainPid, mapPidToWindowTitle, output, child, indent + 1));
            }
        }
        async reportWorkspaceStats(workspace) {
            workspace.folders.forEach(folder => {
                const folderUri = uri_1.URI.revive(folder.uri);
                if (folderUri.scheme === 'file') {
                    const folder = folderUri.fsPath;
                    collectWorkspaceStats(folder, ['node_modules', '.git']).then(stats => {
                        this.telemetryService.publicLog2('workspace.stats', {
                            'workspace.id': workspace.telemetryId,
                            rendererSessionId: workspace.rendererSessionId
                        });
                        stats.fileTypes.forEach(e => {
                            this.telemetryService.publicLog2('workspace.stats.file', {
                                rendererSessionId: workspace.rendererSessionId,
                                type: e.name,
                                count: e.count
                            });
                        });
                        stats.launchConfigFiles.forEach(e => {
                            this.telemetryService.publicLog2('workspace.stats.launchConfigFile', {
                                rendererSessionId: workspace.rendererSessionId,
                                type: e.name,
                                count: e.count
                            });
                        });
                        stats.configFiles.forEach(e => {
                            this.telemetryService.publicLog2('workspace.stats.configFiles', {
                                rendererSessionId: workspace.rendererSessionId,
                                type: e.name,
                                count: e.count
                            });
                        });
                    }).catch(_ => {
                        // Report nothing if collecting metadata fails.
                    });
                }
            });
        }
    };
    DiagnosticsService = __decorate([
        __param(0, telemetry_1.ITelemetryService)
    ], DiagnosticsService);
    exports.DiagnosticsService = DiagnosticsService;
});
//# sourceMappingURL=diagnosticsService.js.map