/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/checkbox/checkbox", "vs/nls"], function (require, exports, checkbox_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const NLS_CASE_SENSITIVE_CHECKBOX_LABEL = nls.localize('caseDescription', "Match Case");
    const NLS_WHOLE_WORD_CHECKBOX_LABEL = nls.localize('wordsDescription', "Match Whole Word");
    const NLS_REGEX_CHECKBOX_LABEL = nls.localize('regexDescription', "Use Regular Expression");
    class CaseSensitiveCheckbox extends checkbox_1.Checkbox {
        constructor(opts) {
            super({
                actionClassName: 'codicon-case-sensitive',
                title: NLS_CASE_SENSITIVE_CHECKBOX_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.CaseSensitiveCheckbox = CaseSensitiveCheckbox;
    class WholeWordsCheckbox extends checkbox_1.Checkbox {
        constructor(opts) {
            super({
                actionClassName: 'codicon-whole-word',
                title: NLS_WHOLE_WORD_CHECKBOX_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.WholeWordsCheckbox = WholeWordsCheckbox;
    class RegexCheckbox extends checkbox_1.Checkbox {
        constructor(opts) {
            super({
                actionClassName: 'codicon-regex',
                title: NLS_REGEX_CHECKBOX_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.RegexCheckbox = RegexCheckbox;
});
//# sourceMappingURL=findInputCheckboxes.js.map