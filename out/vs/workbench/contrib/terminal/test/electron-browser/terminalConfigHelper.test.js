/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/terminal/browser/terminalConfigHelper", "vs/editor/common/config/editorOptions", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, assert, terminalConfigHelper_1, editorOptions_1, testConfigurationService_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - TerminalConfigHelper', () => {
        let fixture;
        setup(() => {
            fixture = document.body;
        });
        // test('TerminalConfigHelper - getFont fontFamily', function () {
        // 	const configurationService = new TestConfigurationService();
        // 	configurationService.setUserConfiguration('editor', { fontFamily: 'foo' });
        // 	configurationService.setUserConfiguration('terminal', { integrated: { fontFamily: 'bar' } });
        // 	const configHelper = new TerminalConfigHelper(LinuxDistro.Unknown, configurationService, null!, null!, null!);
        // 	configHelper.panelContainer = fixture;
        // 	assert.equal(configHelper.getFont().fontFamily, 'bar', 'terminal.integrated.fontFamily should be selected over editor.fontFamily');
        // });
        test('TerminalConfigHelper - getFont fontFamily (Linux Fedora)', function () {
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            configurationService.setUserConfiguration('editor', { fontFamily: 'foo' });
            configurationService.setUserConfiguration('terminal', { integrated: { fontFamily: null } });
            const configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Fedora, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.getFont().fontFamily, '\'DejaVu Sans Mono\', monospace', 'Fedora should have its font overridden when terminal.integrated.fontFamily not set');
        });
        test('TerminalConfigHelper - getFont fontFamily (Linux Ubuntu)', function () {
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            configurationService.setUserConfiguration('editor', { fontFamily: 'foo' });
            configurationService.setUserConfiguration('terminal', { integrated: { fontFamily: null } });
            const configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Ubuntu, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.getFont().fontFamily, '\'Ubuntu Mono\', monospace', 'Ubuntu should have its font overridden when terminal.integrated.fontFamily not set');
        });
        test('TerminalConfigHelper - getFont fontFamily (Linux Unknown)', function () {
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            configurationService.setUserConfiguration('editor', { fontFamily: 'foo' });
            configurationService.setUserConfiguration('terminal', { integrated: { fontFamily: null } });
            const configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Unknown, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.getFont().fontFamily, 'foo', 'editor.fontFamily should be the fallback when terminal.integrated.fontFamily not set');
        });
        test('TerminalConfigHelper - getFont fontSize', function () {
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            configurationService.setUserConfiguration('editor', {
                fontFamily: 'foo',
                fontSize: 9
            });
            configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: 'bar',
                    fontSize: 10
                }
            });
            let configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Unknown, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.getFont().fontSize, 10, 'terminal.integrated.fontSize should be selected over editor.fontSize');
            configurationService.setUserConfiguration('editor', {
                fontFamily: 'foo'
            });
            configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: null,
                    fontSize: 0
                }
            });
            configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Ubuntu, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.getFont().fontSize, 8, 'The minimum terminal font size (with adjustment) should be used when terminal.integrated.fontSize less than it');
            configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Unknown, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.getFont().fontSize, 6, 'The minimum terminal font size should be used when terminal.integrated.fontSize less than it');
            configurationService.setUserConfiguration('editor', {
                fontFamily: 'foo'
            });
            configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: 0,
                    fontSize: 1500
                }
            });
            configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Unknown, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.getFont().fontSize, 25, 'The maximum terminal font size should be used when terminal.integrated.fontSize more than it');
            configurationService.setUserConfiguration('editor', {
                fontFamily: 'foo'
            });
            configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: 0,
                    fontSize: null
                }
            });
            configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Ubuntu, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.getFont().fontSize, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize + 2, 'The default editor font size (with adjustment) should be used when terminal.integrated.fontSize is not set');
            configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Unknown, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.getFont().fontSize, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize, 'The default editor font size should be used when terminal.integrated.fontSize is not set');
        });
        test('TerminalConfigHelper - getFont lineHeight', function () {
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            configurationService.setUserConfiguration('editor', {
                fontFamily: 'foo',
                lineHeight: 1
            });
            configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: 0,
                    lineHeight: 2
                }
            });
            let configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Unknown, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.getFont().lineHeight, 2, 'terminal.integrated.lineHeight should be selected over editor.lineHeight');
            configurationService.setUserConfiguration('editor', {
                fontFamily: 'foo',
                lineHeight: 1
            });
            configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: 0,
                    lineHeight: 0
                }
            });
            configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Unknown, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.getFont().lineHeight, 1, 'editor.lineHeight should be 1 when terminal.integrated.lineHeight not set');
        });
        test('TerminalConfigHelper - isMonospace monospace', function () {
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: 'monospace'
                }
            });
            let configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Unknown, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.configFontIsMonospace(), true, 'monospace is monospaced');
        });
        test('TerminalConfigHelper - isMonospace sans-serif', function () {
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: 'sans-serif'
                }
            });
            let configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Unknown, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.configFontIsMonospace(), false, 'sans-serif is not monospaced');
        });
        test('TerminalConfigHelper - isMonospace serif', function () {
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: 'serif'
                }
            });
            let configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Unknown, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.configFontIsMonospace(), false, 'serif is not monospaced');
        });
        test('TerminalConfigHelper - isMonospace monospace falls back to editor.fontFamily', function () {
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            configurationService.setUserConfiguration('editor', {
                fontFamily: 'monospace'
            });
            configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: null
                }
            });
            let configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Unknown, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.configFontIsMonospace(), true, 'monospace is monospaced');
        });
        test('TerminalConfigHelper - isMonospace sans-serif falls back to editor.fontFamily', function () {
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            configurationService.setUserConfiguration('editor', {
                fontFamily: 'sans-serif'
            });
            configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: null
                }
            });
            let configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Unknown, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.configFontIsMonospace(), false, 'sans-serif is not monospaced');
        });
        test('TerminalConfigHelper - isMonospace serif falls back to editor.fontFamily', function () {
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            configurationService.setUserConfiguration('editor', {
                fontFamily: 'serif'
            });
            configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: null
                }
            });
            let configHelper = new terminalConfigHelper_1.TerminalConfigHelper(terminal_1.LinuxDistro.Unknown, configurationService, null, null, null, null, null, null);
            configHelper.panelContainer = fixture;
            assert.equal(configHelper.configFontIsMonospace(), false, 'serif is not monospaced');
        });
    });
});
//# sourceMappingURL=terminalConfigHelper.test.js.map