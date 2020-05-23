/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/position", "vs/editor/common/services/modelService", "vs/editor/common/services/resolverService", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/base/common/types"], function (require, exports, errors_1, uri_1, codeEditorService_1, position_1, modelService_1, resolverService_1, actions_1, commands_1, contextkey_1, keybindingsRegistry_1, platform_1, telemetry_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorExtensionsRegistry = exports.registerDiffEditorContribution = exports.registerEditorContribution = exports.registerInstantiatedEditorAction = exports.registerEditorAction = exports.registerEditorCommand = exports.registerModelCommand = exports.registerModelAndPositionCommand = exports.registerDefaultLanguageCommand = exports.registerLanguageCommand = exports.EditorAction = exports.EditorCommand = exports.Command = void 0;
    class Command {
        constructor(opts) {
            this.id = opts.id;
            this.precondition = opts.precondition;
            this._kbOpts = opts.kbOpts;
            this._menuOpts = opts.menuOpts;
            this._description = opts.description;
        }
        register() {
            if (Array.isArray(this._menuOpts)) {
                this._menuOpts.forEach(this._registerMenuItem, this);
            }
            else if (this._menuOpts) {
                this._registerMenuItem(this._menuOpts);
            }
            if (this._kbOpts) {
                let kbWhen = this._kbOpts.kbExpr;
                if (this.precondition) {
                    if (kbWhen) {
                        kbWhen = contextkey_1.ContextKeyExpr.and(kbWhen, this.precondition);
                    }
                    else {
                        kbWhen = this.precondition;
                    }
                }
                keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                    id: this.id,
                    handler: (accessor, args) => this.runCommand(accessor, args),
                    weight: this._kbOpts.weight,
                    when: kbWhen,
                    primary: this._kbOpts.primary,
                    secondary: this._kbOpts.secondary,
                    win: this._kbOpts.win,
                    linux: this._kbOpts.linux,
                    mac: this._kbOpts.mac,
                    description: this._description
                });
            }
            else {
                commands_1.CommandsRegistry.registerCommand({
                    id: this.id,
                    handler: (accessor, args) => this.runCommand(accessor, args),
                    description: this._description
                });
            }
        }
        _registerMenuItem(item) {
            actions_1.MenuRegistry.appendMenuItem(item.menuId, {
                group: item.group,
                command: {
                    id: this.id,
                    title: item.title,
                },
                when: item.when,
                order: item.order
            });
        }
    }
    exports.Command = Command;
    class EditorCommand extends Command {
        /**
         * Create a command class that is bound to a certain editor contribution.
         */
        static bindToContribution(controllerGetter) {
            return class EditorControllerCommandImpl extends EditorCommand {
                constructor(opts) {
                    super(opts);
                    this._callback = opts.handler;
                }
                runEditorCommand(accessor, editor, args) {
                    const controller = controllerGetter(editor);
                    if (controller) {
                        this._callback(controllerGetter(editor), args);
                    }
                }
            };
        }
        runCommand(accessor, args) {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            // Find the editor with text focus or active
            const editor = codeEditorService.getFocusedCodeEditor() || codeEditorService.getActiveCodeEditor();
            if (!editor) {
                // well, at least we tried...
                return;
            }
            return editor.invokeWithinContext((editorAccessor) => {
                const kbService = editorAccessor.get(contextkey_1.IContextKeyService);
                if (!kbService.contextMatchesRules(types_1.withNullAsUndefined(this.precondition))) {
                    // precondition does not hold
                    return;
                }
                return this.runEditorCommand(editorAccessor, editor, args);
            });
        }
    }
    exports.EditorCommand = EditorCommand;
    class EditorAction extends EditorCommand {
        constructor(opts) {
            super(EditorAction.convertOptions(opts));
            this.label = opts.label;
            this.alias = opts.alias;
        }
        static convertOptions(opts) {
            let menuOpts;
            if (Array.isArray(opts.menuOpts)) {
                menuOpts = opts.menuOpts;
            }
            else if (opts.menuOpts) {
                menuOpts = [opts.menuOpts];
            }
            else {
                menuOpts = [];
            }
            function withDefaults(item) {
                if (!item.menuId) {
                    item.menuId = actions_1.MenuId.EditorContext;
                }
                if (!item.title) {
                    item.title = opts.label;
                }
                item.when = contextkey_1.ContextKeyExpr.and(opts.precondition, item.when);
                return item;
            }
            if (Array.isArray(opts.contextMenuOpts)) {
                menuOpts.push(...opts.contextMenuOpts.map(withDefaults));
            }
            else if (opts.contextMenuOpts) {
                menuOpts.push(withDefaults(opts.contextMenuOpts));
            }
            opts.menuOpts = menuOpts;
            return opts;
        }
        runEditorCommand(accessor, editor, args) {
            this.reportTelemetry(accessor, editor);
            return this.run(accessor, editor, args || {});
        }
        reportTelemetry(accessor, editor) {
            accessor.get(telemetry_1.ITelemetryService).publicLog2('editorActionInvoked', { name: this.label, id: this.id });
        }
    }
    exports.EditorAction = EditorAction;
    //#endregion EditorAction
    // --- Registration of commands and actions
    function registerLanguageCommand(id, handler) {
        commands_1.CommandsRegistry.registerCommand(id, (accessor, args) => handler(accessor, args || {}));
    }
    exports.registerLanguageCommand = registerLanguageCommand;
    function registerDefaultLanguageCommand(id, handler) {
        registerLanguageCommand(id, function (accessor, args) {
            const { resource, position } = args;
            if (!(resource instanceof uri_1.URI)) {
                throw errors_1.illegalArgument('resource');
            }
            if (!position_1.Position.isIPosition(position)) {
                throw errors_1.illegalArgument('position');
            }
            const model = accessor.get(modelService_1.IModelService).getModel(resource);
            if (model) {
                const editorPosition = position_1.Position.lift(position);
                return handler(model, editorPosition, args);
            }
            return accessor.get(resolverService_1.ITextModelService).createModelReference(resource).then(reference => {
                return new Promise((resolve, reject) => {
                    try {
                        const result = handler(reference.object.textEditorModel, position_1.Position.lift(position), args);
                        resolve(result);
                    }
                    catch (err) {
                        reject(err);
                    }
                }).finally(() => {
                    reference.dispose();
                });
            });
        });
    }
    exports.registerDefaultLanguageCommand = registerDefaultLanguageCommand;
    function registerModelAndPositionCommand(id, handler) {
        commands_1.CommandsRegistry.registerCommand(id, function (accessor, ...args) {
            const [resource, position] = args;
            types_1.assertType(uri_1.URI.isUri(resource));
            types_1.assertType(position_1.Position.isIPosition(position));
            const model = accessor.get(modelService_1.IModelService).getModel(resource);
            if (model) {
                const editorPosition = position_1.Position.lift(position);
                return handler(model, editorPosition, args.slice(2));
            }
            return accessor.get(resolverService_1.ITextModelService).createModelReference(resource).then(reference => {
                return new Promise((resolve, reject) => {
                    try {
                        const result = handler(reference.object.textEditorModel, position_1.Position.lift(position), args.slice(2));
                        resolve(result);
                    }
                    catch (err) {
                        reject(err);
                    }
                }).finally(() => {
                    reference.dispose();
                });
            });
        });
    }
    exports.registerModelAndPositionCommand = registerModelAndPositionCommand;
    function registerModelCommand(id, handler) {
        commands_1.CommandsRegistry.registerCommand(id, function (accessor, ...args) {
            const [resource] = args;
            types_1.assertType(uri_1.URI.isUri(resource));
            const model = accessor.get(modelService_1.IModelService).getModel(resource);
            if (model) {
                return handler(model, ...args.slice(1));
            }
            return accessor.get(resolverService_1.ITextModelService).createModelReference(resource).then(reference => {
                return new Promise((resolve, reject) => {
                    try {
                        const result = handler(reference.object.textEditorModel, args.slice(1));
                        resolve(result);
                    }
                    catch (err) {
                        reject(err);
                    }
                }).finally(() => {
                    reference.dispose();
                });
            });
        });
    }
    exports.registerModelCommand = registerModelCommand;
    function registerEditorCommand(editorCommand) {
        EditorContributionRegistry.INSTANCE.registerEditorCommand(editorCommand);
        return editorCommand;
    }
    exports.registerEditorCommand = registerEditorCommand;
    function registerEditorAction(ctor) {
        EditorContributionRegistry.INSTANCE.registerEditorAction(new ctor());
    }
    exports.registerEditorAction = registerEditorAction;
    function registerInstantiatedEditorAction(editorAction) {
        EditorContributionRegistry.INSTANCE.registerEditorAction(editorAction);
    }
    exports.registerInstantiatedEditorAction = registerInstantiatedEditorAction;
    function registerEditorContribution(id, ctor) {
        EditorContributionRegistry.INSTANCE.registerEditorContribution(id, ctor);
    }
    exports.registerEditorContribution = registerEditorContribution;
    function registerDiffEditorContribution(id, ctor) {
        EditorContributionRegistry.INSTANCE.registerDiffEditorContribution(id, ctor);
    }
    exports.registerDiffEditorContribution = registerDiffEditorContribution;
    var EditorExtensionsRegistry;
    (function (EditorExtensionsRegistry) {
        function getEditorCommand(commandId) {
            return EditorContributionRegistry.INSTANCE.getEditorCommand(commandId);
        }
        EditorExtensionsRegistry.getEditorCommand = getEditorCommand;
        function getEditorActions() {
            return EditorContributionRegistry.INSTANCE.getEditorActions();
        }
        EditorExtensionsRegistry.getEditorActions = getEditorActions;
        function getEditorContributions() {
            return EditorContributionRegistry.INSTANCE.getEditorContributions();
        }
        EditorExtensionsRegistry.getEditorContributions = getEditorContributions;
        function getSomeEditorContributions(ids) {
            return EditorContributionRegistry.INSTANCE.getEditorContributions().filter(c => ids.indexOf(c.id) >= 0);
        }
        EditorExtensionsRegistry.getSomeEditorContributions = getSomeEditorContributions;
        function getDiffEditorContributions() {
            return EditorContributionRegistry.INSTANCE.getDiffEditorContributions();
        }
        EditorExtensionsRegistry.getDiffEditorContributions = getDiffEditorContributions;
    })(EditorExtensionsRegistry = exports.EditorExtensionsRegistry || (exports.EditorExtensionsRegistry = {}));
    // Editor extension points
    const Extensions = {
        EditorCommonContributions: 'editor.contributions'
    };
    let EditorContributionRegistry = /** @class */ (() => {
        class EditorContributionRegistry {
            constructor() {
                this.editorContributions = [];
                this.diffEditorContributions = [];
                this.editorActions = [];
                this.editorCommands = Object.create(null);
            }
            registerEditorContribution(id, ctor) {
                this.editorContributions.push({ id, ctor: ctor });
            }
            getEditorContributions() {
                return this.editorContributions.slice(0);
            }
            registerDiffEditorContribution(id, ctor) {
                this.diffEditorContributions.push({ id, ctor: ctor });
            }
            getDiffEditorContributions() {
                return this.diffEditorContributions.slice(0);
            }
            registerEditorAction(action) {
                action.register();
                this.editorActions.push(action);
            }
            getEditorActions() {
                return this.editorActions.slice(0);
            }
            registerEditorCommand(editorCommand) {
                editorCommand.register();
                this.editorCommands[editorCommand.id] = editorCommand;
            }
            getEditorCommand(commandId) {
                return (this.editorCommands[commandId] || null);
            }
        }
        EditorContributionRegistry.INSTANCE = new EditorContributionRegistry();
        return EditorContributionRegistry;
    })();
    platform_1.Registry.add(Extensions.EditorCommonContributions, EditorContributionRegistry.INSTANCE);
});
//# sourceMappingURL=editorExtensions.js.map