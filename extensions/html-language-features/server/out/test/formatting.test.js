"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
require("mocha");
const path = require("path");
const fs = require("fs");
const assert = require("assert");
const languageModes_1 = require("../modes/languageModes");
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const formatting_1 = require("../modes/formatting");
const vscode_html_languageservice_1 = require("vscode-html-languageservice");
suite('HTML Embedded Formatting', () => {
    function assertFormat(value, expected, options, formatOptions, message) {
        let workspace = {
            settings: options,
            folders: [{ name: 'foo', uri: 'test://foo' }]
        };
        var languageModes = languageModes_1.getLanguageModes({ css: true, javascript: true }, workspace, vscode_html_languageservice_1.ClientCapabilities.LATEST);
        let rangeStartOffset = value.indexOf('|');
        let rangeEndOffset;
        if (rangeStartOffset !== -1) {
            value = value.substr(0, rangeStartOffset) + value.substr(rangeStartOffset + 1);
            rangeEndOffset = value.indexOf('|');
            value = value.substr(0, rangeEndOffset) + value.substr(rangeEndOffset + 1);
        }
        else {
            rangeStartOffset = 0;
            rangeEndOffset = value.length;
        }
        let document = vscode_languageserver_types_1.TextDocument.create('test://test/test.html', 'html', 0, value);
        let range = vscode_languageserver_types_1.Range.create(document.positionAt(rangeStartOffset), document.positionAt(rangeEndOffset));
        if (!formatOptions) {
            formatOptions = vscode_languageserver_types_1.FormattingOptions.create(2, true);
        }
        let result = formatting_1.format(languageModes, document, range, formatOptions, undefined, { css: true, javascript: true });
        let actual = vscode_languageserver_types_1.TextDocument.applyEdits(document, result);
        assert.equal(actual, expected, message);
    }
    function assertFormatWithFixture(fixtureName, expectedPath, options, formatOptions) {
        let input = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'test', 'fixtures', 'inputs', fixtureName)).toString().replace(/\r\n/mg, '\n');
        let expected = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'test', 'fixtures', 'expected', expectedPath)).toString().replace(/\r\n/mg, '\n');
        assertFormat(input, expected, options, formatOptions, expectedPath);
    }
    test('HTML only', function () {
        assertFormat('<html><body><p>Hello</p></body></html>', '<html>\n\n<body>\n  <p>Hello</p>\n</body>\n\n</html>');
        assertFormat('|<html><body><p>Hello</p></body></html>|', '<html>\n\n<body>\n  <p>Hello</p>\n</body>\n\n</html>');
        assertFormat('<html>|<body><p>Hello</p></body>|</html>', '<html><body>\n  <p>Hello</p>\n</body></html>');
    });
    test('HTML & Scripts', function () {
        assertFormat('<html><head><script></script></head></html>', '<html>\n\n<head>\n  <script></script>\n</head>\n\n</html>');
        assertFormat('<html><head><script>var x=1;</script></head></html>', '<html>\n\n<head>\n  <script>var x = 1;</script>\n</head>\n\n</html>');
        assertFormat('<html><head><script>\nvar x=2;\n</script></head></html>', '<html>\n\n<head>\n  <script>\n    var x = 2;\n  </script>\n</head>\n\n</html>');
        assertFormat('<html><head>\n  <script>\nvar x=3;\n</script></head></html>', '<html>\n\n<head>\n  <script>\n    var x = 3;\n  </script>\n</head>\n\n</html>');
        assertFormat('<html><head>\n  <script>\nvar x=4;\nconsole.log("Hi");\n</script></head></html>', '<html>\n\n<head>\n  <script>\n    var x = 4;\n    console.log("Hi");\n  </script>\n</head>\n\n</html>');
        assertFormat('<html><head>\n  |<script>\nvar x=5;\n</script>|</head></html>', '<html><head>\n  <script>\n    var x = 5;\n  </script></head></html>');
    });
    test('HTLM & Scripts - Fixtures', function () {
        assertFormatWithFixture('19813.html', '19813.html');
        assertFormatWithFixture('19813.html', '19813-4spaces.html', undefined, vscode_languageserver_types_1.FormattingOptions.create(4, true));
        assertFormatWithFixture('19813.html', '19813-tab.html', undefined, vscode_languageserver_types_1.FormattingOptions.create(1, false));
        assertFormatWithFixture('21634.html', '21634.html');
    });
    test('Script end tag', function () {
        assertFormat('<html>\n<head>\n  <script>\nvar x  =  0;\n</script></head></html>', '<html>\n\n<head>\n  <script>\n    var x = 0;\n  </script>\n</head>\n\n</html>');
    });
    test('HTML & Multiple Scripts', function () {
        assertFormat('<html><head>\n<script>\nif(x){\nbar(); }\n</script><script>\nfunction(x){    }\n</script></head></html>', '<html>\n\n<head>\n  <script>\n    if (x) {\n      bar();\n    }\n  </script>\n  <script>\n    function(x) {}\n  </script>\n</head>\n\n</html>');
    });
    test('HTML & Styles', function () {
        assertFormat('<html><head>\n<style>\n.foo{display:none;}\n</style></head></html>', '<html>\n\n<head>\n  <style>\n    .foo {\n      display: none;\n    }\n  </style>\n</head>\n\n</html>');
    });
    test('EndWithNewline', function () {
        let options = {
            html: {
                format: {
                    endWithNewline: true
                }
            }
        };
        assertFormat('<html><body><p>Hello</p></body></html>', '<html>\n\n<body>\n  <p>Hello</p>\n</body>\n\n</html>\n', options);
        assertFormat('<html>|<body><p>Hello</p></body>|</html>', '<html><body>\n  <p>Hello</p>\n</body></html>', options);
        assertFormat('<html><head><script>\nvar x=1;\n</script></head></html>', '<html>\n\n<head>\n  <script>\n    var x = 1;\n  </script>\n</head>\n\n</html>\n', options);
    });
    test('Inside script', function () {
        assertFormat('<html><head>\n  <script>\n|var x=6;|\n</script></head></html>', '<html><head>\n  <script>\n  var x = 6;\n</script></head></html>');
        assertFormat('<html><head>\n  <script>\n|var x=6;\nvar y=  9;|\n</script></head></html>', '<html><head>\n  <script>\n  var x = 6;\n  var y = 9;\n</script></head></html>');
    });
    test('Range after new line', function () {
        assertFormat('<html><head>\n  |<script>\nvar x=6;\n</script>\n|</head></html>', '<html><head>\n  <script>\n    var x = 6;\n  </script>\n</head></html>');
    });
    test('bug 36574', function () {
        assertFormat('<script src="/js/main.js"> </script>', '<script src="/js/main.js"> </script>');
    });
    test('bug 48049', function () {
        assertFormat([
            '<html>',
            '<head>',
            '</head>',
            '',
            '<body>',
            '',
            '    <script>',
            '        function f(x) {}',
            '        f(function () {',
            '        // ',
            '',
            '        console.log(" vsc crashes on formatting")',
            '        });',
            '    </script>',
            '',
            '',
            '',
            '        </body>',
            '',
            '</html>'
        ].join('\n'), [
            '<html>',
            '',
            '<head>',
            '</head>',
            '',
            '<body>',
            '',
            '  <script>',
            '    function f(x) {}',
            '    f(function () {',
            '      // ',
            '',
            '      console.log(" vsc crashes on formatting")',
            '    });',
            '  </script>',
            '',
            '',
            '',
            '</body>',
            '',
            '</html>'
        ].join('\n'));
    });
    test('#58435', () => {
        let options = {
            html: {
                format: {
                    contentUnformatted: 'textarea'
                }
            }
        };
        var content = [
            '<html>',
            '',
            '<body>',
            '  <textarea name= "" id ="" cols="30" rows="10">',
            '  </textarea>',
            '</body>',
            '',
            '</html>',
        ].join('\n');
        var expected = [
            '<html>',
            '',
            '<body>',
            '  <textarea name="" id="" cols="30" rows="10">',
            '  </textarea>',
            '</body>',
            '',
            '</html>',
        ].join('\n');
        assertFormat(content, expected, options);
    });
}); /*
content_unformatted: Array(4)["pre", "code", "textarea", …]
end_with_newline: false
eol: "\n"
extra_liners: Array(3)["head", "body", "/html"]
indent_char: "\t"
indent_handlebars: false
indent_inner_html: false
indent_size: 1
max_preserve_newlines: 32786
preserve_newlines: true
unformatted: Array(1)["wbr"]
wrap_attributes: "auto"
wrap_attributes_indent_size: undefined
wrap_line_length: 120*/
//# sourceMappingURL=formatting.test.js.map