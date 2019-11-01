define(["require", "exports", "vs/base/common/uri", "vs/workbench/contrib/webview/common/resourceLoader"], function (require, exports, uri_1, resourceLoader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function registerFileProtocol(contents, protocol, fileService, extensionLocation, getRoots) {
        contents.session.protocol.registerBufferProtocol(protocol, async (request, callback) => {
            try {
                const result = await resourceLoader_1.loadLocalResource(uri_1.URI.parse(request.url), fileService, extensionLocation, getRoots);
                if (result.type === 'success') {
                    return callback({
                        data: Buffer.from(result.data.buffer),
                        mimeType: result.mimeType
                    });
                }
                if (result.type === 'access-denied') {
                    console.error('Webview: Cannot load resource outside of protocol root');
                    return callback({ error: -10 /* ACCESS_DENIED: https://cs.chromium.org/chromium/src/net/base/net_error_list.h */ });
                }
            }
            catch (_a) {
                // noop
            }
            return callback({ error: -2 /* FAILED: https://cs.chromium.org/chromium/src/net/base/net_error_list.h */ });
        }, (error) => {
            if (error) {
                console.error(`Failed to register '${protocol}' protocol`);
            }
        });
    }
    exports.registerFileProtocol = registerFileProtocol;
});
//# sourceMappingURL=webviewProtocols.js.map