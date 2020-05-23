/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/base/common/event", "vs/nls", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/base/common/async", "vs/base/common/codicons"], function (require, exports, platform, event_1, nls_1, jsonContributionRegistry_1, async_1, Codicons) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.iconsSchemaId = exports.getIconRegistry = exports.registerIcon = exports.Extensions = void 0;
    //  ------ API types
    // color registry
    exports.Extensions = {
        IconContribution: 'base.contributions.icons'
    };
    class IconRegistry {
        constructor() {
            this._onDidChangeSchema = new event_1.Emitter();
            this.onDidChangeSchema = this._onDidChangeSchema.event;
            this.iconSchema = {
                definitions: {
                    icons: {
                        type: 'object',
                        properties: {
                            fontId: { type: 'string', description: nls_1.localize('iconDefintion.fontId', 'The id of the font to use. If not set, the font that is defined first is used.') },
                            fontCharacter: { type: 'string', description: nls_1.localize('iconDefintion.fontCharacter', 'The font character associated with the icon definition.') }
                        },
                        additionalProperties: false,
                        defaultSnippets: [{ body: { fontCharacter: '\\\\e030' } }]
                    }
                },
                type: 'object',
                properties: {}
            };
            this.iconReferenceSchema = { type: 'string', enum: [], enumDescriptions: [] };
            this.iconsById = {};
        }
        registerIcon(id, defaults, description, deprecationMessage) {
            if (!description) {
                description = nls_1.localize('icon.defaultDescription', 'Icon with identifier \'{0}\'', id);
            }
            let iconContribution = { id, description, defaults, deprecationMessage };
            this.iconsById[id] = iconContribution;
            let propertySchema = { $ref: '#/definitions/icons' };
            if (deprecationMessage) {
                propertySchema.deprecationMessage = deprecationMessage;
            }
            propertySchema.markdownDescription = `${description}: $(${id})`;
            this.iconSchema.properties[id] = propertySchema;
            this.iconReferenceSchema.enum.push(id);
            this.iconReferenceSchema.enumDescriptions.push(description);
            this._onDidChangeSchema.fire();
            return { id };
        }
        deregisterIcon(id) {
            delete this.iconsById[id];
            delete this.iconSchema.properties[id];
            const index = this.iconReferenceSchema.enum.indexOf(id);
            if (index !== -1) {
                this.iconReferenceSchema.enum.splice(index, 1);
                this.iconReferenceSchema.enumDescriptions.splice(index, 1);
            }
            this._onDidChangeSchema.fire();
        }
        getIcons() {
            return Object.keys(this.iconsById).map(id => this.iconsById[id]);
        }
        getIcon(id) {
            return this.iconsById[id];
        }
        getIconSchema() {
            return this.iconSchema;
        }
        getIconReferenceSchema() {
            return this.iconReferenceSchema;
        }
        toString() {
            let sorter = (a, b) => {
                let cat1 = a.indexOf('.') === -1 ? 0 : 1;
                let cat2 = b.indexOf('.') === -1 ? 0 : 1;
                if (cat1 !== cat2) {
                    return cat1 - cat2;
                }
                return a.localeCompare(b);
            };
            return Object.keys(this.iconsById).sort(sorter).map(k => `- \`${k}\`: ${this.iconsById[k].description}`).join('\n');
        }
    }
    const iconRegistry = new IconRegistry();
    platform.Registry.add(exports.Extensions.IconContribution, iconRegistry);
    function registerIcon(id, defaults, description, deprecationMessage) {
        return iconRegistry.registerIcon(id, defaults, description, deprecationMessage);
    }
    exports.registerIcon = registerIcon;
    function getIconRegistry() {
        return iconRegistry;
    }
    exports.getIconRegistry = getIconRegistry;
    function initialize() {
        for (const icon of Codicons.iconRegistry.all) {
            registerIcon(icon.id, icon.definition);
        }
        Codicons.iconRegistry.onDidRegister(icon => registerIcon(icon.id, icon.definition));
    }
    initialize();
    exports.iconsSchemaId = 'vscode://schemas/icons';
    let schemaRegistry = platform.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(exports.iconsSchemaId, iconRegistry.getIconSchema());
    const delayer = new async_1.RunOnceScheduler(() => schemaRegistry.notifySchemaChanged(exports.iconsSchemaId), 200);
    iconRegistry.onDidChangeSchema(() => {
        if (!delayer.isScheduled()) {
            delayer.schedule();
        }
    });
});
// setTimeout(_ => console.log(colorRegistry.toString()), 5000);
//# sourceMappingURL=iconRegistry.js.map