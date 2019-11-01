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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "electron", "vs/editor/browser/services/codeEditorService"], function (require, exports, platform_1, contributions_1, electron_1, codeEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SleepResumeRepaintMinimap = class SleepResumeRepaintMinimap {
        constructor(codeEditorService) {
            electron_1.ipcRenderer.on('vscode:osResume', () => {
                codeEditorService.listCodeEditors().forEach(editor => editor.render(true));
            });
        }
    };
    SleepResumeRepaintMinimap = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService)
    ], SleepResumeRepaintMinimap);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(SleepResumeRepaintMinimap, 4 /* Eventually */);
});
//# sourceMappingURL=sleepResumeRepaintMinimap.js.map