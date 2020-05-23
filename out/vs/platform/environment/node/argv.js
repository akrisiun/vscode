/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "minimist", "os", "vs/nls"], function (require, exports, minimist, os, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildVersionMessage = exports.buildHelpMessage = exports.formatOptions = exports.parseArgs = exports.OPTIONS = void 0;
    /**
     * This code is also used by standalone cli's. Avoid adding any other dependencies.
     */
    const helpCategories = {
        o: nls_1.localize('optionsUpperCase', "Options"),
        e: nls_1.localize('extensionsManagement', "Extensions Management"),
        t: nls_1.localize('troubleshooting', "Troubleshooting")
    };
    exports.OPTIONS = {
        'diff': { type: 'boolean', cat: 'o', alias: 'd', args: ['file', 'file'], description: nls_1.localize('diff', "Compare two files with each other.") },
        'add': { type: 'boolean', cat: 'o', alias: 'a', args: 'folder', description: nls_1.localize('add', "Add folder(s) to the last active window.") },
        'goto': { type: 'boolean', cat: 'o', alias: 'g', args: 'file:line[:character]', description: nls_1.localize('goto', "Open a file at the path on the specified line and character position.") },
        'new-window': { type: 'boolean', cat: 'o', alias: 'n', description: nls_1.localize('newWindow', "Force to open a new window.") },
        'reuse-window': { type: 'boolean', cat: 'o', alias: 'r', description: nls_1.localize('reuseWindow', "Force to open a file or folder in an already opened window.") },
        'folder-uri': { type: 'string[]', cat: 'o', args: 'uri', description: nls_1.localize('folderUri', "Opens a window with given folder uri(s)") },
        'file-uri': { type: 'string[]', cat: 'o', args: 'uri', description: nls_1.localize('fileUri', "Opens a window with given file uri(s)") },
        'wait': { type: 'boolean', cat: 'o', alias: 'w', description: nls_1.localize('wait', "Wait for the files to be closed before returning.") },
        'waitMarkerFilePath': { type: 'string' },
        'locale': { type: 'string', cat: 'o', args: 'locale', description: nls_1.localize('locale', "The locale to use (e.g. en-US or zh-TW).") },
        'user-data-dir': { type: 'string', cat: 'o', args: 'dir', description: nls_1.localize('userDataDir', "Specifies the directory that user data is kept in. Can be used to open multiple distinct instances of Code.") },
        'help': { type: 'boolean', cat: 'o', alias: 'h', description: nls_1.localize('help', "Print usage.") },
        'extensions-dir': { type: 'string', deprecates: 'extensionHomePath', cat: 'e', args: 'dir', description: nls_1.localize('extensionHomePath', "Set the root path for extensions.") },
        'extensions-download-dir': { type: 'string' },
        'builtin-extensions-dir': { type: 'string' },
        'list-extensions': { type: 'boolean', cat: 'e', description: nls_1.localize('listExtensions', "List the installed extensions.") },
        'show-versions': { type: 'boolean', cat: 'e', description: nls_1.localize('showVersions', "Show versions of installed extensions, when using --list-extension.") },
        'category': { type: 'string', cat: 'e', description: nls_1.localize('category', "Filters installed extensions by provided category, when using --list-extension.") },
        'install-extension': { type: 'string[]', cat: 'e', args: 'extension-id | path-to-vsix', description: nls_1.localize('installExtension', "Installs or updates the extension. Use `--force` argument to avoid prompts.") },
        'uninstall-extension': { type: 'string[]', cat: 'e', args: 'extension-id', description: nls_1.localize('uninstallExtension', "Uninstalls an extension.") },
        'enable-proposed-api': { type: 'string[]', cat: 'e', args: 'extension-id', description: nls_1.localize('experimentalApis', "Enables proposed API features for extensions. Can receive one or more extension IDs to enable individually.") },
        'version': { type: 'boolean', cat: 't', alias: 'v', description: nls_1.localize('version', "Print version.") },
        'verbose': { type: 'boolean', cat: 't', description: nls_1.localize('verbose', "Print verbose output (implies --wait).") },
        'log': { type: 'string', cat: 't', args: 'level', description: nls_1.localize('log', "Log level to use. Default is 'info'. Allowed values are 'critical', 'error', 'warn', 'info', 'debug', 'trace', 'off'.") },
        'status': { type: 'boolean', alias: 's', cat: 't', description: nls_1.localize('status', "Print process usage and diagnostics information.") },
        'prof-startup': { type: 'boolean', cat: 't', description: nls_1.localize('prof-startup', "Run CPU profiler during startup") },
        'prof-append-timers': { type: 'string' },
        'prof-startup-prefix': { type: 'string' },
        'disable-extensions': { type: 'boolean', deprecates: 'disableExtensions', cat: 't', description: nls_1.localize('disableExtensions', "Disable all installed extensions.") },
        'disable-extension': { type: 'string[]', cat: 't', args: 'extension-id', description: nls_1.localize('disableExtension', "Disable an extension.") },
        'sync': { type: 'string', cat: 't', description: nls_1.localize('turn sync', "Turn sync on or off"), args: ['on', 'off'] },
        'inspect-extensions': { type: 'string', deprecates: 'debugPluginHost', args: 'port', cat: 't', description: nls_1.localize('inspect-extensions', "Allow debugging and profiling of extensions. Check the developer tools for the connection URI.") },
        'inspect-brk-extensions': { type: 'string', deprecates: 'debugBrkPluginHost', args: 'port', cat: 't', description: nls_1.localize('inspect-brk-extensions', "Allow debugging and profiling of extensions with the extension host being paused after start. Check the developer tools for the connection URI.") },
        'disable-gpu': { type: 'boolean', cat: 't', description: nls_1.localize('disableGPU', "Disable GPU hardware acceleration.") },
        'max-memory': { type: 'string', cat: 't', description: nls_1.localize('maxMemory', "Max memory size for a window (in Mbytes).") },
        'telemetry': { type: 'boolean', cat: 't', description: nls_1.localize('telemetry', "Shows all telemetry events which VS code collects.") },
        'remote': { type: 'string' },
        'locate-extension': { type: 'string[]' },
        'extensionDevelopmentPath': { type: 'string[]' },
        'extensionTestsPath': { type: 'string' },
        'debugId': { type: 'string' },
        'inspect-search': { type: 'string', deprecates: 'debugSearch' },
        'inspect-brk-search': { type: 'string', deprecates: 'debugBrkSearch' },
        'export-default-configuration': { type: 'string' },
        'install-source': { type: 'string' },
        'driver': { type: 'string' },
        'logExtensionHostCommunication': { type: 'boolean' },
        'skip-release-notes': { type: 'boolean' },
        'disable-restore-windows': { type: 'boolean' },
        'disable-telemetry': { type: 'boolean' },
        'disable-updates': { type: 'boolean' },
        'disable-crash-reporter': { type: 'boolean' },
        'disable-user-env-probe': { type: 'boolean' },
        'skip-add-to-recently-opened': { type: 'boolean' },
        'unity-launch': { type: 'boolean' },
        'open-url': { type: 'boolean' },
        'file-write': { type: 'boolean' },
        'file-chmod': { type: 'boolean' },
        'driver-verbose': { type: 'boolean' },
        'force': { type: 'boolean' },
        'trace': { type: 'boolean' },
        'trace-category-filter': { type: 'string' },
        'trace-options': { type: 'string' },
        'force-user-env': { type: 'boolean' },
        // chromium flags
        'no-proxy-server': { type: 'boolean' },
        'proxy-server': { type: 'string' },
        'proxy-bypass-list': { type: 'string' },
        'proxy-pac-url': { type: 'string' },
        'js-flags': { type: 'string' },
        'inspect': { type: 'string' },
        'inspect-brk': { type: 'string' },
        'nolazy': { type: 'boolean' },
        'force-device-scale-factor': { type: 'string' },
        'force-renderer-accessibility': { type: 'boolean' },
        'ignore-certificate-errors': { type: 'boolean' },
        'allow-insecure-localhost': { type: 'boolean' },
        'log-net-log': { type: 'string' },
        '_urls': { type: 'string[]' },
        _: { type: 'string[]' } // main arguments
    };
    const ignoringReporter = {
        onUnknownOption: () => { },
        onMultipleValues: () => { }
    };
    function parseArgs(args, options, errorReporter = ignoringReporter) {
        const alias = {};
        const string = [];
        const boolean = [];
        for (let optionId in options) {
            if (optionId[0] === '_') {
                continue;
            }
            const o = options[optionId];
            if (o.alias) {
                alias[optionId] = o.alias;
            }
            if (o.type === 'string' || o.type === 'string[]') {
                string.push(optionId);
                if (o.deprecates) {
                    string.push(o.deprecates);
                }
            }
            else if (o.type === 'boolean') {
                boolean.push(optionId);
                if (o.deprecates) {
                    boolean.push(o.deprecates);
                }
            }
        }
        // remove aliases to avoid confusion
        const parsedArgs = minimist(args, { string, boolean, alias });
        const cleanedArgs = {};
        const remainingArgs = parsedArgs;
        // https://github.com/microsoft/vscode/issues/58177
        cleanedArgs._ = parsedArgs._.filter(arg => arg.length > 0);
        delete remainingArgs._;
        for (let optionId in options) {
            const o = options[optionId];
            if (o.alias) {
                delete remainingArgs[o.alias];
            }
            let val = remainingArgs[optionId];
            if (o.deprecates && remainingArgs.hasOwnProperty(o.deprecates)) {
                if (!val) {
                    val = remainingArgs[o.deprecates];
                }
                delete remainingArgs[o.deprecates];
            }
            if (typeof val !== 'undefined') {
                if (o.type === 'string[]') {
                    if (val && !Array.isArray(val)) {
                        val = [val];
                    }
                }
                else if (o.type === 'string') {
                    if (Array.isArray(val)) {
                        val = val.pop(); // take the last
                        errorReporter.onMultipleValues(optionId, val);
                    }
                }
                cleanedArgs[optionId] = val;
            }
            delete remainingArgs[optionId];
        }
        for (let key in remainingArgs) {
            errorReporter.onUnknownOption(key);
        }
        return cleanedArgs;
    }
    exports.parseArgs = parseArgs;
    function formatUsage(optionId, option) {
        let args = '';
        if (option.args) {
            if (Array.isArray(option.args)) {
                args = ` <${option.args.join('> <')}>`;
            }
            else {
                args = ` <${option.args}>`;
            }
        }
        if (option.alias) {
            return `-${option.alias} --${optionId}${args}`;
        }
        return `--${optionId}${args}`;
    }
    // exported only for testing
    function formatOptions(options, columns) {
        let maxLength = 0;
        let usageTexts = [];
        for (const optionId in options) {
            const o = options[optionId];
            const usageText = formatUsage(optionId, o);
            maxLength = Math.max(maxLength, usageText.length);
            usageTexts.push([usageText, o.description]);
        }
        let argLength = maxLength + 2 /*left padding*/ + 1 /*right padding*/;
        if (columns - argLength < 25) {
            // Use a condensed version on narrow terminals
            return usageTexts.reduce((r, ut) => r.concat([`  ${ut[0]}`, `      ${ut[1]}`]), []);
        }
        let descriptionColumns = columns - argLength - 1;
        let result = [];
        for (const ut of usageTexts) {
            let usage = ut[0];
            let wrappedDescription = wrapText(ut[1], descriptionColumns);
            let keyPadding = indent(argLength - usage.length - 2 /*left padding*/);
            result.push('  ' + usage + keyPadding + wrappedDescription[0]);
            for (let i = 1; i < wrappedDescription.length; i++) {
                result.push(indent(argLength) + wrappedDescription[i]);
            }
        }
        return result;
    }
    exports.formatOptions = formatOptions;
    function indent(count) {
        return ' '.repeat(count);
    }
    function wrapText(text, columns) {
        let lines = [];
        while (text.length) {
            let index = text.length < columns ? text.length : text.lastIndexOf(' ', columns);
            let line = text.slice(0, index).trim();
            text = text.slice(index);
            lines.push(line);
        }
        return lines;
    }
    function buildHelpMessage(productName, executableName, version, options, isPipeSupported = true) {
        const columns = (process.stdout).isTTY && (process.stdout).columns || 80;
        let help = [`${productName} ${version}`];
        help.push('');
        help.push(`${nls_1.localize('usage', "Usage")}: ${executableName} [${nls_1.localize('options', "options")}][${nls_1.localize('paths', 'paths')}...]`);
        help.push('');
        if (isPipeSupported) {
            if (os.platform() === 'win32') {
                help.push(nls_1.localize('stdinWindows', "To read output from another program, append '-' (e.g. 'echo Hello World | {0} -')", executableName));
            }
            else {
                help.push(nls_1.localize('stdinUnix', "To read from stdin, append '-' (e.g. 'ps aux | grep code | {0} -')", executableName));
            }
            help.push('');
        }
        const optionsByCategory = {};
        for (const optionId in options) {
            const o = options[optionId];
            if (o.description && o.cat) {
                let optionsByCat = optionsByCategory[o.cat];
                if (!optionsByCat) {
                    optionsByCategory[o.cat] = optionsByCat = {};
                }
                optionsByCat[optionId] = o;
            }
        }
        for (let helpCategoryKey in optionsByCategory) {
            const key = helpCategoryKey;
            let categoryOptions = optionsByCategory[key];
            if (categoryOptions) {
                help.push(helpCategories[key]);
                help.push(...formatOptions(categoryOptions, columns));
                help.push('');
            }
        }
        return help.join('\n');
    }
    exports.buildHelpMessage = buildHelpMessage;
    function buildVersionMessage(version, commit) {
        return `${version || nls_1.localize('unknownVersion', "Unknown version")}\n${commit || nls_1.localize('unknownCommit', "Unknown commit")}\n${process.arch}`;
    }
    exports.buildVersionMessage = buildVersionMessage;
});
//# sourceMappingURL=argv.js.map