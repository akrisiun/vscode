/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types"], function (require, exports, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DataSource {
        constructor(arg) {
            this.modelProvider = types_1.isFunction(arg.getModel) ? arg : { getModel: () => arg };
        }
        getId(tree, element) {
            if (!element) {
                return null;
            }
            const model = this.modelProvider.getModel();
            return model === element ? '__root__' : model.dataSource.getId(element);
        }
        hasChildren(tree, element) {
            const model = this.modelProvider.getModel();
            return !!(model && model === element && model.entries.length > 0);
        }
        getChildren(tree, element) {
            const model = this.modelProvider.getModel();
            return Promise.resolve(model === element ? model.entries : []);
        }
        getParent(tree, element) {
            return Promise.resolve(null);
        }
    }
    exports.DataSource = DataSource;
    class AccessibilityProvider {
        constructor(modelProvider) {
            this.modelProvider = modelProvider;
        }
        getAriaLabel(tree, element) {
            const model = this.modelProvider.getModel();
            return model.accessibilityProvider ? model.accessibilityProvider.getAriaLabel(element) : null;
        }
        getPosInSet(tree, element) {
            const model = this.modelProvider.getModel();
            let i = 0;
            if (model.filter) {
                for (const entry of model.entries) {
                    if (model.filter.isVisible(entry)) {
                        i++;
                    }
                    if (entry === element) {
                        break;
                    }
                }
            }
            else {
                i = model.entries.indexOf(element) + 1;
            }
            return String(i);
        }
        getSetSize() {
            const model = this.modelProvider.getModel();
            let n = 0;
            if (model.filter) {
                for (const entry of model.entries) {
                    if (model.filter.isVisible(entry)) {
                        n++;
                    }
                }
            }
            else {
                n = model.entries.length;
            }
            return String(n);
        }
    }
    exports.AccessibilityProvider = AccessibilityProvider;
    class Filter {
        constructor(modelProvider) {
            this.modelProvider = modelProvider;
        }
        isVisible(tree, element) {
            const model = this.modelProvider.getModel();
            if (!model.filter) {
                return true;
            }
            return model.filter.isVisible(element);
        }
    }
    exports.Filter = Filter;
    class Renderer {
        constructor(modelProvider, styles) {
            this.modelProvider = modelProvider;
            this.styles = styles;
        }
        updateStyles(styles) {
            this.styles = styles;
        }
        getHeight(tree, element) {
            const model = this.modelProvider.getModel();
            return model.renderer.getHeight(element);
        }
        getTemplateId(tree, element) {
            const model = this.modelProvider.getModel();
            return model.renderer.getTemplateId(element);
        }
        renderTemplate(tree, templateId, container) {
            const model = this.modelProvider.getModel();
            return model.renderer.renderTemplate(templateId, container, this.styles);
        }
        renderElement(tree, element, templateId, templateData) {
            const model = this.modelProvider.getModel();
            model.renderer.renderElement(element, templateId, templateData, this.styles);
        }
        disposeTemplate(tree, templateId, templateData) {
            const model = this.modelProvider.getModel();
            model.renderer.disposeTemplate(templateId, templateData);
        }
    }
    exports.Renderer = Renderer;
});
//# sourceMappingURL=quickOpenViewer.js.map