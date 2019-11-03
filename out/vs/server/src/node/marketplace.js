define(["require", "exports", "fs", "path", "util", "vs/base/node/pfs", "vs/base/node/zip", "vs/nls", "vs/platform/product/common/product", "vs/server/src/node/util"], function (require, exports, fs, path, util, pfs_1, vszip, nls, product_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tarStream = util_1.localRequire("tar-stream/index");
    // We will be overriding these, so keep a reference to the original.
    const vszipExtract = vszip.extract;
    const vszipBuffer = vszip.buffer;
    exports.tar = async (tarPath, files) => {
        const pack = tarStream.pack();
        const chunks = [];
        const ended = new Promise((resolve) => {
            pack.on("end", () => resolve(Buffer.concat(chunks)));
        });
        pack.on("data", (chunk) => chunks.push(chunk));
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            pack.entry({ name: file.path }, file.contents);
        }
        pack.finalize();
        await util.promisify(fs.writeFile)(tarPath, await ended);
        return tarPath;
    };
    exports.extract = async (archivePath, extractPath, options = {}, token) => {
        try {
            await extractTar(archivePath, extractPath, options, token);
        }
        catch (error) {
            if (error.toString().includes("Invalid tar header")) {
                await vszipExtract(archivePath, extractPath, options, token);
            }
        }
    };
    exports.buffer = (targetPath, filePath) => {
        return new Promise(async (resolve, reject) => {
            try {
                let done = false;
                await extractAssets(targetPath, new RegExp(filePath), (assetPath, data) => {
                    if (path.normalize(assetPath) === path.normalize(filePath)) {
                        done = true;
                        resolve(data);
                    }
                });
                if (!done) {
                    throw new Error("couldn't find asset " + filePath);
                }
            }
            catch (error) {
                if (error.toString().includes("Invalid tar header")) {
                    vszipBuffer(targetPath, filePath).then(resolve).catch(reject);
                }
                else {
                    reject(error);
                }
            }
        });
    };
    const extractAssets = async (tarPath, match, callback) => {
        return new Promise((resolve, reject) => {
            const extractor = tarStream.extract();
            const fail = (error) => {
                extractor.destroy();
                reject(error);
            };
            extractor.once("error", fail);
            extractor.on("entry", async (header, stream, next) => {
                const name = header.name;
                if (match.test(name)) {
                    extractData(stream).then((data) => {
                        callback(name, data);
                        next();
                    }).catch(fail);
                }
                else {
                    stream.on("end", () => next());
                    stream.resume(); // Just drain it.
                }
            });
            extractor.on("finish", resolve);
            fs.createReadStream(tarPath).pipe(extractor);
        });
    };
    const extractData = (stream) => {
        return new Promise((resolve, reject) => {
            const fileData = [];
            stream.on("error", reject);
            stream.on("end", () => resolve(Buffer.concat(fileData)));
            stream.on("data", (data) => fileData.push(data));
        });
    };
    const extractTar = async (tarPath, targetPath, options = {}, token) => {
        return new Promise((resolve, reject) => {
            const sourcePathRegex = new RegExp(options.sourcePath ? `^${options.sourcePath}` : "");
            const extractor = tarStream.extract();
            const fail = (error) => {
                extractor.destroy();
                reject(error);
            };
            extractor.once("error", fail);
            extractor.on("entry", async (header, stream, next) => {
                const nextEntry = () => {
                    stream.on("end", () => next());
                    stream.resume();
                };
                const rawName = path.normalize(header.name);
                if (token.isCancellationRequested || !sourcePathRegex.test(rawName)) {
                    return nextEntry();
                }
                const fileName = rawName.replace(sourcePathRegex, "");
                const targetFileName = path.join(targetPath, fileName);
                if (/\/$/.test(fileName)) {
                    return pfs_1.mkdirp(targetFileName).then(nextEntry);
                }
                const dirName = path.dirname(fileName);
                const targetDirName = path.join(targetPath, dirName);
                if (targetDirName.indexOf(targetPath) !== 0) {
                    return fail(new Error(nls.localize("invalid file", "Error extracting {0}. Invalid file.", fileName)));
                }
                await pfs_1.mkdirp(targetDirName, undefined, token);
                const fstream = fs.createWriteStream(targetFileName, { mode: header.mode });
                fstream.once("close", () => next());
                fstream.once("error", fail);
                stream.pipe(fstream);
            });
            extractor.once("finish", resolve);
            fs.createReadStream(tarPath).pipe(extractor);
        });
    };
    /**
     * Override original functionality so we can use a custom marketplace with
     * either tars or zips.
     */
    exports.enableCustomMarketplace = () => {
        product_1.default.extensionsGallery = Object.assign({ serviceUrl: process.env.SERVICE_URL || "https://v1.extapi.coder.com", itemUrl: process.env.ITEM_URL || "", controlUrl: "", recommendationsUrl: "" }, (product_1.default.extensionsGallery || {}));
        const target = vszip;
        target.zip = exports.tar;
        target.extract = exports.extract;
        target.buffer = exports.buffer;
    };
});
//# sourceMappingURL=marketplace.js.map