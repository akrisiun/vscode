/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHost.protocol"], function (require, exports, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLanguages = void 0;
    class ExtHostLanguages {
        constructor(mainContext, documents) {
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadLanguages);
            this._documents = documents;
        }
        getLanguages() {
            return this._proxy.$getLanguages();
        }
        async changeLanguage(uri, languageId) {
            await this._proxy.$changeLanguage(uri, languageId);
            const data = this._documents.getDocumentData(uri);
            if (!data) {
                throw new Error(`document '${uri.toString}' NOT found`);
            }
            return data.document;
        }
    }
    exports.ExtHostLanguages = ExtHostLanguages;
});
//# sourceMappingURL=extHostLanguages.js.map