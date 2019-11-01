/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/base/common/strings", "os", "vs/platform/product/common/product", "vs/nls", "vs/base/browser/browser", "vs/base/common/platform", "vs/base/parts/contextmenu/electron-browser/contextmenu", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/diagnostics/common/diagnostics", "vs/css!./media/processExplorer"], function (require, exports, electron_1, strings_1, os_1, product_1, nls_1, browser, platform, contextmenu_1, dom_1, lifecycle_1, diagnostics_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let mapPidToWindowTitle = new Map();
    const DEBUG_FLAGS_PATTERN = /\s--(inspect|debug)(-brk|port)?=(\d+)?/;
    const DEBUG_PORT_PATTERN = /\s--(inspect|debug)-port=(\d+)/;
    const listeners = new lifecycle_1.DisposableStore();
    const collapsedStateCache = new Map();
    let lastRequestTime;
    function getProcessList(rootProcess, isLocal) {
        const processes = [];
        if (rootProcess) {
            getProcessItem(processes, rootProcess, 0, isLocal);
        }
        return processes;
    }
    function getProcessItem(processes, item, indent, isLocal) {
        const isRoot = (indent === 0);
        const MB = 1024 * 1024;
        let name = item.name;
        if (isRoot) {
            name = isLocal ? `${product_1.default.applicationName} main` : 'remote agent';
        }
        if (name === 'window') {
            const windowTitle = mapPidToWindowTitle.get(item.pid);
            name = windowTitle !== undefined ? `${name} (${mapPidToWindowTitle.get(item.pid)})` : name;
        }
        // Format name with indent
        const formattedName = isRoot ? name : `${strings_1.repeat('    ', indent)} ${name}`;
        const memory = process.platform === 'win32' ? item.mem : (os_1.totalmem() * (item.mem / 100));
        processes.push({
            cpu: item.load,
            memory: (memory / MB),
            pid: item.pid.toFixed(0),
            name,
            formattedName,
            cmd: item.cmd
        });
        // Recurse into children if any
        if (Array.isArray(item.children)) {
            item.children.forEach(child => getProcessItem(processes, child, indent + 1, isLocal));
        }
    }
    function isDebuggable(cmd) {
        const matches = DEBUG_FLAGS_PATTERN.exec(cmd);
        return (matches && matches.length >= 2) || cmd.indexOf('node ') >= 0 || cmd.indexOf('node.exe') >= 0;
    }
    function attachTo(item) {
        const config = {
            type: 'node',
            request: 'attach',
            name: `process ${item.pid}`
        };
        let matches = DEBUG_FLAGS_PATTERN.exec(item.cmd);
        if (matches && matches.length >= 2) {
            // attach via port
            if (matches.length === 4 && matches[3]) {
                config.port = parseInt(matches[3]);
            }
            config.protocol = matches[1] === 'debug' ? 'legacy' : 'inspector';
        }
        else {
            // no port -> try to attach via pid (send SIGUSR1)
            config.processId = String(item.pid);
        }
        // a debug-port=n or inspect-port=n overrides the port
        matches = DEBUG_PORT_PATTERN.exec(item.cmd);
        if (matches && matches.length === 3) {
            // override port
            config.port = parseInt(matches[2]);
        }
        electron_1.ipcRenderer.send('vscode:workbenchCommand', { id: 'debug.startFromConfig', from: 'processExplorer', args: [config] });
    }
    function getProcessIdWithHighestProperty(processList, propertyName) {
        let max = 0;
        let maxProcessId;
        processList.forEach(process => {
            if (process[propertyName] > max) {
                max = process[propertyName];
                maxProcessId = process.pid;
            }
        });
        return maxProcessId;
    }
    function updateSectionCollapsedState(shouldExpand, body, twistie, sectionName) {
        if (shouldExpand) {
            body.classList.remove('hidden');
            collapsedStateCache.set(sectionName, false);
            twistie.src = './media/expanded.svg';
        }
        else {
            body.classList.add('hidden');
            collapsedStateCache.set(sectionName, true);
            twistie.src = './media/collapsed.svg';
        }
    }
    function renderProcessFetchError(sectionName, errorMessage) {
        const container = document.getElementById('process-list');
        if (!container) {
            return;
        }
        const body = document.createElement('tbody');
        renderProcessGroupHeader(sectionName, body, container);
        const errorRow = document.createElement('tr');
        const data = document.createElement('td');
        data.textContent = errorMessage;
        data.className = 'error';
        data.colSpan = 4;
        errorRow.appendChild(data);
        body.appendChild(errorRow);
        container.appendChild(body);
    }
    function renderProcessGroupHeader(sectionName, body, container) {
        const headerRow = document.createElement('tr');
        const data = document.createElement('td');
        data.textContent = sectionName;
        data.colSpan = 4;
        headerRow.appendChild(data);
        const twistie = document.createElement('img');
        updateSectionCollapsedState(!collapsedStateCache.get(sectionName), body, twistie, sectionName);
        data.prepend(twistie);
        listeners.add(dom_1.addDisposableListener(data, 'click', (e) => {
            const isHidden = body.classList.contains('hidden');
            updateSectionCollapsedState(isHidden, body, twistie, sectionName);
        }));
        container.appendChild(headerRow);
    }
    function renderTableSection(sectionName, processList, renderManySections, sectionIsLocal) {
        const container = document.getElementById('process-list');
        if (!container) {
            return;
        }
        const highestCPUProcess = getProcessIdWithHighestProperty(processList, 'cpu');
        const highestMemoryProcess = getProcessIdWithHighestProperty(processList, 'memory');
        const body = document.createElement('tbody');
        if (renderManySections) {
            renderProcessGroupHeader(sectionName, body, container);
        }
        processList.forEach(p => {
            const row = document.createElement('tr');
            row.id = p.pid.toString();
            const cpu = document.createElement('td');
            p.pid === highestCPUProcess
                ? cpu.classList.add('centered', 'highest')
                : cpu.classList.add('centered');
            cpu.textContent = p.cpu.toFixed(0);
            const memory = document.createElement('td');
            p.pid === highestMemoryProcess
                ? memory.classList.add('centered', 'highest')
                : memory.classList.add('centered');
            memory.textContent = p.memory.toFixed(0);
            const pid = document.createElement('td');
            pid.classList.add('centered');
            pid.textContent = p.pid;
            const name = document.createElement('th');
            name.scope = 'row';
            name.classList.add('data');
            name.title = p.cmd;
            name.textContent = p.formattedName;
            row.append(cpu, memory, pid, name);
            listeners.add(dom_1.addDisposableListener(row, 'contextmenu', (e) => {
                showContextMenu(e, p, sectionIsLocal);
            }));
            body.appendChild(row);
        });
        container.appendChild(body);
    }
    function updateProcessInfo(processLists) {
        const container = document.getElementById('process-list');
        if (!container) {
            return;
        }
        container.innerHTML = '';
        listeners.clear();
        const tableHead = document.createElement('thead');
        tableHead.innerHTML = `<tr>
		<th scope="col" class="cpu">${nls_1.localize('cpu', "CPU %")}</th>
		<th scope="col" class="memory">${nls_1.localize('memory', "Memory (MB)")}</th>
		<th scope="col" class="pid">${nls_1.localize('pid', "pid")}</th>
		<th scope="col" class="nameLabel">${nls_1.localize('name', "Name")}</th>
	</tr>`;
        container.append(tableHead);
        const hasMultipleMachines = Object.keys(processLists).length > 1;
        processLists.forEach((remote, i) => {
            const isLocal = i === 0;
            if (diagnostics_1.isRemoteDiagnosticError(remote.rootProcess)) {
                renderProcessFetchError(remote.name, remote.rootProcess.errorMessage);
            }
            else {
                renderTableSection(remote.name, getProcessList(remote.rootProcess, isLocal), hasMultipleMachines, isLocal);
            }
        });
    }
    function applyStyles(styles) {
        const styleTag = document.createElement('style');
        const content = [];
        if (styles.hoverBackground) {
            content.push(`tbody > tr:hover, table > tr:hover  { background-color: ${styles.hoverBackground}; }`);
        }
        if (styles.hoverForeground) {
            content.push(`tbody > tr:hover, table > tr:hover { color: ${styles.hoverForeground}; }`);
        }
        if (styles.highlightForeground) {
            content.push(`.highest { color: ${styles.highlightForeground}; }`);
        }
        styleTag.innerHTML = content.join('\n');
        if (document.head) {
            document.head.appendChild(styleTag);
        }
        if (styles.color) {
            document.body.style.color = styles.color;
        }
    }
    function applyZoom(zoomLevel) {
        electron_1.webFrame.setZoomLevel(zoomLevel);
        browser.setZoomFactor(electron_1.webFrame.getZoomFactor());
        // See https://github.com/Microsoft/vscode/issues/26151
        // Cannot be trusted because the webFrame might take some time
        // until it really applies the new zoom level
        browser.setZoomLevel(electron_1.webFrame.getZoomLevel(), /*isTrusted*/ false);
    }
    function showContextMenu(e, item, isLocal) {
        e.preventDefault();
        const items = [];
        const pid = Number(item.pid);
        if (isLocal) {
            items.push({
                label: nls_1.localize('killProcess', "Kill Process"),
                click() {
                    process.kill(pid, 'SIGTERM');
                }
            });
            items.push({
                label: nls_1.localize('forceKillProcess', "Force Kill Process"),
                click() {
                    process.kill(pid, 'SIGKILL');
                }
            });
            items.push({
                type: 'separator'
            });
        }
        items.push({
            label: nls_1.localize('copy', "Copy"),
            click() {
                const row = document.getElementById(pid.toString());
                if (row) {
                    electron_1.clipboard.writeText(row.innerText);
                }
            }
        });
        items.push({
            label: nls_1.localize('copyAll', "Copy All"),
            click() {
                const processList = document.getElementById('process-list');
                if (processList) {
                    electron_1.clipboard.writeText(processList.innerText);
                }
            }
        });
        if (item && isLocal && isDebuggable(item.cmd)) {
            items.push({
                type: 'separator'
            });
            items.push({
                label: nls_1.localize('debug', "Debug"),
                click() {
                    attachTo(item);
                }
            });
        }
        contextmenu_1.popup(items);
    }
    function requestProcessList(totalWaitTime) {
        setTimeout(() => {
            const nextRequestTime = Date.now();
            const waited = totalWaitTime + nextRequestTime - lastRequestTime;
            lastRequestTime = nextRequestTime;
            // Wait at least a second between requests.
            if (waited > 1000) {
                electron_1.ipcRenderer.send('windowsInfoRequest');
                electron_1.ipcRenderer.send('vscode:listProcesses');
            }
            else {
                requestProcessList(waited);
            }
        }, 200);
    }
    function startup(data) {
        applyStyles(data.styles);
        applyZoom(data.zoomLevel);
        // Map window process pids to titles, annotate process names with this when rendering to distinguish between them
        electron_1.ipcRenderer.on('vscode:windowsInfoResponse', (_event, windows) => {
            mapPidToWindowTitle = new Map();
            windows.forEach(window => mapPidToWindowTitle.set(window.pid, window.title));
        });
        electron_1.ipcRenderer.on('vscode:listProcessesResponse', (_event, processRoots) => {
            updateProcessInfo(processRoots);
            requestProcessList(0);
        });
        lastRequestTime = Date.now();
        electron_1.ipcRenderer.send('windowsInfoRequest');
        electron_1.ipcRenderer.send('vscode:listProcesses');
        document.onkeydown = (e) => {
            const cmdOrCtrlKey = platform.isMacintosh ? e.metaKey : e.ctrlKey;
            // Cmd/Ctrl + zooms in
            if (cmdOrCtrlKey && e.keyCode === 187) {
                applyZoom(electron_1.webFrame.getZoomLevel() + 1);
            }
            // Cmd/Ctrl - zooms out
            if (cmdOrCtrlKey && e.keyCode === 189) {
                applyZoom(electron_1.webFrame.getZoomLevel() - 1);
            }
        };
    }
    exports.startup = startup;
});
//# sourceMappingURL=processExplorerMain.js.map