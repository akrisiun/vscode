/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CodeActionKind {
        constructor(value) {
            this.value = value;
        }
        equals(other) {
            return this.value === other.value;
        }
        contains(other) {
            return this.equals(other) || strings_1.startsWith(other.value, this.value + CodeActionKind.sep);
        }
        intersects(other) {
            return this.contains(other) || other.contains(this);
        }
    }
    exports.CodeActionKind = CodeActionKind;
    CodeActionKind.sep = '.';
    CodeActionKind.Empty = new CodeActionKind('');
    CodeActionKind.QuickFix = new CodeActionKind('quickfix');
    CodeActionKind.Refactor = new CodeActionKind('refactor');
    CodeActionKind.Source = new CodeActionKind('source');
    CodeActionKind.SourceOrganizeImports = new CodeActionKind('source.organizeImports');
    CodeActionKind.SourceFixAll = new CodeActionKind('source.fixAll');
    var CodeActionAutoApply;
    (function (CodeActionAutoApply) {
        CodeActionAutoApply[CodeActionAutoApply["IfSingle"] = 0] = "IfSingle";
        CodeActionAutoApply[CodeActionAutoApply["First"] = 1] = "First";
        CodeActionAutoApply[CodeActionAutoApply["Never"] = 2] = "Never";
    })(CodeActionAutoApply = exports.CodeActionAutoApply || (exports.CodeActionAutoApply = {}));
    function mayIncludeActionsOfKind(filter, providedKind) {
        // A provided kind may be a subset or superset of our filtered kind.
        if (filter.kind && !filter.kind.intersects(providedKind)) {
            return false;
        }
        // Don't return source actions unless they are explicitly requested
        if (CodeActionKind.Source.contains(providedKind) && !filter.includeSourceActions) {
            return false;
        }
        return true;
    }
    exports.mayIncludeActionsOfKind = mayIncludeActionsOfKind;
    function filtersAction(filter, action) {
        const actionKind = action.kind ? new CodeActionKind(action.kind) : undefined;
        // Filter out actions by kind
        if (filter.kind) {
            if (!actionKind || !filter.kind.contains(actionKind)) {
                return false;
            }
        }
        // Don't return source actions unless they are explicitly requested
        if (!filter.includeSourceActions) {
            if (actionKind && CodeActionKind.Source.contains(actionKind)) {
                return false;
            }
        }
        if (filter.onlyIncludePreferredActions) {
            if (!action.isPreferred) {
                return false;
            }
        }
        return true;
    }
    exports.filtersAction = filtersAction;
});
//# sourceMappingURL=codeActionTrigger.js.map