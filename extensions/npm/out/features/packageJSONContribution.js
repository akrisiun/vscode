"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const markedTextUtil_1 = require("./markedTextUtil");
const cp = require("child_process");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
const LIMIT = 40;
const SCOPED_LIMIT = 250;
const USER_AGENT = 'Visual Studio Code';
class PackageJSONContribution {
    constructor(xhr) {
        this.mostDependedOn = ['lodash', 'async', 'underscore', 'request', 'commander', 'express', 'debug', 'chalk', 'colors', 'q', 'coffee-script',
            'mkdirp', 'optimist', 'through2', 'yeoman-generator', 'moment', 'bluebird', 'glob', 'gulp-util', 'minimist', 'cheerio', 'pug', 'redis', 'node-uuid',
            'socket', 'io', 'uglify-js', 'winston', 'through', 'fs-extra', 'handlebars', 'body-parser', 'rimraf', 'mime', 'semver', 'mongodb', 'jquery',
            'grunt', 'connect', 'yosay', 'underscore', 'string', 'xml2js', 'ejs', 'mongoose', 'marked', 'extend', 'mocha', 'superagent', 'js-yaml', 'xtend',
            'shelljs', 'gulp', 'yargs', 'browserify', 'minimatch', 'react', 'less', 'prompt', 'inquirer', 'ws', 'event-stream', 'inherits', 'mysql', 'esprima',
            'jsdom', 'stylus', 'when', 'readable-stream', 'aws-sdk', 'concat-stream', 'chai', 'Thenable', 'wrench'];
        this.knownScopes = ['@types', '@angular', '@babel', '@nuxtjs', '@vue', '@bazel'];
        this.xhr = xhr;
    }
    getDocumentSelector() {
        return [{ language: 'json', scheme: '*', pattern: '**/package.json' }];
    }
    collectDefaultSuggestions(_fileName, result) {
        const defaultValue = {
            'name': '${1:name}',
            'description': '${2:description}',
            'authors': '${3:author}',
            'version': '${4:1.0.0}',
            'main': '${5:pathToMain}',
            'dependencies': {}
        };
        const proposal = new vscode_1.CompletionItem(localize('json.package.default', 'Default package.json'));
        proposal.kind = vscode_1.CompletionItemKind.Module;
        proposal.insertText = new vscode_1.SnippetString(JSON.stringify(defaultValue, null, '\t'));
        result.add(proposal);
        return Promise.resolve(null);
    }
    onlineEnabled() {
        return !!vscode_1.workspace.getConfiguration('npm').get('fetchOnlinePackageInfo');
    }
    collectPropertySuggestions(_resource, location, currentWord, addValue, isLast, collector) {
        if (!this.onlineEnabled()) {
            return null;
        }
        if ((location.matches(['dependencies']) || location.matches(['devDependencies']) || location.matches(['optionalDependencies']) || location.matches(['peerDependencies']))) {
            let queryUrl;
            if (currentWord.length > 0) {
                if (currentWord[0] === '@') {
                    if (currentWord.indexOf('/') !== -1) {
                        return this.collectScopedPackages(currentWord, addValue, isLast, collector);
                    }
                    for (let scope of this.knownScopes) {
                        const proposal = new vscode_1.CompletionItem(scope);
                        proposal.kind = vscode_1.CompletionItemKind.Property;
                        proposal.insertText = new vscode_1.SnippetString().appendText(`"${scope}/`).appendTabstop().appendText('"');
                        proposal.filterText = JSON.stringify(scope);
                        proposal.documentation = '';
                        proposal.command = {
                            title: '',
                            command: 'editor.action.triggerSuggest'
                        };
                        collector.add(proposal);
                    }
                    collector.setAsIncomplete();
                }
                queryUrl = `https://api.npms.io/v2/search/suggestions?size=${LIMIT}&q=${encodeURIComponent(currentWord)}`;
                return this.xhr({
                    url: queryUrl,
                    agent: USER_AGENT
                }).then((success) => {
                    if (success.status === 200) {
                        try {
                            const obj = JSON.parse(success.responseText);
                            if (obj && Array.isArray(obj)) {
                                const results = obj;
                                for (const result of results) {
                                    this.processPackage(result.package, addValue, isLast, collector);
                                }
                                if (results.length === LIMIT) {
                                    collector.setAsIncomplete();
                                }
                            }
                        }
                        catch (e) {
                            // ignore
                        }
                    }
                    else {
                        collector.error(localize('json.npm.error.repoaccess', 'Request to the NPM repository failed: {0}', success.responseText));
                        return 0;
                    }
                    return undefined;
                }, (error) => {
                    collector.error(localize('json.npm.error.repoaccess', 'Request to the NPM repository failed: {0}', error.responseText));
                    return 0;
                });
            }
            else {
                this.mostDependedOn.forEach((name) => {
                    const insertText = new vscode_1.SnippetString().appendText(JSON.stringify(name));
                    if (addValue) {
                        insertText.appendText(': "').appendTabstop().appendText('"');
                        if (!isLast) {
                            insertText.appendText(',');
                        }
                    }
                    const proposal = new vscode_1.CompletionItem(name);
                    proposal.kind = vscode_1.CompletionItemKind.Property;
                    proposal.insertText = insertText;
                    proposal.filterText = JSON.stringify(name);
                    proposal.documentation = '';
                    collector.add(proposal);
                });
                this.collectScopedPackages(currentWord, addValue, isLast, collector);
                collector.setAsIncomplete();
                return Promise.resolve(null);
            }
        }
        return null;
    }
    collectScopedPackages(currentWord, addValue, isLast, collector) {
        let segments = currentWord.split('/');
        if (segments.length === 2 && segments[0].length > 1) {
            let scope = segments[0].substr(1);
            let name = segments[1];
            if (name.length < 4) {
                name = '';
            }
            let queryUrl = `https://api.npms.io/v2/search?q=scope:${scope}%20${name}&size=250`;
            return this.xhr({
                url: queryUrl,
                agent: USER_AGENT
            }).then((success) => {
                if (success.status === 200) {
                    try {
                        const obj = JSON.parse(success.responseText);
                        if (obj && Array.isArray(obj.results)) {
                            const objects = obj.results;
                            for (let object of objects) {
                                this.processPackage(object.package, addValue, isLast, collector);
                            }
                            if (objects.length === SCOPED_LIMIT) {
                                collector.setAsIncomplete();
                            }
                        }
                    }
                    catch (e) {
                        // ignore
                    }
                }
                else {
                    collector.error(localize('json.npm.error.repoaccess', 'Request to the NPM repository failed: {0}', success.responseText));
                }
                return null;
            });
        }
        return Promise.resolve(null);
    }
    async collectValueSuggestions(_fileName, location, result) {
        if (!this.onlineEnabled()) {
            return null;
        }
        if ((location.matches(['dependencies', '*']) || location.matches(['devDependencies', '*']) || location.matches(['optionalDependencies', '*']) || location.matches(['peerDependencies', '*']))) {
            const currentKey = location.path[location.path.length - 1];
            if (typeof currentKey === 'string') {
                const info = await this.fetchPackageInfo(currentKey);
                if (info && info.distTagsLatest) {
                    let name = JSON.stringify(info.distTagsLatest);
                    let proposal = new vscode_1.CompletionItem(name);
                    proposal.kind = vscode_1.CompletionItemKind.Property;
                    proposal.insertText = name;
                    proposal.documentation = localize('json.npm.latestversion', 'The currently latest version of the package');
                    result.add(proposal);
                    name = JSON.stringify('^' + info.distTagsLatest);
                    proposal = new vscode_1.CompletionItem(name);
                    proposal.kind = vscode_1.CompletionItemKind.Property;
                    proposal.insertText = name;
                    proposal.documentation = localize('json.npm.majorversion', 'Matches the most recent major version (1.x.x)');
                    result.add(proposal);
                    name = JSON.stringify('~' + info.distTagsLatest);
                    proposal = new vscode_1.CompletionItem(name);
                    proposal.kind = vscode_1.CompletionItemKind.Property;
                    proposal.insertText = name;
                    proposal.documentation = localize('json.npm.minorversion', 'Matches the most recent minor version (1.2.x)');
                    result.add(proposal);
                }
            }
        }
        return null;
    }
    resolveSuggestion(item) {
        if (item.kind === vscode_1.CompletionItemKind.Property && item.documentation === '') {
            return this.getInfo(item.label).then(infos => {
                if (infos.length > 0) {
                    item.documentation = infos[0];
                    if (infos.length > 1) {
                        item.detail = infos[1];
                    }
                    return item;
                }
                return null;
            });
        }
        return null;
    }
    async getInfo(pack) {
        let info = await this.fetchPackageInfo(pack);
        if (info) {
            const result = [];
            result.push(info.description || '');
            result.push(info.distTagsLatest ? localize('json.npm.version.hover', 'Latest version: {0}', info.distTagsLatest) : '');
            result.push(info.homepage || '');
            return result;
        }
        return [];
    }
    async fetchPackageInfo(pack) {
        let info = await this.npmView(pack);
        if (!info) {
            info = await this.npmjsView(pack);
        }
        return info;
    }
    npmView(pack) {
        return new Promise((resolve, _reject) => {
            const command = 'npm view --json ' + pack + ' description dist-tags.latest homepage';
            cp.exec(command, (error, stdout) => {
                if (!error) {
                    try {
                        const content = JSON.parse(stdout);
                        resolve({
                            description: content['description'],
                            distTagsLatest: content['dist-tags.latest'],
                            homepage: content['homepage']
                        });
                        return;
                    }
                    catch (e) {
                        // ignore
                    }
                }
                resolve(undefined);
            });
        });
    }
    async npmjsView(pack) {
        const queryUrl = 'https://registry.npmjs.org/' + encodeURIComponent(pack).replace(/%40/g, '@');
        try {
            const success = await this.xhr({
                url: queryUrl,
                agent: USER_AGENT
            });
            const obj = JSON.parse(success.responseText);
            if (obj) {
                const latest = obj && obj['dist-tags'] && obj['dist-tags']['latest'];
                if (latest) {
                    return {
                        description: obj.description || '',
                        distTagsLatest: latest,
                        homepage: obj.homepage || ''
                    };
                }
            }
        }
        catch (e) {
            //ignore
        }
        return undefined;
    }
    getInfoContribution(_fileName, location) {
        if ((location.matches(['dependencies', '*']) || location.matches(['devDependencies', '*']) || location.matches(['optionalDependencies', '*']) || location.matches(['peerDependencies', '*']))) {
            const pack = location.path[location.path.length - 1];
            if (typeof pack === 'string') {
                return this.getInfo(pack).then(infos => {
                    if (infos.length) {
                        return [infos.map(markedTextUtil_1.textToMarkedString).join('\n\n')];
                    }
                    return null;
                });
            }
        }
        return null;
    }
    processPackage(pack, addValue, isLast, collector) {
        if (pack && pack.name) {
            const name = pack.name;
            const insertText = new vscode_1.SnippetString().appendText(JSON.stringify(name));
            if (addValue) {
                insertText.appendText(': "');
                if (pack.version) {
                    insertText.appendVariable('version', pack.version);
                }
                else {
                    insertText.appendTabstop();
                }
                insertText.appendText('"');
                if (!isLast) {
                    insertText.appendText(',');
                }
            }
            const proposal = new vscode_1.CompletionItem(name);
            proposal.kind = vscode_1.CompletionItemKind.Property;
            proposal.insertText = insertText;
            proposal.filterText = JSON.stringify(name);
            proposal.documentation = pack.description || '';
            collector.add(proposal);
        }
    }
}
exports.PackageJSONContribution = PackageJSONContribution;
//# sourceMappingURL=packageJSONContribution.js.map