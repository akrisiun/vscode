define(["require", "exports", "assert", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/platform", "vs/base/common/extpath", "vs/base/common/strings", "vs/base/common/path"], function (require, exports, assert, resources_1, uri_1, platform_1, extpath_1, strings_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Resources', () => {
        test('distinctParents', () => {
            // Basic
            let resources = [
                uri_1.URI.file('/some/folderA/file.txt'),
                uri_1.URI.file('/some/folderB/file.txt'),
                uri_1.URI.file('/some/folderC/file.txt')
            ];
            let distinct = resources_1.distinctParents(resources, r => r);
            assert.equal(distinct.length, 3);
            assert.equal(distinct[0].toString(), resources[0].toString());
            assert.equal(distinct[1].toString(), resources[1].toString());
            assert.equal(distinct[2].toString(), resources[2].toString());
            // Parent / Child
            resources = [
                uri_1.URI.file('/some/folderA'),
                uri_1.URI.file('/some/folderA/file.txt'),
                uri_1.URI.file('/some/folderA/child/file.txt'),
                uri_1.URI.file('/some/folderA2/file.txt'),
                uri_1.URI.file('/some/file.txt')
            ];
            distinct = resources_1.distinctParents(resources, r => r);
            assert.equal(distinct.length, 3);
            assert.equal(distinct[0].toString(), resources[0].toString());
            assert.equal(distinct[1].toString(), resources[3].toString());
            assert.equal(distinct[2].toString(), resources[4].toString());
        });
        test('dirname', () => {
            if (platform_1.isWindows) {
                assert.equal(resources_1.dirname(uri_1.URI.file('c:\\some\\file\\test.txt')).toString(), 'file:///c%3A/some/file');
                assert.equal(resources_1.dirname(uri_1.URI.file('c:\\some\\file')).toString(), 'file:///c%3A/some');
                assert.equal(resources_1.dirname(uri_1.URI.file('c:\\some\\file\\')).toString(), 'file:///c%3A/some');
                assert.equal(resources_1.dirname(uri_1.URI.file('c:\\some')).toString(), 'file:///c%3A/');
                assert.equal(resources_1.dirname(uri_1.URI.file('C:\\some')).toString(), 'file:///c%3A/');
                assert.equal(resources_1.dirname(uri_1.URI.file('c:\\')).toString(), 'file:///c%3A/');
            }
            else {
                assert.equal(resources_1.dirname(uri_1.URI.file('/some/file/test.txt')).toString(), 'file:///some/file');
                assert.equal(resources_1.dirname(uri_1.URI.file('/some/file/')).toString(), 'file:///some');
                assert.equal(resources_1.dirname(uri_1.URI.file('/some/file')).toString(), 'file:///some');
            }
            assert.equal(resources_1.dirname(uri_1.URI.parse('foo://a/some/file/test.txt')).toString(), 'foo://a/some/file');
            assert.equal(resources_1.dirname(uri_1.URI.parse('foo://a/some/file/')).toString(), 'foo://a/some');
            assert.equal(resources_1.dirname(uri_1.URI.parse('foo://a/some/file')).toString(), 'foo://a/some');
            assert.equal(resources_1.dirname(uri_1.URI.parse('foo://a/some')).toString(), 'foo://a/');
            assert.equal(resources_1.dirname(uri_1.URI.parse('foo://a/')).toString(), 'foo://a/');
            assert.equal(resources_1.dirname(uri_1.URI.parse('foo://a')).toString(), 'foo://a');
            // does not explode (https://github.com/Microsoft/vscode/issues/41987)
            resources_1.dirname(uri_1.URI.from({ scheme: 'file', authority: '/users/someone/portal.h' }));
        });
        test('basename', () => {
            if (platform_1.isWindows) {
                assert.equal(resources_1.basename(uri_1.URI.file('c:\\some\\file\\test.txt')), 'test.txt');
                assert.equal(resources_1.basename(uri_1.URI.file('c:\\some\\file')), 'file');
                assert.equal(resources_1.basename(uri_1.URI.file('c:\\some\\file\\')), 'file');
                assert.equal(resources_1.basename(uri_1.URI.file('C:\\some\\file\\')), 'file');
            }
            else {
                assert.equal(resources_1.basename(uri_1.URI.file('/some/file/test.txt')), 'test.txt');
                assert.equal(resources_1.basename(uri_1.URI.file('/some/file/')), 'file');
                assert.equal(resources_1.basename(uri_1.URI.file('/some/file')), 'file');
                assert.equal(resources_1.basename(uri_1.URI.file('/some')), 'some');
            }
            assert.equal(resources_1.basename(uri_1.URI.parse('foo://a/some/file/test.txt')), 'test.txt');
            assert.equal(resources_1.basename(uri_1.URI.parse('foo://a/some/file/')), 'file');
            assert.equal(resources_1.basename(uri_1.URI.parse('foo://a/some/file')), 'file');
            assert.equal(resources_1.basename(uri_1.URI.parse('foo://a/some')), 'some');
            assert.equal(resources_1.basename(uri_1.URI.parse('foo://a/')), '');
            assert.equal(resources_1.basename(uri_1.URI.parse('foo://a')), '');
        });
        test('joinPath', () => {
            if (platform_1.isWindows) {
                assert.equal(resources_1.joinPath(uri_1.URI.file('c:\\foo\\bar'), '/file.js').toString(), 'file:///c%3A/foo/bar/file.js');
                assert.equal(resources_1.joinPath(uri_1.URI.file('c:\\foo\\bar\\'), 'file.js').toString(), 'file:///c%3A/foo/bar/file.js');
                assert.equal(resources_1.joinPath(uri_1.URI.file('c:\\foo\\bar\\'), '/file.js').toString(), 'file:///c%3A/foo/bar/file.js');
                assert.equal(resources_1.joinPath(uri_1.URI.file('c:\\'), '/file.js').toString(), 'file:///c%3A/file.js');
                assert.equal(resources_1.joinPath(uri_1.URI.file('c:\\'), 'bar/file.js').toString(), 'file:///c%3A/bar/file.js');
                assert.equal(resources_1.joinPath(uri_1.URI.file('c:\\foo'), './file.js').toString(), 'file:///c%3A/foo/file.js');
                assert.equal(resources_1.joinPath(uri_1.URI.file('c:\\foo'), '/./file.js').toString(), 'file:///c%3A/foo/file.js');
                assert.equal(resources_1.joinPath(uri_1.URI.file('C:\\foo'), '../file.js').toString(), 'file:///c%3A/file.js');
                assert.equal(resources_1.joinPath(uri_1.URI.file('C:\\foo\\.'), '../file.js').toString(), 'file:///c%3A/file.js');
            }
            else {
                assert.equal(resources_1.joinPath(uri_1.URI.file('/foo/bar'), '/file.js').toString(), 'file:///foo/bar/file.js');
                assert.equal(resources_1.joinPath(uri_1.URI.file('/foo/bar'), 'file.js').toString(), 'file:///foo/bar/file.js');
                assert.equal(resources_1.joinPath(uri_1.URI.file('/foo/bar/'), '/file.js').toString(), 'file:///foo/bar/file.js');
                assert.equal(resources_1.joinPath(uri_1.URI.file('/'), '/file.js').toString(), 'file:///file.js');
                assert.equal(resources_1.joinPath(uri_1.URI.file('/foo/bar'), './file.js').toString(), 'file:///foo/bar/file.js');
                assert.equal(resources_1.joinPath(uri_1.URI.file('/foo/bar'), '/./file.js').toString(), 'file:///foo/bar/file.js');
                assert.equal(resources_1.joinPath(uri_1.URI.file('/foo/bar'), '../file.js').toString(), 'file:///foo/file.js');
            }
            assert.equal(resources_1.joinPath(uri_1.URI.parse('foo://a/foo/bar'), '/file.js').toString(), 'foo://a/foo/bar/file.js');
            assert.equal(resources_1.joinPath(uri_1.URI.parse('foo://a/foo/bar'), 'file.js').toString(), 'foo://a/foo/bar/file.js');
            assert.equal(resources_1.joinPath(uri_1.URI.parse('foo://a/foo/bar/'), '/file.js').toString(), 'foo://a/foo/bar/file.js');
            assert.equal(resources_1.joinPath(uri_1.URI.parse('foo://a/'), '/file.js').toString(), 'foo://a/file.js');
            assert.equal(resources_1.joinPath(uri_1.URI.parse('foo://a/foo/bar/'), './file.js').toString(), 'foo://a/foo/bar/file.js');
            assert.equal(resources_1.joinPath(uri_1.URI.parse('foo://a/foo/bar/'), '/./file.js').toString(), 'foo://a/foo/bar/file.js');
            assert.equal(resources_1.joinPath(uri_1.URI.parse('foo://a/foo/bar/'), '../file.js').toString(), 'foo://a/foo/file.js');
            assert.equal(resources_1.joinPath(uri_1.URI.from({ scheme: 'myScheme', authority: 'authority', path: '/path', query: 'query', fragment: 'fragment' }), '/file.js').toString(), 'myScheme://authority/path/file.js?query#fragment');
        });
        test('normalizePath', () => {
            if (platform_1.isWindows) {
                assert.equal(resources_1.normalizePath(uri_1.URI.file('c:\\foo\\.\\bar')).toString(), 'file:///c%3A/foo/bar');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('c:\\foo\\.')).toString(), 'file:///c%3A/foo');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('c:\\foo\\.\\')).toString(), 'file:///c%3A/foo/');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('c:\\foo\\..')).toString(), 'file:///c%3A/');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('c:\\foo\\..\\bar')).toString(), 'file:///c%3A/bar');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('c:\\foo\\..\\..\\bar')).toString(), 'file:///c%3A/bar');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('c:\\foo\\foo\\..\\..\\bar')).toString(), 'file:///c%3A/bar');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('C:\\foo\\foo\\.\\..\\..\\bar')).toString(), 'file:///c%3A/bar');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('C:\\foo\\foo\\.\\..\\some\\..\\bar')).toString(), 'file:///c%3A/foo/bar');
            }
            else {
                assert.equal(resources_1.normalizePath(uri_1.URI.file('/foo/./bar')).toString(), 'file:///foo/bar');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('/foo/.')).toString(), 'file:///foo');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('/foo/./')).toString(), 'file:///foo/');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('/foo/..')).toString(), 'file:///');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('/foo/../bar')).toString(), 'file:///bar');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('/foo/../../bar')).toString(), 'file:///bar');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('/foo/foo/../../bar')).toString(), 'file:///bar');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('/foo/foo/./../../bar')).toString(), 'file:///bar');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('/foo/foo/./../some/../bar')).toString(), 'file:///foo/bar');
                assert.equal(resources_1.normalizePath(uri_1.URI.file('/f')).toString(), 'file:///f');
            }
            assert.equal(resources_1.normalizePath(uri_1.URI.parse('foo://a/foo/./bar')).toString(), 'foo://a/foo/bar');
            assert.equal(resources_1.normalizePath(uri_1.URI.parse('foo://a/foo/.')).toString(), 'foo://a/foo');
            assert.equal(resources_1.normalizePath(uri_1.URI.parse('foo://a/foo/./')).toString(), 'foo://a/foo/');
            assert.equal(resources_1.normalizePath(uri_1.URI.parse('foo://a/foo/..')).toString(), 'foo://a/');
            assert.equal(resources_1.normalizePath(uri_1.URI.parse('foo://a/foo/../bar')).toString(), 'foo://a/bar');
            assert.equal(resources_1.normalizePath(uri_1.URI.parse('foo://a/foo/../../bar')).toString(), 'foo://a/bar');
            assert.equal(resources_1.normalizePath(uri_1.URI.parse('foo://a/foo/foo/../../bar')).toString(), 'foo://a/bar');
            assert.equal(resources_1.normalizePath(uri_1.URI.parse('foo://a/foo/foo/./../../bar')).toString(), 'foo://a/bar');
            assert.equal(resources_1.normalizePath(uri_1.URI.parse('foo://a/foo/foo/./../some/../bar')).toString(), 'foo://a/foo/bar');
            assert.equal(resources_1.normalizePath(uri_1.URI.parse('foo://a')).toString(), 'foo://a');
            assert.equal(resources_1.normalizePath(uri_1.URI.parse('foo://a/')).toString(), 'foo://a/');
        });
        test('isAbsolute', () => {
            if (platform_1.isWindows) {
                assert.equal(resources_1.isAbsolutePath(uri_1.URI.file('c:\\foo\\')), true);
                assert.equal(resources_1.isAbsolutePath(uri_1.URI.file('C:\\foo\\')), true);
                assert.equal(resources_1.isAbsolutePath(uri_1.URI.file('bar')), true); // URI normalizes all file URIs to be absolute
            }
            else {
                assert.equal(resources_1.isAbsolutePath(uri_1.URI.file('/foo/bar')), true);
                assert.equal(resources_1.isAbsolutePath(uri_1.URI.file('bar')), true); // URI normalizes all file URIs to be absolute
            }
            assert.equal(resources_1.isAbsolutePath(uri_1.URI.parse('foo:foo')), false);
            assert.equal(resources_1.isAbsolutePath(uri_1.URI.parse('foo://a/foo/.')), true);
        });
        function assertTrailingSeparator(u1, expected) {
            assert.equal(resources_1.hasTrailingPathSeparator(u1), expected, u1.toString());
        }
        function assertRemoveTrailingSeparator(u1, expected) {
            assertEqualURI(resources_1.removeTrailingPathSeparator(u1), expected, u1.toString());
        }
        function assertAddTrailingSeparator(u1, expected) {
            assertEqualURI(resources_1.addTrailingPathSeparator(u1), expected, u1.toString());
        }
        test('trailingPathSeparator', () => {
            assertTrailingSeparator(uri_1.URI.parse('foo://a/foo'), false);
            assertTrailingSeparator(uri_1.URI.parse('foo://a/foo/'), true);
            assertTrailingSeparator(uri_1.URI.parse('foo://a/'), false);
            assertTrailingSeparator(uri_1.URI.parse('foo://a'), false);
            assertRemoveTrailingSeparator(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://a/foo'));
            assertRemoveTrailingSeparator(uri_1.URI.parse('foo://a/foo/'), uri_1.URI.parse('foo://a/foo'));
            assertRemoveTrailingSeparator(uri_1.URI.parse('foo://a/'), uri_1.URI.parse('foo://a/'));
            assertRemoveTrailingSeparator(uri_1.URI.parse('foo://a'), uri_1.URI.parse('foo://a'));
            assertAddTrailingSeparator(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://a/foo/'));
            assertAddTrailingSeparator(uri_1.URI.parse('foo://a/foo/'), uri_1.URI.parse('foo://a/foo/'));
            assertAddTrailingSeparator(uri_1.URI.parse('foo://a/'), uri_1.URI.parse('foo://a/'));
            assertAddTrailingSeparator(uri_1.URI.parse('foo://a'), uri_1.URI.parse('foo://a/'));
            if (platform_1.isWindows) {
                assertTrailingSeparator(uri_1.URI.file('c:\\a\\foo'), false);
                assertTrailingSeparator(uri_1.URI.file('c:\\a\\foo\\'), true);
                assertTrailingSeparator(uri_1.URI.file('c:\\'), false);
                assertTrailingSeparator(uri_1.URI.file('\\\\server\\share\\some\\'), true);
                assertTrailingSeparator(uri_1.URI.file('\\\\server\\share\\'), false);
                assertRemoveTrailingSeparator(uri_1.URI.file('c:\\a\\foo'), uri_1.URI.file('c:\\a\\foo'));
                assertRemoveTrailingSeparator(uri_1.URI.file('c:\\a\\foo\\'), uri_1.URI.file('c:\\a\\foo'));
                assertRemoveTrailingSeparator(uri_1.URI.file('c:\\'), uri_1.URI.file('c:\\'));
                assertRemoveTrailingSeparator(uri_1.URI.file('\\\\server\\share\\some\\'), uri_1.URI.file('\\\\server\\share\\some'));
                assertRemoveTrailingSeparator(uri_1.URI.file('\\\\server\\share\\'), uri_1.URI.file('\\\\server\\share\\'));
                assertAddTrailingSeparator(uri_1.URI.file('c:\\a\\foo'), uri_1.URI.file('c:\\a\\foo\\'));
                assertAddTrailingSeparator(uri_1.URI.file('c:\\a\\foo\\'), uri_1.URI.file('c:\\a\\foo\\'));
                assertAddTrailingSeparator(uri_1.URI.file('c:\\'), uri_1.URI.file('c:\\'));
                assertAddTrailingSeparator(uri_1.URI.file('\\\\server\\share\\some'), uri_1.URI.file('\\\\server\\share\\some\\'));
                assertAddTrailingSeparator(uri_1.URI.file('\\\\server\\share\\some\\'), uri_1.URI.file('\\\\server\\share\\some\\'));
            }
            else {
                assertTrailingSeparator(uri_1.URI.file('/foo/bar'), false);
                assertTrailingSeparator(uri_1.URI.file('/foo/bar/'), true);
                assertTrailingSeparator(uri_1.URI.file('/'), false);
                assertRemoveTrailingSeparator(uri_1.URI.file('/foo/bar'), uri_1.URI.file('/foo/bar'));
                assertRemoveTrailingSeparator(uri_1.URI.file('/foo/bar/'), uri_1.URI.file('/foo/bar'));
                assertRemoveTrailingSeparator(uri_1.URI.file('/'), uri_1.URI.file('/'));
                assertAddTrailingSeparator(uri_1.URI.file('/foo/bar'), uri_1.URI.file('/foo/bar/'));
                assertAddTrailingSeparator(uri_1.URI.file('/foo/bar/'), uri_1.URI.file('/foo/bar/'));
                assertAddTrailingSeparator(uri_1.URI.file('/'), uri_1.URI.file('/'));
            }
        });
        function assertEqualURI(actual, expected, message) {
            if (!resources_1.isEqual(expected, actual)) {
                assert.equal(actual.toString(), expected.toString(), message);
            }
        }
        function assertRelativePath(u1, u2, expectedPath, ignoreJoin, ignoreCase) {
            assert.equal(resources_1.relativePath(u1, u2, ignoreCase), expectedPath, `from ${u1.toString()} to ${u2.toString()}`);
            if (expectedPath !== undefined && !ignoreJoin) {
                assertEqualURI(resources_1.removeTrailingPathSeparator(resources_1.joinPath(u1, expectedPath)), resources_1.removeTrailingPathSeparator(u2), 'joinPath on relativePath should be equal');
            }
        }
        test('relativePath', () => {
            assertRelativePath(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://a/foo/bar'), 'bar');
            assertRelativePath(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://a/foo/bar/'), 'bar');
            assertRelativePath(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://a/foo/bar/goo'), 'bar/goo');
            assertRelativePath(uri_1.URI.parse('foo://a/'), uri_1.URI.parse('foo://a/foo/bar/goo'), 'foo/bar/goo');
            assertRelativePath(uri_1.URI.parse('foo://a/foo/xoo'), uri_1.URI.parse('foo://a/foo/bar'), '../bar');
            assertRelativePath(uri_1.URI.parse('foo://a/foo/xoo/yoo'), uri_1.URI.parse('foo://a'), '../../..');
            assertRelativePath(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://a/foo/'), '');
            assertRelativePath(uri_1.URI.parse('foo://a/foo/'), uri_1.URI.parse('foo://a/foo'), '');
            assertRelativePath(uri_1.URI.parse('foo://a/foo/'), uri_1.URI.parse('foo://a/foo/'), '');
            assertRelativePath(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://a/foo'), '');
            assertRelativePath(uri_1.URI.parse('foo://a'), uri_1.URI.parse('foo://a'), '');
            assertRelativePath(uri_1.URI.parse('foo://a/'), uri_1.URI.parse('foo://a/'), '');
            assertRelativePath(uri_1.URI.parse('foo://a/'), uri_1.URI.parse('foo://a'), '');
            assertRelativePath(uri_1.URI.parse('foo://a/foo?q'), uri_1.URI.parse('foo://a/foo/bar#h'), 'bar');
            assertRelativePath(uri_1.URI.parse('foo://'), uri_1.URI.parse('foo://a/b'), undefined);
            assertRelativePath(uri_1.URI.parse('foo://a2/b'), uri_1.URI.parse('foo://a/b'), undefined);
            assertRelativePath(uri_1.URI.parse('goo://a/b'), uri_1.URI.parse('foo://a/b'), undefined);
            assertRelativePath(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://A/FOO/bar/goo'), 'bar/goo', false, true);
            assertRelativePath(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://A/FOO/BAR/GOO'), 'BAR/GOO', false, true);
            assertRelativePath(uri_1.URI.parse('foo://a/foo/xoo'), uri_1.URI.parse('foo://A/FOO/BAR/GOO'), '../BAR/GOO', false, true);
            assertRelativePath(uri_1.URI.parse('foo:///c:/a/foo'), uri_1.URI.parse('foo:///C:/a/foo/xoo/'), 'xoo', false, true);
            if (platform_1.isWindows) {
                assertRelativePath(uri_1.URI.file('c:\\foo\\bar'), uri_1.URI.file('c:\\foo\\bar'), '');
                assertRelativePath(uri_1.URI.file('c:\\foo\\bar\\huu'), uri_1.URI.file('c:\\foo\\bar'), '..');
                assertRelativePath(uri_1.URI.file('c:\\foo\\bar\\a1\\a2'), uri_1.URI.file('c:\\foo\\bar'), '../..');
                assertRelativePath(uri_1.URI.file('c:\\foo\\bar\\'), uri_1.URI.file('c:\\foo\\bar\\a1\\a2'), 'a1/a2');
                assertRelativePath(uri_1.URI.file('c:\\foo\\bar\\'), uri_1.URI.file('c:\\foo\\bar\\a1\\a2\\'), 'a1/a2');
                assertRelativePath(uri_1.URI.file('c:\\'), uri_1.URI.file('c:\\foo\\bar'), 'foo/bar');
                assertRelativePath(uri_1.URI.file('\\\\server\\share\\some\\'), uri_1.URI.file('\\\\server\\share\\some\\path'), 'path');
                assertRelativePath(uri_1.URI.file('\\\\server\\share\\some\\'), uri_1.URI.file('\\\\server\\share2\\some\\path'), '../../share2/some/path', true); // ignore joinPath assert: path.join is not root aware
            }
            else {
                assertRelativePath(uri_1.URI.file('/a/foo'), uri_1.URI.file('/a/foo/bar'), 'bar');
                assertRelativePath(uri_1.URI.file('/a/foo'), uri_1.URI.file('/a/foo/bar/'), 'bar');
                assertRelativePath(uri_1.URI.file('/a/foo'), uri_1.URI.file('/a/foo/bar/goo'), 'bar/goo');
                assertRelativePath(uri_1.URI.file('/a/'), uri_1.URI.file('/a/foo/bar/goo'), 'foo/bar/goo');
                assertRelativePath(uri_1.URI.file('/'), uri_1.URI.file('/a/foo/bar/goo'), 'a/foo/bar/goo');
                assertRelativePath(uri_1.URI.file('/a/foo/xoo'), uri_1.URI.file('/a/foo/bar'), '../bar');
                assertRelativePath(uri_1.URI.file('/a/foo/xoo/yoo'), uri_1.URI.file('/a'), '../../..');
                assertRelativePath(uri_1.URI.file('/a/foo'), uri_1.URI.file('/a/foo/'), '');
                assertRelativePath(uri_1.URI.file('/a/foo'), uri_1.URI.file('/b/foo/'), '../../b/foo');
            }
        });
        function assertResolve(u1, path, expected) {
            const actual = resources_1.resolvePath(u1, path);
            assertEqualURI(actual, expected, `from ${u1.toString()} and ${path}`);
            if (!path_1.isAbsolute(path)) {
                let expectedPath = platform_1.isWindows ? extpath_1.toSlashes(path) : path;
                expectedPath = strings_1.startsWith(expectedPath, './') ? expectedPath.substr(2) : expectedPath;
                assert.equal(resources_1.relativePath(u1, actual), expectedPath, `relativePath (${u1.toString()}) on actual (${actual.toString()}) should be to path (${expectedPath})`);
            }
        }
        test('resolve', () => {
            if (platform_1.isWindows) {
                assertResolve(uri_1.URI.file('c:\\foo\\bar'), 'file.js', uri_1.URI.file('c:\\foo\\bar\\file.js'));
                assertResolve(uri_1.URI.file('c:\\foo\\bar'), 't\\file.js', uri_1.URI.file('c:\\foo\\bar\\t\\file.js'));
                assertResolve(uri_1.URI.file('c:\\foo\\bar'), '.\\t\\file.js', uri_1.URI.file('c:\\foo\\bar\\t\\file.js'));
                assertResolve(uri_1.URI.file('c:\\foo\\bar'), 'a1/file.js', uri_1.URI.file('c:\\foo\\bar\\a1\\file.js'));
                assertResolve(uri_1.URI.file('c:\\foo\\bar'), './a1/file.js', uri_1.URI.file('c:\\foo\\bar\\a1\\file.js'));
                assertResolve(uri_1.URI.file('c:\\foo\\bar'), '\\b1\\file.js', uri_1.URI.file('c:\\b1\\file.js'));
                assertResolve(uri_1.URI.file('c:\\foo\\bar'), '/b1/file.js', uri_1.URI.file('c:\\b1\\file.js'));
                assertResolve(uri_1.URI.file('c:\\foo\\bar\\'), 'file.js', uri_1.URI.file('c:\\foo\\bar\\file.js'));
                assertResolve(uri_1.URI.file('c:\\'), 'file.js', uri_1.URI.file('c:\\file.js'));
                assertResolve(uri_1.URI.file('c:\\'), '\\b1\\file.js', uri_1.URI.file('c:\\b1\\file.js'));
                assertResolve(uri_1.URI.file('c:\\'), '/b1/file.js', uri_1.URI.file('c:\\b1\\file.js'));
                assertResolve(uri_1.URI.file('c:\\'), 'd:\\foo\\bar.txt', uri_1.URI.file('d:\\foo\\bar.txt'));
                assertResolve(uri_1.URI.file('\\\\server\\share\\some\\'), 'b1\\file.js', uri_1.URI.file('\\\\server\\share\\some\\b1\\file.js'));
                assertResolve(uri_1.URI.file('\\\\server\\share\\some\\'), '\\file.js', uri_1.URI.file('\\\\server\\share\\file.js'));
                assertResolve(uri_1.URI.file('c:\\'), '\\\\server\\share\\some\\', uri_1.URI.file('\\\\server\\share\\some'));
                assertResolve(uri_1.URI.file('\\\\server\\share\\some\\'), 'c:\\', uri_1.URI.file('c:\\'));
            }
            else {
                assertResolve(uri_1.URI.file('/foo/bar'), 'file.js', uri_1.URI.file('/foo/bar/file.js'));
                assertResolve(uri_1.URI.file('/foo/bar'), './file.js', uri_1.URI.file('/foo/bar/file.js'));
                assertResolve(uri_1.URI.file('/foo/bar'), '/file.js', uri_1.URI.file('/file.js'));
                assertResolve(uri_1.URI.file('/foo/bar/'), 'file.js', uri_1.URI.file('/foo/bar/file.js'));
                assertResolve(uri_1.URI.file('/'), 'file.js', uri_1.URI.file('/file.js'));
                assertResolve(uri_1.URI.file(''), './file.js', uri_1.URI.file('/file.js'));
                assertResolve(uri_1.URI.file(''), '/file.js', uri_1.URI.file('/file.js'));
            }
            assertResolve(uri_1.URI.parse('foo://server/foo/bar'), 'file.js', uri_1.URI.parse('foo://server/foo/bar/file.js'));
            assertResolve(uri_1.URI.parse('foo://server/foo/bar'), './file.js', uri_1.URI.parse('foo://server/foo/bar/file.js'));
            assertResolve(uri_1.URI.parse('foo://server/foo/bar'), './file.js', uri_1.URI.parse('foo://server/foo/bar/file.js'));
        });
        test('isEqual', () => {
            let fileURI = platform_1.isWindows ? uri_1.URI.file('c:\\foo\\bar') : uri_1.URI.file('/foo/bar');
            let fileURI2 = platform_1.isWindows ? uri_1.URI.file('C:\\foo\\Bar') : uri_1.URI.file('/foo/Bar');
            assert.equal(resources_1.isEqual(fileURI, fileURI, true), true);
            assert.equal(resources_1.isEqual(fileURI, fileURI, false), true);
            assert.equal(resources_1.isEqual(fileURI, fileURI, resources_1.hasToIgnoreCase(fileURI)), true);
            assert.equal(resources_1.isEqual(fileURI, fileURI2, true), true);
            assert.equal(resources_1.isEqual(fileURI, fileURI2, false), false);
            let fileURI3 = uri_1.URI.parse('foo://server:453/foo/bar');
            let fileURI4 = uri_1.URI.parse('foo://server:453/foo/Bar');
            assert.equal(resources_1.isEqual(fileURI3, fileURI3, true), true);
            assert.equal(resources_1.isEqual(fileURI3, fileURI3, false), true);
            assert.equal(resources_1.isEqual(fileURI3, fileURI3, resources_1.hasToIgnoreCase(fileURI3)), true);
            assert.equal(resources_1.isEqual(fileURI3, fileURI4, true), true);
            assert.equal(resources_1.isEqual(fileURI3, fileURI4, false), false);
            assert.equal(resources_1.isEqual(fileURI, fileURI3, true), false);
            assert.equal(resources_1.isEqual(uri_1.URI.parse('foo://server'), uri_1.URI.parse('foo://server/')), true);
        });
        test('isEqualOrParent', () => {
            let fileURI = platform_1.isWindows ? uri_1.URI.file('c:\\foo\\bar') : uri_1.URI.file('/foo/bar');
            let fileURI2 = platform_1.isWindows ? uri_1.URI.file('c:\\foo') : uri_1.URI.file('/foo');
            let fileURI2b = platform_1.isWindows ? uri_1.URI.file('C:\\Foo\\') : uri_1.URI.file('/Foo/');
            assert.equal(resources_1.isEqualOrParent(fileURI, fileURI, true), true, '1');
            assert.equal(resources_1.isEqualOrParent(fileURI, fileURI, false), true, '2');
            assert.equal(resources_1.isEqualOrParent(fileURI, fileURI2, true), true, '3');
            assert.equal(resources_1.isEqualOrParent(fileURI, fileURI2, false), true, '4');
            assert.equal(resources_1.isEqualOrParent(fileURI, fileURI2b, true), true, '5');
            assert.equal(resources_1.isEqualOrParent(fileURI, fileURI2b, false), false, '6');
            assert.equal(resources_1.isEqualOrParent(fileURI2, fileURI, false), false, '7');
            assert.equal(resources_1.isEqualOrParent(fileURI2b, fileURI2, true), true, '8');
            let fileURI3 = uri_1.URI.parse('foo://server:453/foo/bar/goo');
            let fileURI4 = uri_1.URI.parse('foo://server:453/foo/');
            let fileURI5 = uri_1.URI.parse('foo://server:453/foo');
            assert.equal(resources_1.isEqualOrParent(fileURI3, fileURI3, true), true, '11');
            assert.equal(resources_1.isEqualOrParent(fileURI3, fileURI3, false), true, '12');
            assert.equal(resources_1.isEqualOrParent(fileURI3, fileURI4, true), true, '13');
            assert.equal(resources_1.isEqualOrParent(fileURI3, fileURI4, false), true, '14');
            assert.equal(resources_1.isEqualOrParent(fileURI3, fileURI, true), false, '15');
            assert.equal(resources_1.isEqualOrParent(fileURI5, fileURI5, true), true, '16');
        });
    });
});
//# sourceMappingURL=resources.test.js.map