/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/registry/common/platform", "vs/base/common/event"], function (require, exports, instantiation_1, lifecycle_1, platform, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IThemeService = instantiation_1.createDecorator('themeService');
    function themeColorFromId(id) {
        return { id };
    }
    exports.themeColorFromId = themeColorFromId;
    exports.FileThemeIcon = { id: 'file' };
    exports.FolderThemeIcon = { id: 'folder' };
    // base themes
    exports.DARK = 'dark';
    exports.LIGHT = 'light';
    exports.HIGH_CONTRAST = 'hc';
    function getThemeTypeSelector(type) {
        switch (type) {
            case exports.DARK: return 'vs-dark';
            case exports.HIGH_CONTRAST: return 'hc-black';
            default: return 'vs';
        }
    }
    exports.getThemeTypeSelector = getThemeTypeSelector;
    // static theming participant
    exports.Extensions = {
        ThemingContribution: 'base.contributions.theming'
    };
    class ThemingRegistry {
        constructor() {
            this.themingParticipants = [];
            this.themingParticipants = [];
            this.onThemingParticipantAddedEmitter = new event_1.Emitter();
        }
        onThemeChange(participant) {
            this.themingParticipants.push(participant);
            this.onThemingParticipantAddedEmitter.fire(participant);
            return lifecycle_1.toDisposable(() => {
                const idx = this.themingParticipants.indexOf(participant);
                this.themingParticipants.splice(idx, 1);
            });
        }
        get onThemingParticipantAdded() {
            return this.onThemingParticipantAddedEmitter.event;
        }
        getThemingParticipants() {
            return this.themingParticipants;
        }
    }
    let themingRegistry = new ThemingRegistry();
    platform.Registry.add(exports.Extensions.ThemingContribution, themingRegistry);
    function registerThemingParticipant(participant) {
        return themingRegistry.onThemeChange(participant);
    }
    exports.registerThemingParticipant = registerThemingParticipant;
});
//# sourceMappingURL=themeService.js.map