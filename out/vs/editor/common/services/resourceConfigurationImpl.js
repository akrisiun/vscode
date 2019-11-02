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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService", "vs/platform/configuration/common/configuration"], function (require, exports, event_1, lifecycle_1, position_1, modeService_1, modelService_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TextResourceConfigurationService = class TextResourceConfigurationService extends lifecycle_1.Disposable {
        constructor(configurationService, modelService, modeService) {
            super();
            this.configurationService = configurationService;
            this.modelService = modelService;
            this.modeService = modeService;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._register(this.configurationService.onDidChangeConfiguration(e => this._onDidChangeConfiguration.fire(e)));
        }
        getValue(resource, arg2, arg3) {
            if (typeof arg3 === 'string') {
                return this._getValue(resource, position_1.Position.isIPosition(arg2) ? arg2 : null, arg3);
            }
            return this._getValue(resource, null, typeof arg2 === 'string' ? arg2 : undefined);
        }
        _getValue(resource, position, section) {
            const language = resource ? this.getLanguage(resource, position) : undefined;
            if (typeof section === 'undefined') {
                return this.configurationService.getValue({ resource, overrideIdentifier: language });
            }
            return this.configurationService.getValue(section, { resource, overrideIdentifier: language });
        }
        getLanguage(resource, position) {
            const model = this.modelService.getModel(resource);
            if (model) {
                return position ? this.modeService.getLanguageIdentifier(model.getLanguageIdAtPosition(position.lineNumber, position.column)).language : model.getLanguageIdentifier().language;
            }
            return this.modeService.getModeIdByFilepathOrFirstLine(resource);
        }
    };
    TextResourceConfigurationService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, modelService_1.IModelService),
        __param(2, modeService_1.IModeService)
    ], TextResourceConfigurationService);
    exports.TextResourceConfigurationService = TextResourceConfigurationService;
});
//# sourceMappingURL=resourceConfigurationImpl.js.map