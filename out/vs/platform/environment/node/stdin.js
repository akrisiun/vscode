define(["require", "exports", "vs/base/common/path", "fs", "os", "vs/base/node/terminalEncoding"], function (require, exports, paths, fs, os, terminalEncoding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readFromStdin = exports.getStdinFilePath = exports.stdinDataListener = exports.hasStdinWithoutTty = void 0;
    function hasStdinWithoutTty() {
        try {
            return !process.stdin.isTTY; // Via https://twitter.com/MylesBorins/status/782009479382626304
        }
        catch (error) {
            // Windows workaround for https://github.com/nodejs/node/issues/11656
        }
        return false;
    }
    exports.hasStdinWithoutTty = hasStdinWithoutTty;
    function stdinDataListener(durationinMs) {
        return new Promise(c => {
            const dataListener = () => c(true);
            // wait for 1s maximum...
            setTimeout(() => {
                process.stdin.removeListener('data', dataListener);
                c(false);
            }, durationinMs);
            // ...but finish early if we detect data
            process.stdin.once('data', dataListener);
        });
    }
    exports.stdinDataListener = stdinDataListener;
    function getStdinFilePath() {
        return paths.join(os.tmpdir(), `code-stdin-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 3)}.txt`);
    }
    exports.getStdinFilePath = getStdinFilePath;
    async function readFromStdin(targetPath, verbose) {
        // open tmp file for writing
        const stdinFileStream = fs.createWriteStream(targetPath);
        let encoding = await terminalEncoding_1.resolveTerminalEncoding(verbose);
        const iconv = await new Promise((resolve_1, reject_1) => { require(['iconv-lite'], resolve_1, reject_1); });
        if (!iconv.encodingExists(encoding)) {
            console.log(`Unsupported terminal encoding: ${encoding}, falling back to UTF-8.`);
            encoding = 'utf8';
        }
        // Pipe into tmp file using terminals encoding
        const converterStream = iconv.decodeStream(encoding);
        process.stdin.pipe(converterStream).pipe(stdinFileStream);
    }
    exports.readFromStdin = readFromStdin;
});
//# sourceMappingURL=stdin.js.map