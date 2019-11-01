/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/position", "vs/editor/common/services/modelService", "vs/editor/common/services/resolverService", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/base/common/types"], function (require, exports, errors_1, uri_1, codeEditorService_1, position_1, modelService_1, resolverService_1, actions_1, commands_1, contextkey_1, keybindingsRegistry_1, platform_1, telemetry_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Command {
        constructor(opts) {
            this.id = opts.id;
            this.precondition = opts.precondition;
            this._kbOpts = opts.kbOpts;
            this._menubarOpts = opts.menubarOpts;
            this._description = opts.description;
        }
        register() {
            if (this._menubarOpts) {
                actions_1.MenuRegistry.appendMenuItem(this._menubarOpts.menuId, {
                    group: this._menubarOpts.group,
                    command: {
                        id: this.id,
                        title: this._menubarOpts.title,
                    },
                    when: this._menubarOpts.when,
                    order: this._menubarOpts.order
                });
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
            super(opts);
            this.label = opts.label;
            this.alias = opts.alias;
            this.menuOpts = opts.menuOpts;
        }
        register() {
            if (this.menuOpts) {
                actions_1.MenuRegistry.appendMenuItem(7 /* EditorContext */, {
                    command: {
                        id: this.id,
                        title: this.label
                    },
                    when: contextkey_1.ContextKeyExpr.and(this.precondition, this.menuOpts.when),
                    group: this.menuOpts.group,
                    order: this.menuOpts.order
                });
            }
            super.register();
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
    function registerEditorContribution(ctor) {
        EditorContributionRegistry.INSTANCE.registerEditorContribution(ctor);
    }
    exports.registerEditorContribution = registerEditorContribution;
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
    })(EditorExtensionsRegistry = exports.EditorExtensionsRegistry || (exports.EditorExtensionsRegistry = {}));
    // Editor extension points
    const Extensions = {
        EditorCommonContributions: 'editor.contributions'
    };
    class EditorContributionRegistry {
        constructor() {
            this.editorContributions = [];
            this.editorActions = [];
            this.editorCommands = Object.create(null);
        }
        registerEditorContribution(ctor) {
            this.editorContributions.push(ctor);
        }
        registerEditorAction(action) {
            action.register();
            this.editorActions.push(action);
        }
        getEditorContributions() {
            return this.editorContributions.slice(0);
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
    platform_1.Registry.add(Extensions.EditorCommonContributions, EditorContributionRegistry.INSTANCE);
});
//# sourceMappingURL=editorExtensions.js.map