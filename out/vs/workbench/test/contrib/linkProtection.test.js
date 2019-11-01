/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/url/common/trustedDomainsValidator", "vs/base/common/uri"], function (require, exports, assert, trustedDomainsValidator_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Link protection domain matching', () => {
        test('simple', () => {
            assert.ok(!trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://x.org'), []));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://x.org'), ['https://x.org']));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://x.org/foo'), ['https://x.org']));
            assert.ok(!trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://x.org'), ['http://x.org']));
            assert.ok(!trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('http://x.org'), ['https://x.org']));
            assert.ok(!trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://www.x.org'), ['https://x.org']));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://www.x.org'), ['https://www.x.org', 'https://y.org']));
        });
        test('localhost', () => {
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://127.0.0.1'), []));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://127.0.0.1:3000'), []));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://localhost'), []));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://localhost:3000'), []));
        });
        test('* star', () => {
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://a.x.org'), ['https://*.x.org']));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://a.b.x.org'), ['https://*.x.org']));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://a.x.org'), ['https://a.x.*']));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://a.x.org'), ['https://a.*.org']));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://a.x.org'), ['https://*.*.org']));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://a.b.x.org'), ['https://*.b.*.org']));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://a.a.b.x.org'), ['https://*.b.*.org']));
        });
        test('no scheme', () => {
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://a.x.org'), ['a.x.org']));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://a.x.org'), ['*.x.org']));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://a.b.x.org'), ['*.x.org']));
            assert.ok(trustedDomainsValidator_1.isURLDomainTrusted(uri_1.URI.parse('https://x.org'), ['*.x.org']));
        });
    });
});
//# sourceMappingURL=linkProtection.test.js.map