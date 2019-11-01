define(["require", "exports", "assert", "vs/base/common/mime", "vs/base/common/uri"], function (require, exports, assert, mime_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Mime', () => {
        test('Dynamically Register Text Mime', () => {
            let guess = mime_1.guessMimeTypes(uri_1.URI.file('foo.monaco'));
            assert.deepEqual(guess, ['application/unknown']);
            mime_1.registerTextMime({ id: 'monaco', extension: '.monaco', mime: 'text/monaco' });
            guess = mime_1.guessMimeTypes(uri_1.URI.file('foo.monaco'));
            assert.deepEqual(guess, ['text/monaco', 'text/plain']);
            guess = mime_1.guessMimeTypes(uri_1.URI.file('.monaco'));
            assert.deepEqual(guess, ['text/monaco', 'text/plain']);
            mime_1.registerTextMime({ id: 'codefile', filename: 'Codefile', mime: 'text/code' });
            guess = mime_1.guessMimeTypes(uri_1.URI.file('Codefile'));
            assert.deepEqual(guess, ['text/code', 'text/plain']);
            guess = mime_1.guessMimeTypes(uri_1.URI.file('foo.Codefile'));
            assert.deepEqual(guess, ['application/unknown']);
            mime_1.registerTextMime({ id: 'docker', filepattern: 'Docker*', mime: 'text/docker' });
            guess = mime_1.guessMimeTypes(uri_1.URI.file('Docker-debug'));
            assert.deepEqual(guess, ['text/docker', 'text/plain']);
            guess = mime_1.guessMimeTypes(uri_1.URI.file('docker-PROD'));
            assert.deepEqual(guess, ['text/docker', 'text/plain']);
            mime_1.registerTextMime({ id: 'niceregex', mime: 'text/nice-regex', firstline: /RegexesAreNice/ });
            guess = mime_1.guessMimeTypes(uri_1.URI.file('Randomfile.noregistration'), 'RegexesAreNice');
            assert.deepEqual(guess, ['text/nice-regex', 'text/plain']);
            guess = mime_1.guessMimeTypes(uri_1.URI.file('Randomfile.noregistration'), 'RegexesAreNotNice');
            assert.deepEqual(guess, ['application/unknown']);
            guess = mime_1.guessMimeTypes(uri_1.URI.file('Codefile'), 'RegexesAreNice');
            assert.deepEqual(guess, ['text/code', 'text/plain']);
        });
        test('Mimes Priority', () => {
            mime_1.registerTextMime({ id: 'monaco', extension: '.monaco', mime: 'text/monaco' });
            mime_1.registerTextMime({ id: 'foobar', mime: 'text/foobar', firstline: /foobar/ });
            let guess = mime_1.guessMimeTypes(uri_1.URI.file('foo.monaco'));
            assert.deepEqual(guess, ['text/monaco', 'text/plain']);
            guess = mime_1.guessMimeTypes(uri_1.URI.file('foo.monaco'), 'foobar');
            assert.deepEqual(guess, ['text/monaco', 'text/plain']);
            mime_1.registerTextMime({ id: 'docker', filename: 'dockerfile', mime: 'text/winner' });
            mime_1.registerTextMime({ id: 'docker', filepattern: 'dockerfile*', mime: 'text/looser' });
            guess = mime_1.guessMimeTypes(uri_1.URI.file('dockerfile'));
            assert.deepEqual(guess, ['text/winner', 'text/plain']);
            mime_1.registerTextMime({ id: 'azure-looser', mime: 'text/azure-looser', firstline: /azure/ });
            mime_1.registerTextMime({ id: 'azure-winner', mime: 'text/azure-winner', firstline: /azure/ });
            guess = mime_1.guessMimeTypes(uri_1.URI.file('azure'), 'azure');
            assert.deepEqual(guess, ['text/azure-winner', 'text/plain']);
        });
        test('Specificity priority 1', () => {
            mime_1.registerTextMime({ id: 'monaco2', extension: '.monaco2', mime: 'text/monaco2' });
            mime_1.registerTextMime({ id: 'monaco2', filename: 'specific.monaco2', mime: 'text/specific-monaco2' });
            assert.deepEqual(mime_1.guessMimeTypes(uri_1.URI.file('specific.monaco2')), ['text/specific-monaco2', 'text/plain']);
            assert.deepEqual(mime_1.guessMimeTypes(uri_1.URI.file('foo.monaco2')), ['text/monaco2', 'text/plain']);
        });
        test('Specificity priority 2', () => {
            mime_1.registerTextMime({ id: 'monaco3', filename: 'specific.monaco3', mime: 'text/specific-monaco3' });
            mime_1.registerTextMime({ id: 'monaco3', extension: '.monaco3', mime: 'text/monaco3' });
            assert.deepEqual(mime_1.guessMimeTypes(uri_1.URI.file('specific.monaco3')), ['text/specific-monaco3', 'text/plain']);
            assert.deepEqual(mime_1.guessMimeTypes(uri_1.URI.file('foo.monaco3')), ['text/monaco3', 'text/plain']);
        });
        test('Mimes Priority - Longest Extension wins', () => {
            mime_1.registerTextMime({ id: 'monaco', extension: '.monaco', mime: 'text/monaco' });
            mime_1.registerTextMime({ id: 'monaco', extension: '.monaco.xml', mime: 'text/monaco-xml' });
            mime_1.registerTextMime({ id: 'monaco', extension: '.monaco.xml.build', mime: 'text/monaco-xml-build' });
            let guess = mime_1.guessMimeTypes(uri_1.URI.file('foo.monaco'));
            assert.deepEqual(guess, ['text/monaco', 'text/plain']);
            guess = mime_1.guessMimeTypes(uri_1.URI.file('foo.monaco.xml'));
            assert.deepEqual(guess, ['text/monaco-xml', 'text/plain']);
            guess = mime_1.guessMimeTypes(uri_1.URI.file('foo.monaco.xml.build'));
            assert.deepEqual(guess, ['text/monaco-xml-build', 'text/plain']);
        });
        test('Mimes Priority - User configured wins', () => {
            mime_1.registerTextMime({ id: 'monaco', extension: '.monaco.xnl', mime: 'text/monaco', userConfigured: true });
            mime_1.registerTextMime({ id: 'monaco', extension: '.monaco.xml', mime: 'text/monaco-xml' });
            let guess = mime_1.guessMimeTypes(uri_1.URI.file('foo.monaco.xnl'));
            assert.deepEqual(guess, ['text/monaco', 'text/plain']);
        });
        test('Mimes Priority - Pattern matches on path if specified', () => {
            mime_1.registerTextMime({ id: 'monaco', filepattern: '**/dot.monaco.xml', mime: 'text/monaco' });
            mime_1.registerTextMime({ id: 'other', filepattern: '*ot.other.xml', mime: 'text/other' });
            let guess = mime_1.guessMimeTypes(uri_1.URI.file('/some/path/dot.monaco.xml'));
            assert.deepEqual(guess, ['text/monaco', 'text/plain']);
        });
        test('Mimes Priority - Last registered mime wins', () => {
            mime_1.registerTextMime({ id: 'monaco', filepattern: '**/dot.monaco.xml', mime: 'text/monaco' });
            mime_1.registerTextMime({ id: 'other', filepattern: '**/dot.monaco.xml', mime: 'text/other' });
            let guess = mime_1.guessMimeTypes(uri_1.URI.file('/some/path/dot.monaco.xml'));
            assert.deepEqual(guess, ['text/other', 'text/plain']);
        });
        test('Data URIs', () => {
            mime_1.registerTextMime({ id: 'data', extension: '.data', mime: 'text/data' });
            assert.deepEqual(mime_1.guessMimeTypes(uri_1.URI.parse(`data:;label:something.data;description:data,`)), ['text/data', 'text/plain']);
        });
        test('Filename Suggestion - Suggest prefix only when there are no relevant extensions', () => {
            const id = 'plumbus0';
            const mime = `text/${id}`;
            for (let extension of ['one', 'two']) {
                mime_1.registerTextMime({ id, mime, extension });
            }
            let suggested = mime_1.suggestFilename('shleem', 'Untitled-1');
            assert.equal(suggested, 'Untitled-1');
        });
        test('Filename Suggestion - Suggest prefix with first extension that begins with a dot', () => {
            const id = 'plumbus1';
            const mime = `text/${id}`;
            for (let extension of ['plumbus', '.shleem', '.gazorpazorp']) {
                mime_1.registerTextMime({ id, mime, extension });
            }
            let suggested = mime_1.suggestFilename('plumbus1', 'Untitled-1');
            assert.equal(suggested, 'Untitled-1.shleem');
        });
        test('Filename Suggestion - Suggest first relevant extension when there are none that begin with a dot', () => {
            const id = 'plumbus2';
            const mime = `text/${id}`;
            for (let extension of ['plumbus', 'shleem', 'gazorpazorp']) {
                mime_1.registerTextMime({ id, mime, extension });
            }
            let suggested = mime_1.suggestFilename('plumbus2', 'Untitled-1');
            assert.equal(suggested, 'plumbus');
        });
        test('Filename Suggestion - Should ignore user-configured associations', () => {
            mime_1.registerTextMime({ id: 'plumbus3', mime: 'text/plumbus3', extension: 'plumbus', userConfigured: true });
            mime_1.registerTextMime({ id: 'plumbus3', mime: 'text/plumbus3', extension: '.shleem', userConfigured: true });
            mime_1.registerTextMime({ id: 'plumbus3', mime: 'text/plumbus3', extension: '.gazorpazorp', userConfigured: false });
            let suggested = mime_1.suggestFilename('plumbus3', 'Untitled-1');
            assert.equal(suggested, 'Untitled-1.gazorpazorp');
            mime_1.registerTextMime({ id: 'plumbus4', mime: 'text/plumbus4', extension: 'plumbus', userConfigured: true });
            mime_1.registerTextMime({ id: 'plumbus4', mime: 'text/plumbus4', extension: '.shleem', userConfigured: true });
            mime_1.registerTextMime({ id: 'plumbus4', mime: 'text/plumbus4', extension: '.gazorpazorp', userConfigured: true });
            suggested = mime_1.suggestFilename('plumbus4', 'Untitled-1');
            assert.equal(suggested, 'Untitled-1');
        });
    });
});
//# sourceMappingURL=mime.test.js.map