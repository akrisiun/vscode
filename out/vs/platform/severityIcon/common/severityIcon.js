/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/severity", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry"], function (require, exports, severity_1, themeService_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var SeverityIcon;
    (function (SeverityIcon) {
        function className(severity) {
            switch (severity) {
                case severity_1.default.Ignore:
                    return 'severity-ignore codicon-info';
                case severity_1.default.Info:
                    return 'codicon-info';
                case severity_1.default.Warning:
                    return 'codicon-warning';
                case severity_1.default.Error:
                    return 'codicon-error';
            }
            return '';
        }
        SeverityIcon.className = className;
    })(SeverityIcon = exports.SeverityIcon || (exports.SeverityIcon = {}));
    themeService_1.registerThemingParticipant((theme, collector) => {
        const errorIconForeground = theme.getColor(colorRegistry_1.problemsErrorIconForeground);
        if (errorIconForeground) {
            collector.addRule(`
			.monaco-workbench .zone-widget .codicon-error,
			.monaco-workbench .markers-panel .marker-icon.codicon-error,
			.monaco-workbench .extensions-viewlet > .extensions .codicon-error {
				color: ${errorIconForeground};
			}
		`);
        }
        const warningIconForeground = theme.getColor(colorRegistry_1.problemsWarningIconForeground);
        if (errorIconForeground) {
            collector.addRule(`
			.monaco-workbench .zone-widget .codicon-warning,
			.monaco-workbench .markers-panel .marker-icon.codicon-warning,
			.monaco-workbench .extensions-viewlet > .extensions .codicon-warning {
				color: ${warningIconForeground};
			}
		`);
        }
        const infoIconForeground = theme.getColor(colorRegistry_1.problemsInfoIconForeground);
        if (errorIconForeground) {
            collector.addRule(`
			.monaco-workbench .zone-widget .codicon-info,
			.monaco-workbench .markers-panel .marker-icon.codicon-info {
				color: ${infoIconForeground};
			}
		`);
        }
    });
});
//# sourceMappingURL=severityIcon.js.map