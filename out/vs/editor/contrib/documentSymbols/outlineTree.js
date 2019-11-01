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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/collections", "vs/base/common/filters", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/contrib/documentSymbols/outlineModel", "vs/nls", "vs/base/browser/ui/iconLabel/iconLabel", "vs/platform/configuration/common/configuration", "vs/platform/markers/common/markers", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/base/common/async", "vs/css!./media/outlineTree", "vs/css!./media/symbol-icons"], function (require, exports, dom, highlightedLabel_1, collections_1, filters_1, range_1, modes_1, outlineModel_1, nls_1, iconLabel_1, configuration_1, markers_1, themeService_1, colorRegistry_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OutlineNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            if (element instanceof outlineModel_1.OutlineGroup) {
                return element.provider.displayName || element.id;
            }
            else {
                return element.symbol.name;
            }
        }
    }
    exports.OutlineNavigationLabelProvider = OutlineNavigationLabelProvider;
    class OutlineIdentityProvider {
        getId(element) {
            return element.id;
        }
    }
    exports.OutlineIdentityProvider = OutlineIdentityProvider;
    class OutlineGroupTemplate {
        constructor(labelContainer, label) {
            this.labelContainer = labelContainer;
            this.label = label;
        }
    }
    exports.OutlineGroupTemplate = OutlineGroupTemplate;
    OutlineGroupTemplate.id = 'OutlineGroupTemplate';
    class OutlineElementTemplate {
        constructor(container, iconLabel, decoration) {
            this.container = container;
            this.iconLabel = iconLabel;
            this.decoration = decoration;
        }
    }
    exports.OutlineElementTemplate = OutlineElementTemplate;
    OutlineElementTemplate.id = 'OutlineElementTemplate';
    class OutlineVirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof outlineModel_1.OutlineGroup) {
                return OutlineGroupTemplate.id;
            }
            else {
                return OutlineElementTemplate.id;
            }
        }
    }
    exports.OutlineVirtualDelegate = OutlineVirtualDelegate;
    class OutlineGroupRenderer {
        constructor() {
            this.templateId = OutlineGroupTemplate.id;
        }
        renderTemplate(container) {
            const labelContainer = dom.$('.outline-element-label');
            dom.addClass(container, 'outline-element');
            dom.append(container, labelContainer);
            return new OutlineGroupTemplate(labelContainer, new highlightedLabel_1.HighlightedLabel(labelContainer, true));
        }
        renderElement(node, index, template) {
            template.label.set(node.element.provider.displayName || nls_1.localize('provider', "Outline Provider"), filters_1.createMatches(node.filterData));
        }
        disposeTemplate(_template) {
            // nothing
        }
    }
    exports.OutlineGroupRenderer = OutlineGroupRenderer;
    let OutlineElementRenderer = class OutlineElementRenderer {
        constructor(_configurationService, _themeService) {
            this._configurationService = _configurationService;
            this._themeService = _themeService;
            this.templateId = OutlineElementTemplate.id;
        }
        renderTemplate(container) {
            dom.addClass(container, 'outline-element');
            const iconLabel = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            const decoration = dom.$('.outline-element-decoration');
            container.appendChild(decoration);
            return new OutlineElementTemplate(container, iconLabel, decoration);
        }
        renderElement(node, index, template) {
            const { element } = node;
            const options = {
                matches: filters_1.createMatches(node.filterData),
                labelEscapeNewLines: true,
                extraClasses: [],
                title: nls_1.localize('title.template', "{0} ({1})", element.symbol.name, OutlineElementRenderer._symbolKindNames[element.symbol.kind])
            };
            if (this._configurationService.getValue("outline.icons" /* icons */)) {
                // add styles for the icons
                options.extraClasses.push(`outline-element-icon ${modes_1.symbolKindToCssClass(element.symbol.kind, true)}`);
            }
            if (element.symbol.tags.indexOf(1 /* Deprecated */) >= 0) {
                options.extraClasses.push(`deprecated`);
                options.matches = [];
            }
            template.iconLabel.setLabel(element.symbol.name, element.symbol.detail, options);
            this._renderMarkerInfo(element, template);
        }
        _renderMarkerInfo(element, template) {
            if (!element.marker) {
                dom.hide(template.decoration);
                template.container.style.removeProperty('--outline-element-color');
                return;
            }
            const { count, topSev } = element.marker;
            const color = this._themeService.getTheme().getColor(topSev === markers_1.MarkerSeverity.Error ? colorRegistry_1.listErrorForeground : colorRegistry_1.listWarningForeground);
            const cssColor = color ? color.toString() : 'inherit';
            // color of the label
            if (this._configurationService.getValue("outline.problems.colors" /* problemsColors */)) {
                template.container.style.setProperty('--outline-element-color', cssColor);
            }
            else {
                template.container.style.removeProperty('--outline-element-color');
            }
            // badge with color/rollup
            if (!this._configurationService.getValue("outline.problems.badges" /* problemsBadges */)) {
                dom.hide(template.decoration);
            }
            else if (count > 0) {
                dom.show(template.decoration);
                dom.removeClass(template.decoration, 'bubble');
                template.decoration.innerText = count < 10 ? count.toString() : '+9';
                template.decoration.title = count === 1 ? nls_1.localize('1.problem', "1 problem in this element") : nls_1.localize('N.problem', "{0} problems in this element", count);
                template.decoration.style.setProperty('--outline-element-color', cssColor);
            }
            else {
                dom.show(template.decoration);
                dom.addClass(template.decoration, 'bubble');
                template.decoration.innerText = '\uf052';
                template.decoration.title = nls_1.localize('deep.problem', "Contains elements with problems");
                template.decoration.style.setProperty('--outline-element-color', cssColor);
            }
        }
        disposeTemplate(_template) {
            _template.iconLabel.dispose();
        }
    };
    OutlineElementRenderer._symbolKindNames = {
        [17 /* Array */]: nls_1.localize('Array', "array"),
        [16 /* Boolean */]: nls_1.localize('Boolean', "boolean"),
        [4 /* Class */]: nls_1.localize('Class', "class"),
        [13 /* Constant */]: nls_1.localize('Constant', "constant"),
        [8 /* Constructor */]: nls_1.localize('Constructor', "constructor"),
        [9 /* Enum */]: nls_1.localize('Enum', "enumeration"),
        [21 /* EnumMember */]: nls_1.localize('EnumMember', "enumeration member"),
        [23 /* Event */]: nls_1.localize('Event', "event"),
        [7 /* Field */]: nls_1.localize('Field', "field"),
        [0 /* File */]: nls_1.localize('File', "file"),
        [11 /* Function */]: nls_1.localize('Function', "function"),
        [10 /* Interface */]: nls_1.localize('Interface', "interface"),
        [19 /* Key */]: nls_1.localize('Key', "key"),
        [5 /* Method */]: nls_1.localize('Method', "method"),
        [1 /* Module */]: nls_1.localize('Module', "module"),
        [2 /* Namespace */]: nls_1.localize('Namespace', "namespace"),
        [20 /* Null */]: nls_1.localize('Null', "null"),
        [15 /* Number */]: nls_1.localize('Number', "number"),
        [18 /* Object */]: nls_1.localize('Object', "object"),
        [24 /* Operator */]: nls_1.localize('Operator', "operator"),
        [3 /* Package */]: nls_1.localize('Package', "package"),
        [6 /* Property */]: nls_1.localize('Property', "property"),
        [14 /* String */]: nls_1.localize('String', "string"),
        [22 /* Struct */]: nls_1.localize('Struct', "struct"),
        [25 /* TypeParameter */]: nls_1.localize('TypeParameter', "type parameter"),
        [12 /* Variable */]: nls_1.localize('Variable', "variable"),
    };
    OutlineElementRenderer = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, themeService_1.IThemeService)
    ], OutlineElementRenderer);
    exports.OutlineElementRenderer = OutlineElementRenderer;
    var OutlineSortOrder;
    (function (OutlineSortOrder) {
        OutlineSortOrder[OutlineSortOrder["ByPosition"] = 0] = "ByPosition";
        OutlineSortOrder[OutlineSortOrder["ByName"] = 1] = "ByName";
        OutlineSortOrder[OutlineSortOrder["ByKind"] = 2] = "ByKind";
    })(OutlineSortOrder = exports.OutlineSortOrder || (exports.OutlineSortOrder = {}));
    class OutlineItemComparator {
        constructor(type = 0 /* ByPosition */) {
            this.type = type;
            this._collator = new async_1.IdleValue(() => new Intl.Collator(undefined, { numeric: true }));
        }
        compare(a, b) {
            if (a instanceof outlineModel_1.OutlineGroup && b instanceof outlineModel_1.OutlineGroup) {
                return a.providerIndex - b.providerIndex;
            }
            else if (a instanceof outlineModel_1.OutlineElement && b instanceof outlineModel_1.OutlineElement) {
                if (this.type === 2 /* ByKind */) {
                    return a.symbol.kind - b.symbol.kind || this._collator.getValue().compare(a.symbol.name, b.symbol.name);
                }
                else if (this.type === 1 /* ByName */) {
                    return this._collator.getValue().compare(a.symbol.name, b.symbol.name) || range_1.Range.compareRangesUsingStarts(a.symbol.range, b.symbol.range);
                }
                else if (this.type === 0 /* ByPosition */) {
                    return range_1.Range.compareRangesUsingStarts(a.symbol.range, b.symbol.range) || this._collator.getValue().compare(a.symbol.name, b.symbol.name);
                }
            }
            return 0;
        }
    }
    exports.OutlineItemComparator = OutlineItemComparator;
    class OutlineDataSource {
        getChildren(element) {
            if (!element) {
                return [];
            }
            return collections_1.values(element.children);
        }
    }
    exports.OutlineDataSource = OutlineDataSource;
});
//# sourceMappingURL=outlineTree.js.map