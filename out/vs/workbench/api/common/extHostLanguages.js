/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHost.protocol"], function (require, exports, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostLanguages {
        constructor(mainContext, documents) {
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadLanguages);
            this._documents = documents;
        }
        getLanguages() {
            return this._proxy.$getLanguages();
        }
        changeLanguage(uri, languageId) {
            return this._proxy.$changeLanguage(uri, languageId).then(() => {
                const data = this._documents.getDocumentData(uri);
                return data ? data.document : undefined;
            });
        }
    }
    exports.ExtHostLanguages = ExtHostLanguages;
});
//# sourceMappingURL=extHostLanguages.js.map