define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Split a string up to the delimiter. If the delimiter doesn't exist the first
     * item will have all the text and the second item will be an empty string.
     */
    exports.split = (str, delimiter) => {
        const index = str.indexOf(delimiter);
        return index !== -1
            ? [str.substring(0, index).trim(), str.substring(index + 1)]
            : [str, ""];
    };
});
//# sourceMappingURL=util.js.map