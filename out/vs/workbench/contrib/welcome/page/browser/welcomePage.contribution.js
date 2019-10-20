/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/contrib/welcome/page/browser/welcomePage", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/editor"], function (require, exports, nls_1, contributions_1, platform_1, welcomePage_1, actions_1, actions_2, configurationRegistry_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        'id': 'workbench',
        'order': 7,
        'title': nls_1.localize('workbenchConfigurationTitle', "Workbench"),
        'properties': {
            'workbench.startupEditor': {
                'scope': 1 /* APPLICATION */,
                'type': 'string',
                'enum': ['none', 'welcomePage', 'readme', 'newUntitledFile', 'welcomePageInEmptyWorkbench'],
                'enumDescriptions': [
                    nls_1.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.none' }, "Start without an editor."),
                    nls_1.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.welcomePage' }, "Open the Welcome page (default)."),
                    nls_1.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.readme' }, "Open the README when opening a folder that contains one, fallback to 'welcomePage' otherwise."),
                    nls_1.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.newUntitledFile' }, "Open a new untitled file (only applies when opening an empty workspace)."),
                    nls_1.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.welcomePageInEmptyWorkbench' }, "Open the Welcome page when opening an empty workbench."),
                ],
                'default': 'welcomePage',
                'description': nls_1.localize('workbench.startupEditor', "Controls which editor is shown at startup, if none are restored from the previous session.")
            },
        }
    });
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(welcomePage_1.WelcomePageContribution, 3 /* Restored */);
    platform_1.Registry.as(actions_1.Extensions.WorkbenchActions)
        .registerWorkbenchAction(new actions_2.SyncActionDescriptor(welcomePage_1.WelcomePageAction, welcomePage_1.WelcomePageAction.ID, welcomePage_1.WelcomePageAction.LABEL), 'Help: Welcome', nls_1.localize('help', "Help"));
    platform_1.Registry.as(editor_1.Extensions.EditorInputFactories).registerEditorInputFactory(welcomePage_1.WelcomeInputFactory.ID, welcomePage_1.WelcomeInputFactory);
    actions_2.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
        group: '1_welcome',
        command: {
            id: 'workbench.action.showWelcomePage',
            title: nls_1.localize({ key: 'miWelcome', comment: ['&& denotes a mnemonic'] }, "&&Welcome")
        },
        order: 1
    });
});
//# sourceMappingURL=welcomePage.contribution.js.map