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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/strings", "vs/editor/browser/services/codeEditorService", "vs/platform/commands/common/commands", "vs/platform/editor/common/editor"], function (require, exports, dom, lifecycle_1, linkedList_1, marshalling_1, network_1, resources, strings_1, codeEditorService_1, commands_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let OpenerService = class OpenerService extends lifecycle_1.Disposable {
        constructor(_editorService, _commandService) {
            super();
            this._editorService = _editorService;
            this._commandService = _commandService;
            this._openers = new linkedList_1.LinkedList();
            this._validators = new linkedList_1.LinkedList();
            this._resolvers = new linkedList_1.LinkedList();
        }
        registerOpener(opener) {
            const remove = this._openers.push(opener);
            return { dispose: remove };
        }
        registerValidator(validator) {
            const remove = this._validators.push(validator);
            return { dispose: remove };
        }
        registerExternalUriResolver(resolver) {
            const remove = this._resolvers.push(resolver);
            return { dispose: remove };
        }
        async open(resource, options) {
            // no scheme ?!?
            if (!resource.scheme) {
                return Promise.resolve(false);
            }
            // check with contributed validators
            for (const validator of this._validators.toArray()) {
                if (!(await validator.shouldOpen(resource))) {
                    return false;
                }
            }
            // check with contributed openers
            for (const opener of this._openers.toArray()) {
                const handled = await opener.open(resource, options);
                if (handled) {
                    return true;
                }
            }
            // use default openers
            return this._doOpen(resource, options);
        }
        async resolveExternalUri(resource, options) {
            for (const resolver of this._resolvers.toArray()) {
                const result = await resolver.resolveExternalUri(resource, options);
                if (result) {
                    return result;
                }
            }
            return { resolved: resource, dispose: () => { } };
        }
        async _doOpen(resource, options) {
            var _a, _b, _c;
            const { scheme, path, query, fragment } = resource;
            if (strings_1.equalsIgnoreCase(scheme, network_1.Schemas.mailto) || ((_a = options) === null || _a === void 0 ? void 0 : _a.openExternal)) {
                // open default mail application
                return this._doOpenExternal(resource, options);
            }
            if (strings_1.equalsIgnoreCase(scheme, network_1.Schemas.http) || strings_1.equalsIgnoreCase(scheme, network_1.Schemas.https)) {
                // open link in default browser
                return this._doOpenExternal(resource, options);
            }
            if (strings_1.equalsIgnoreCase(scheme, network_1.Schemas.command)) {
                // run command or bail out if command isn't known
                if (!commands_1.CommandsRegistry.getCommand(path)) {
                    throw new Error(`command '${path}' NOT known`);
                }
                // execute as command
                let args = [];
                try {
                    args = marshalling_1.parse(query);
                    if (!Array.isArray(args)) {
                        args = [args];
                    }
                }
                catch (e) {
                    // ignore error
                }
                await this._commandService.executeCommand(path, ...args);
                return true;
            }
            // finally open in editor
            let selection = undefined;
            const match = /^L?(\d+)(?:,(\d+))?/.exec(fragment);
            if (match) {
                // support file:///some/file.js#73,84
                // support file:///some/file.js#L73
                selection = {
                    startLineNumber: parseInt(match[1]),
                    startColumn: match[2] ? parseInt(match[2]) : 1
                };
                // remove fragment
                resource = resource.with({ fragment: '' });
            }
            if (resource.scheme === network_1.Schemas.file) {
                resource = resources.normalizePath(resource); // workaround for non-normalized paths (https://github.com/Microsoft/vscode/issues/12954)
            }
            await this._editorService.openCodeEditor({ resource, options: { selection, context: ((_b = options) === null || _b === void 0 ? void 0 : _b.fromUserGesture) ? editor_1.EditorOpenContext.USER : editor_1.EditorOpenContext.API } }, this._editorService.getFocusedCodeEditor(), (_c = options) === null || _c === void 0 ? void 0 : _c.openToSide);
            return true;
        }
        async _doOpenExternal(resource, options) {
            const { resolved } = await this.resolveExternalUri(resource, options);
            dom.windowOpenNoOpener(encodeURI(resolved.toString(true)));
            return true;
        }
        dispose() {
            this._validators.clear();
        }
    };
    OpenerService = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService),
        __param(1, commands_1.ICommandService)
    ], OpenerService);
    exports.OpenerService = OpenerService;
});
//# sourceMappingURL=openerService.js.map