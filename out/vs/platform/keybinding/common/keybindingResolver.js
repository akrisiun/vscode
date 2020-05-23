/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/base/common/map"], function (require, exports, arrays_1, actions_1, commands_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingResolver = void 0;
    class KeybindingResolver {
        constructor(defaultKeybindings, overrides) {
            this._defaultKeybindings = defaultKeybindings;
            this._defaultBoundCommands = new Map();
            for (let i = 0, len = defaultKeybindings.length; i < len; i++) {
                const command = defaultKeybindings[i].command;
                if (command) {
                    this._defaultBoundCommands.set(command, true);
                }
            }
            this._map = new Map();
            this._lookupMap = new Map();
            this._keybindings = KeybindingResolver.combine(defaultKeybindings, overrides);
            for (let i = 0, len = this._keybindings.length; i < len; i++) {
                let k = this._keybindings[i];
                if (k.keypressParts.length === 0) {
                    // unbound
                    continue;
                }
                if (k.when && k.when.type === 0 /* False */) {
                    // when condition is false
                    continue;
                }
                // TODO@chords
                this._addKeyPress(k.keypressParts[0], k);
            }
        }
        static _isTargetedForRemoval(defaultKb, keypressFirstPart, keypressChordPart, command, when) {
            if (defaultKb.command !== command) {
                return false;
            }
            // TODO@chords
            if (keypressFirstPart && defaultKb.keypressParts[0] !== keypressFirstPart) {
                return false;
            }
            // TODO@chords
            if (keypressChordPart && defaultKb.keypressParts[1] !== keypressChordPart) {
                return false;
            }
            if (when) {
                if (!defaultKb.when) {
                    return false;
                }
                if (!when.equals(defaultKb.when)) {
                    return false;
                }
            }
            return true;
        }
        /**
         * Looks for rules containing -command in `overrides` and removes them directly from `defaults`.
         */
        static combine(defaults, rawOverrides) {
            defaults = defaults.slice(0);
            let overrides = [];
            for (const override of rawOverrides) {
                if (!override.command || override.command.length === 0 || override.command.charAt(0) !== '-') {
                    overrides.push(override);
                    continue;
                }
                const command = override.command.substr(1);
                // TODO@chords
                const keypressFirstPart = override.keypressParts[0];
                const keypressChordPart = override.keypressParts[1];
                const when = override.when;
                for (let j = defaults.length - 1; j >= 0; j--) {
                    if (this._isTargetedForRemoval(defaults[j], keypressFirstPart, keypressChordPart, command, when)) {
                        defaults.splice(j, 1);
                    }
                }
            }
            return defaults.concat(overrides);
        }
        _addKeyPress(keypress, item) {
            const conflicts = this._map.get(keypress);
            if (typeof conflicts === 'undefined') {
                // There is no conflict so far
                this._map.set(keypress, [item]);
                this._addToLookupMap(item);
                return;
            }
            for (let i = conflicts.length - 1; i >= 0; i--) {
                let conflict = conflicts[i];
                if (conflict.command === item.command) {
                    continue;
                }
                const conflictIsChord = (conflict.keypressParts.length > 1);
                const itemIsChord = (item.keypressParts.length > 1);
                // TODO@chords
                if (conflictIsChord && itemIsChord && conflict.keypressParts[1] !== item.keypressParts[1]) {
                    // The conflict only shares the chord start with this command
                    continue;
                }
                if (KeybindingResolver.whenIsEntirelyIncluded(conflict.when, item.when)) {
                    // `item` completely overwrites `conflict`
                    // Remove conflict from the lookupMap
                    this._removeFromLookupMap(conflict);
                }
            }
            conflicts.push(item);
            this._addToLookupMap(item);
        }
        _addToLookupMap(item) {
            if (!item.command) {
                return;
            }
            let arr = this._lookupMap.get(item.command);
            if (typeof arr === 'undefined') {
                arr = [item];
                this._lookupMap.set(item.command, arr);
            }
            else {
                arr.push(item);
            }
        }
        _removeFromLookupMap(item) {
            if (!item.command) {
                return;
            }
            let arr = this._lookupMap.get(item.command);
            if (typeof arr === 'undefined') {
                return;
            }
            for (let i = 0, len = arr.length; i < len; i++) {
                if (arr[i] === item) {
                    arr.splice(i, 1);
                    return;
                }
            }
        }
        /**
         * Returns true if it is provable `a` implies `b`.
         */
        static whenIsEntirelyIncluded(a, b) {
            if (!b) {
                return true;
            }
            if (!a) {
                return false;
            }
            return this._implies(a, b);
        }
        /**
         * Returns true if it is provable `p` implies `q`.
         */
        static _implies(p, q) {
            const notP = p.negate();
            const terminals = (node) => {
                if (node.type === 9 /* Or */) {
                    return node.expr;
                }
                return [node];
            };
            let expr = terminals(notP).concat(terminals(q));
            for (let i = 0; i < expr.length; i++) {
                const a = expr[i];
                const notA = a.negate();
                for (let j = i + 1; j < expr.length; j++) {
                    const b = expr[j];
                    if (notA.equals(b)) {
                        return true;
                    }
                }
            }
            return false;
        }
        getDefaultBoundCommands() {
            return this._defaultBoundCommands;
        }
        getDefaultKeybindings() {
            return this._defaultKeybindings;
        }
        getKeybindings() {
            return this._keybindings;
        }
        lookupKeybindings(commandId) {
            let items = this._lookupMap.get(commandId);
            if (typeof items === 'undefined' || items.length === 0) {
                return [];
            }
            // Reverse to get the most specific item first
            let result = [], resultLen = 0;
            for (let i = items.length - 1; i >= 0; i--) {
                result[resultLen++] = items[i];
            }
            return result;
        }
        lookupPrimaryKeybinding(commandId) {
            let items = this._lookupMap.get(commandId);
            if (typeof items === 'undefined' || items.length === 0) {
                return null;
            }
            return items[items.length - 1];
        }
        resolve(context, currentChord, keypress) {
            let lookupMap = null;
            if (currentChord !== null) {
                // Fetch all chord bindings for `currentChord`
                const candidates = this._map.get(currentChord);
                if (typeof candidates === 'undefined') {
                    // No chords starting with `currentChord`
                    return null;
                }
                lookupMap = [];
                for (let i = 0, len = candidates.length; i < len; i++) {
                    let candidate = candidates[i];
                    // TODO@chords
                    if (candidate.keypressParts[1] === keypress) {
                        lookupMap.push(candidate);
                    }
                }
            }
            else {
                const candidates = this._map.get(keypress);
                if (typeof candidates === 'undefined') {
                    // No bindings with `keypress`
                    return null;
                }
                lookupMap = candidates;
            }
            let result = this._findCommand(context, lookupMap);
            if (!result) {
                return null;
            }
            // TODO@chords
            if (currentChord === null && result.keypressParts.length > 1 && result.keypressParts[1] !== null) {
                return {
                    enterChord: true,
                    leaveChord: false,
                    commandId: null,
                    commandArgs: null,
                    bubble: false
                };
            }
            return {
                enterChord: false,
                leaveChord: result.keypressParts.length > 1,
                commandId: result.command,
                commandArgs: result.commandArgs,
                bubble: result.bubble
            };
        }
        _findCommand(context, matches) {
            for (let i = matches.length - 1; i >= 0; i--) {
                let k = matches[i];
                if (!KeybindingResolver.contextMatchesRules(context, k.when)) {
                    continue;
                }
                return k;
            }
            return null;
        }
        static contextMatchesRules(context, rules) {
            if (!rules) {
                return true;
            }
            return rules.evaluate(context);
        }
        static getAllUnboundCommands(boundCommands) {
            const unboundCommands = [];
            const seenMap = new Map();
            const addCommand = (id, includeCommandWithArgs) => {
                if (seenMap.has(id)) {
                    return;
                }
                seenMap.set(id, true);
                if (id[0] === '_' || id.indexOf('vscode.') === 0) { // private command
                    return;
                }
                if (boundCommands.get(id) === true) {
                    return;
                }
                if (!includeCommandWithArgs) {
                    const command = commands_1.CommandsRegistry.getCommand(id);
                    if (command && typeof command.description === 'object'
                        && arrays_1.isNonEmptyArray(command.description.args)) { // command with args
                        return;
                    }
                }
                unboundCommands.push(id);
            };
            for (const id of map_1.keys(actions_1.MenuRegistry.getCommands())) {
                addCommand(id, true);
            }
            for (const id of map_1.keys(commands_1.CommandsRegistry.getCommands())) {
                addCommand(id, false);
            }
            return unboundCommands;
        }
    }
    exports.KeybindingResolver = KeybindingResolver;
});
//# sourceMappingURL=keybindingResolver.js.map