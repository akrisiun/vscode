/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/platform/diagnostics/common/diagnostics"], function (require, exports, objects_1, diagnostics_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class IssueReporterModel {
        constructor(initialData) {
            const defaultData = {
                issueType: 0 /* Bug */,
                includeSystemInfo: true,
                includeWorkspaceInfo: true,
                includeProcessInfo: true,
                includeExtensions: true,
                includeSearchedExtensions: true,
                includeSettingsSearchDetails: true,
                allExtensions: []
            };
            this._data = initialData ? objects_1.assign(defaultData, initialData) : defaultData;
        }
        getData() {
            return this._data;
        }
        update(newData) {
            objects_1.assign(this._data, newData);
        }
        serialize() {
            return `
Issue Type: <b>${this.getIssueTypeTitle()}</b>

${this._data.issueDescription}
${this.getExtensionVersion()}
VS Code version: ${this._data.versionInfo && this._data.versionInfo.vscodeVersion}
OS version: ${this._data.versionInfo && this._data.versionInfo.os}
${this.getRemoteOSes()}
${this.getInfos()}
<!-- generated by issue reporter -->`;
        }
        getRemoteOSes() {
            if (this._data.systemInfo && this._data.systemInfo.remoteData.length) {
                return this._data.systemInfo.remoteData
                    .map(remote => diagnostics_1.isRemoteDiagnosticError(remote) ? remote.errorMessage : `Remote OS version: ${remote.machineInfo.os}`).join('\n') + '\n';
            }
            return '';
        }
        fileOnExtension() {
            const fileOnExtensionSupported = this._data.issueType === 0 /* Bug */
                || this._data.issueType === 1 /* PerformanceIssue */
                || this._data.issueType === 2 /* FeatureRequest */;
            return fileOnExtensionSupported && this._data.fileOnExtension;
        }
        getExtensionVersion() {
            if (this.fileOnExtension() && this._data.selectedExtension) {
                return `\nExtension version: ${this._data.selectedExtension.version}`;
            }
            else {
                return '';
            }
        }
        getIssueTypeTitle() {
            if (this._data.issueType === 0 /* Bug */) {
                return 'Bug';
            }
            else if (this._data.issueType === 1 /* PerformanceIssue */) {
                return 'Performance Issue';
            }
            else if (this._data.issueType === 3 /* SettingsSearchIssue */) {
                return 'Settings Search Issue';
            }
            else {
                return 'Feature Request';
            }
        }
        getInfos() {
            let info = '';
            if (this._data.issueType === 0 /* Bug */ || this._data.issueType === 1 /* PerformanceIssue */) {
                if (this._data.includeSystemInfo && this._data.systemInfo) {
                    info += this.generateSystemInfoMd();
                }
            }
            if (this._data.issueType === 1 /* PerformanceIssue */) {
                if (this._data.includeProcessInfo) {
                    info += this.generateProcessInfoMd();
                }
                if (this._data.includeWorkspaceInfo) {
                    info += this.generateWorkspaceInfoMd();
                }
            }
            if (this._data.issueType === 0 /* Bug */ || this._data.issueType === 1 /* PerformanceIssue */) {
                if (!this._data.fileOnExtension && this._data.includeExtensions) {
                    info += this.generateExtensionsMd();
                }
            }
            if (this._data.issueType === 3 /* SettingsSearchIssue */) {
                if (this._data.includeSearchedExtensions) {
                    info += this.generateExtensionsMd();
                }
                if (this._data.includeSettingsSearchDetails) {
                    info += this.generateSettingSearchResultsMd();
                    info += '\n' + this.generateSettingsSearchResultDetailsMd();
                }
            }
            return info;
        }
        generateSystemInfoMd() {
            let md = `<details>
<summary>System Info</summary>

|Item|Value|
|---|---|
`;
            if (this._data.systemInfo) {
                md += `|CPUs|${this._data.systemInfo.cpus}|
|GPU Status|${Object.keys(this._data.systemInfo.gpuStatus).map(key => `${key}: ${this._data.systemInfo.gpuStatus[key]}`).join('<br>')}|
|Load (avg)|${this._data.systemInfo.load}|
|Memory (System)|${this._data.systemInfo.memory}|
|Process Argv|${this._data.systemInfo.processArgs}|
|Screen Reader|${this._data.systemInfo.screenReader}|
|VM|${this._data.systemInfo.vmHint}|`;
                this._data.systemInfo.remoteData.forEach(remote => {
                    if (diagnostics_1.isRemoteDiagnosticError(remote)) {
                        md += `\n\n${remote.errorMessage}`;
                    }
                    else {
                        md += `

|Item|Value|
|---|---|
|Remote|${remote.hostName}|
|OS|${remote.machineInfo.os}|
|CPUs|${remote.machineInfo.cpus}|
|Memory (System)|${remote.machineInfo.memory}|
|VM|${remote.machineInfo.vmHint}|`;
                    }
                });
            }
            md += '\n</details>';
            return md;
        }
        generateProcessInfoMd() {
            return `<details>
<summary>Process Info</summary>

\`\`\`
${this._data.processInfo}
\`\`\`

</details>
`;
        }
        generateWorkspaceInfoMd() {
            return `<details>
<summary>Workspace Info</summary>

\`\`\`
${this._data.workspaceInfo};
\`\`\`

</details>
`;
        }
        generateExtensionsMd() {
            if (this._data.extensionsDisabled) {
                return 'Extensions disabled';
            }
            const themeExclusionStr = this._data.numberOfThemeExtesions ? `\n(${this._data.numberOfThemeExtesions} theme extensions excluded)` : '';
            if (!this._data.enabledNonThemeExtesions) {
                return 'Extensions: none' + themeExclusionStr;
            }
            const tableHeader = `Extension|Author (truncated)|Version
---|---|---`;
            const table = this._data.enabledNonThemeExtesions.map(e => {
                return `${e.name}|${e.publisher.substr(0, 3)}|${e.version}`;
            }).join('\n');
            return `<details><summary>Extensions (${this._data.enabledNonThemeExtesions.length})</summary>

${tableHeader}
${table}
${themeExclusionStr}

</details>`;
        }
        generateSettingsSearchResultDetailsMd() {
            return `
Query: ${this._data.query}
Literal matches: ${this._data.filterResultCount}`;
        }
        generateSettingSearchResultsMd() {
            if (!this._data.actualSearchResults) {
                return '';
            }
            if (!this._data.actualSearchResults.length) {
                return `No fuzzy results`;
            }
            const tableHeader = `Setting|Extension|Score
---|---|---`;
            const table = this._data.actualSearchResults.map(setting => {
                return `${setting.key}|${setting.extensionId}|${String(setting.score).slice(0, 5)}`;
            }).join('\n');
            return `<details><summary>Results</summary>

${tableHeader}
${table}

</details>`;
        }
    }
    exports.IssueReporterModel = IssueReporterModel;
});
//# sourceMappingURL=issueReporterModel.js.map