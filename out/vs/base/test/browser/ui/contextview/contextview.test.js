/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/contextview/contextview"], function (require, exports, assert, contextview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Contextview', function () {
        test('layout', () => {
            assert.equal(contextview_1.layout(200, 20, { offset: 0, size: 0, position: 0 /* Before */ }), 0);
            assert.equal(contextview_1.layout(200, 20, { offset: 50, size: 0, position: 0 /* Before */ }), 50);
            assert.equal(contextview_1.layout(200, 20, { offset: 200, size: 0, position: 0 /* Before */ }), 180);
            assert.equal(contextview_1.layout(200, 20, { offset: 0, size: 0, position: 1 /* After */ }), 0);
            assert.equal(contextview_1.layout(200, 20, { offset: 50, size: 0, position: 1 /* After */ }), 30);
            assert.equal(contextview_1.layout(200, 20, { offset: 200, size: 0, position: 1 /* After */ }), 180);
            assert.equal(contextview_1.layout(200, 20, { offset: 0, size: 50, position: 0 /* Before */ }), 50);
            assert.equal(contextview_1.layout(200, 20, { offset: 50, size: 50, position: 0 /* Before */ }), 100);
            assert.equal(contextview_1.layout(200, 20, { offset: 150, size: 50, position: 0 /* Before */ }), 130);
            assert.equal(contextview_1.layout(200, 20, { offset: 0, size: 50, position: 1 /* After */ }), 50);
            assert.equal(contextview_1.layout(200, 20, { offset: 50, size: 50, position: 1 /* After */ }), 30);
            assert.equal(contextview_1.layout(200, 20, { offset: 150, size: 50, position: 1 /* After */ }), 130);
        });
    });
});
//# sourceMappingURL=contextview.test.js.map