define(["require", "exports", "assert", "vs/base/common/path", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/environment/common/environment", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/search/common/queryBuilder", "vs/workbench/test/workbenchTestServices", "vs/base/common/platform"], function (require, exports, assert, path_1, uri_1, configuration_1, testConfigurationService_1, environment_1, instantiationServiceMock_1, workspace_1, queryBuilder_1, workbenchTestServices_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const DEFAULT_EDITOR_CONFIG = {};
    const DEFAULT_USER_CONFIG = { useRipgrep: true, useIgnoreFiles: true, useGlobalIgnoreFiles: true };
    const DEFAULT_QUERY_PROPS = {};
    const DEFAULT_TEXT_QUERY_PROPS = { usePCRE2: false };
    suite('QueryBuilder', () => {
        const PATTERN_INFO = { pattern: 'a' };
        const ROOT_1 = fixPath('/foo/root1');
        const ROOT_1_URI = getUri(ROOT_1);
        const WS_CONFIG_PATH = getUri('/bar/test.code-workspace'); // location of the workspace file (not important except that it is a file URI)
        let instantiationService;
        let queryBuilder;
        let mockConfigService;
        let mockContextService;
        let mockWorkspace;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            mockConfigService = new testConfigurationService_1.TestConfigurationService();
            mockConfigService.setUserConfiguration('search', DEFAULT_USER_CONFIG);
            mockConfigService.setUserConfiguration('editor', DEFAULT_EDITOR_CONFIG);
            instantiationService.stub(configuration_1.IConfigurationService, mockConfigService);
            mockContextService = new workbenchTestServices_1.TestContextService();
            mockWorkspace = new workspace_1.Workspace('workspace', [workspace_1.toWorkspaceFolder(ROOT_1_URI)]);
            mockContextService.setWorkspace(mockWorkspace);
            instantiationService.stub(workspace_1.IWorkspaceContextService, mockContextService);
            instantiationService.stub(environment_1.IEnvironmentService, workbenchTestServices_1.TestEnvironmentService);
            queryBuilder = instantiationService.createInstance(queryBuilder_1.QueryBuilder);
        });
        test('simple text pattern', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO), {
                folderQueries: [],
                contentPattern: PATTERN_INFO,
                type: 2 /* Text */
            });
        });
        test('normalize literal newlines', () => {
            assertEqualTextQueries(queryBuilder.text({ pattern: 'foo\nbar', isRegExp: true }), {
                folderQueries: [],
                contentPattern: {
                    pattern: 'foo\\nbar',
                    isRegExp: true,
                    isMultiline: true
                },
                type: 2 /* Text */
            });
            assertEqualTextQueries(queryBuilder.text({ pattern: 'foo\nbar', isRegExp: false }), {
                folderQueries: [],
                contentPattern: {
                    pattern: 'foo\nbar',
                    isRegExp: false,
                    isMultiline: true
                },
                type: 2 /* Text */
            });
        });
        test('does not split glob pattern when expandPatterns disabled', () => {
            assertEqualQueries(queryBuilder.file([ROOT_1_URI], { includePattern: '**/foo, **/bar' }), {
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                type: 1 /* File */,
                includePattern: {
                    '**/foo, **/bar': true
                }
            });
        });
        test('folderResources', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI]), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{ folder: ROOT_1_URI }],
                type: 2 /* Text */
            });
        });
        test('simple exclude setting', () => {
            mockConfigService.setUserConfiguration('search', Object.assign(Object.assign({}, DEFAULT_USER_CONFIG), { exclude: {
                    'bar/**': true,
                    'foo/**': {
                        'when': '$(basename).ts'
                    }
                } }));
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                expandPatterns: true // verify that this doesn't affect patterns from configuration
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        excludePattern: {
                            'bar/**': true,
                            'foo/**': {
                                'when': '$(basename).ts'
                            }
                        }
                    }],
                type: 2 /* Text */
            });
        });
        test('simple include', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: 'bar',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                includePattern: {
                    '**/bar': true,
                    '**/bar/**': true
                },
                type: 2 /* Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: 'bar'
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                includePattern: {
                    'bar': true
                },
                type: 2 /* Text */
            });
        });
        test('simple include with ./ syntax', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: './bar',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        includePattern: {
                            'bar': true,
                            'bar/**': true
                        }
                    }],
                type: 2 /* Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: '.\\bar',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        includePattern: {
                            'bar': true,
                            'bar/**': true
                        }
                    }],
                type: 2 /* Text */
            });
        });
        test('exclude setting and searchPath', () => {
            mockConfigService.setUserConfiguration('search', Object.assign(Object.assign({}, DEFAULT_USER_CONFIG), { exclude: {
                    'foo/**/*.js': true,
                    'bar/**': {
                        'when': '$(basename).ts'
                    }
                } }));
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: './foo',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        includePattern: {
                            'foo': true,
                            'foo/**': true
                        },
                        excludePattern: {
                            'foo/**/*.js': true,
                            'bar/**': {
                                'when': '$(basename).ts'
                            }
                        }
                    }],
                type: 2 /* Text */
            });
        });
        test('multiroot exclude settings', () => {
            const ROOT_2 = fixPath('/project/root2');
            const ROOT_2_URI = getUri(ROOT_2);
            const ROOT_3 = fixPath('/project/root3');
            const ROOT_3_URI = getUri(ROOT_3);
            mockWorkspace.folders = workspace_1.toWorkspaceFolders([{ path: ROOT_1_URI.fsPath }, { path: ROOT_2_URI.fsPath }, { path: ROOT_3_URI.fsPath }], WS_CONFIG_PATH);
            mockWorkspace.configuration = uri_1.URI.file(fixPath('/config'));
            mockConfigService.setUserConfiguration('search', Object.assign(Object.assign({}, DEFAULT_USER_CONFIG), { exclude: { 'foo/**/*.js': true } }), ROOT_1_URI);
            mockConfigService.setUserConfiguration('search', Object.assign(Object.assign({}, DEFAULT_USER_CONFIG), { exclude: { 'bar': true } }), ROOT_2_URI);
            // There are 3 roots, the first two have search.exclude settings, test that the correct basic query is returned
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI, ROOT_2_URI, ROOT_3_URI]), {
                contentPattern: PATTERN_INFO,
                folderQueries: [
                    { folder: ROOT_1_URI, excludePattern: patternsToIExpression('foo/**/*.js') },
                    { folder: ROOT_2_URI, excludePattern: patternsToIExpression('bar') },
                    { folder: ROOT_3_URI }
                ],
                type: 2 /* Text */
            });
            // Now test that it merges the root excludes when an 'include' is used
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI, ROOT_2_URI, ROOT_3_URI], {
                includePattern: './root2/src',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [
                    {
                        folder: ROOT_2_URI,
                        includePattern: {
                            'src': true,
                            'src/**': true
                        },
                        excludePattern: {
                            'bar': true
                        },
                    }
                ],
                type: 2 /* Text */
            });
        });
        test('simple exclude input pattern', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                excludePattern: 'foo',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                type: 2 /* Text */,
                excludePattern: patternsToIExpression(...globalGlob('foo'))
            });
        });
        test('file pattern trimming', () => {
            const content = 'content';
            assertEqualQueries(queryBuilder.file(undefined, { filePattern: ` ${content} ` }), {
                folderQueries: [],
                filePattern: content,
                type: 1 /* File */
            });
        });
        test('exclude ./ syntax', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                excludePattern: './bar',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        excludePattern: patternsToIExpression('bar', 'bar/**'),
                    }],
                type: 2 /* Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                excludePattern: './bar/**/*.ts',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        excludePattern: patternsToIExpression('bar/**/*.ts', 'bar/**/*.ts/**'),
                    }],
                type: 2 /* Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                excludePattern: '.\\bar\\**\\*.ts',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        excludePattern: patternsToIExpression('bar/**/*.ts', 'bar/**/*.ts/**'),
                    }],
                type: 2 /* Text */
            });
        });
        test('extraFileResources', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], { extraFileResources: [getUri('/foo/bar.js')] }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                extraFileResources: [getUri('/foo/bar.js')],
                type: 2 /* Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                extraFileResources: [getUri('/foo/bar.js')],
                excludePattern: '*.js',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                excludePattern: patternsToIExpression(...globalGlob('*.js')),
                type: 2 /* Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                extraFileResources: [getUri('/foo/bar.js')],
                includePattern: '*.txt',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                includePattern: patternsToIExpression(...globalGlob('*.txt')),
                type: 2 /* Text */
            });
        });
        suite('parseSearchPaths', () => {
            test('simple includes', () => {
                function testSimpleIncludes(includePattern, expectedPatterns) {
                    assert.deepEqual(queryBuilder.parseSearchPaths(includePattern), {
                        pattern: patternsToIExpression(...expectedPatterns)
                    }, includePattern);
                }
                [
                    ['a', ['**/a/**', '**/a']],
                    ['a/b', ['**/a/b', '**/a/b/**']],
                    ['a/b,  c', ['**/a/b', '**/c', '**/a/b/**', '**/c/**']],
                    ['a,.txt', ['**/a', '**/a/**', '**/*.txt', '**/*.txt/**']],
                    ['a,,,b', ['**/a', '**/a/**', '**/b', '**/b/**']],
                    ['**/a,b/**', ['**/a', '**/a/**', '**/b/**']]
                ].forEach(([includePattern, expectedPatterns]) => testSimpleIncludes(includePattern, expectedPatterns));
            });
            function testIncludes(includePattern, expectedResult) {
                assertEqualSearchPathResults(queryBuilder.parseSearchPaths(includePattern), expectedResult, includePattern);
            }
            function testIncludesDataItem([includePattern, expectedResult]) {
                testIncludes(includePattern, expectedResult);
            }
            test('absolute includes', () => {
                const cases = [
                    [
                        fixPath('/foo/bar'),
                        {
                            searchPaths: [{ searchPath: getUri('/foo/bar') }]
                        }
                    ],
                    [
                        fixPath('/foo/bar') + ',' + 'a',
                        {
                            searchPaths: [{ searchPath: getUri('/foo/bar') }],
                            pattern: patternsToIExpression(...globalGlob('a'))
                        }
                    ],
                    [
                        fixPath('/foo/bar') + ',' + fixPath('/1/2'),
                        {
                            searchPaths: [{ searchPath: getUri('/foo/bar') }, { searchPath: getUri('/1/2') }]
                        }
                    ],
                    [
                        fixPath('/foo/bar') + ',' + fixPath('/foo/../foo/bar/fooar/..'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo/bar')
                                }]
                        }
                    ],
                    [
                        fixPath('/foo/bar/**/*.ts'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo/bar'),
                                    pattern: patternsToIExpression('**/*.ts', '**/*.ts/**')
                                }]
                        }
                    ],
                    [
                        fixPath('/foo/bar/*a/b/c'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo/bar'),
                                    pattern: patternsToIExpression('*a/b/c', '*a/b/c/**')
                                }]
                        }
                    ],
                    [
                        fixPath('/*a/b/c'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/'),
                                    pattern: patternsToIExpression('*a/b/c', '*a/b/c/**')
                                }]
                        }
                    ],
                    [
                        fixPath('/foo/{b,c}ar'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo'),
                                    pattern: patternsToIExpression('{b,c}ar', '{b,c}ar/**')
                                }]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('includes with tilde', () => {
                const userHome = workbenchTestServices_1.TestEnvironmentService.userHome;
                const cases = [
                    [
                        '~/foo/bar',
                        {
                            searchPaths: [{ searchPath: getUri(userHome, '/foo/bar') }]
                        }
                    ],
                    [
                        '~/foo/bar, a',
                        {
                            searchPaths: [{ searchPath: getUri(userHome, '/foo/bar') }],
                            pattern: patternsToIExpression(...globalGlob('a'))
                        }
                    ],
                    [
                        fixPath('/foo/~/bar'),
                        {
                            searchPaths: [{ searchPath: getUri('/foo/~/bar') }]
                        }
                    ],
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('relative includes w/single root folder', () => {
                const cases = [
                    [
                        './a',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a', 'a/**')
                                }]
                        }
                    ],
                    [
                        './a/',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a', 'a/**')
                                }]
                        }
                    ],
                    [
                        './a/*b/c',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a/*b/c', 'a/*b/c/**')
                                }]
                        }
                    ],
                    [
                        './a/*b/c, ' + fixPath('/project/foo'),
                        {
                            searchPaths: [
                                {
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a/*b/c', 'a/*b/c/**')
                                },
                                {
                                    searchPath: getUri('/project/foo')
                                }
                            ]
                        }
                    ],
                    [
                        './a/b/,./c/d',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a/b', 'a/b/**', 'c/d', 'c/d/**')
                                }]
                        }
                    ],
                    [
                        '../',
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo')
                                }]
                        }
                    ],
                    [
                        '..',
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo')
                                }]
                        }
                    ],
                    [
                        '..\\bar',
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo/bar')
                                }]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('relative includes w/two root folders', () => {
                const ROOT_2 = '/project/root2';
                mockWorkspace.folders = workspace_1.toWorkspaceFolders([{ path: ROOT_1_URI.fsPath }, { path: getUri(ROOT_2).fsPath }], WS_CONFIG_PATH);
                mockWorkspace.configuration = uri_1.URI.file(fixPath('config'));
                const cases = [
                    [
                        './root1',
                        {
                            searchPaths: [{
                                    searchPath: getUri(ROOT_1)
                                }]
                        }
                    ],
                    [
                        './root2',
                        {
                            searchPaths: [{
                                    searchPath: getUri(ROOT_2),
                                }]
                        }
                    ],
                    [
                        './root1/a/**/b, ./root2/**/*.txt',
                        {
                            searchPaths: [
                                {
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a/**/b', 'a/**/b/**')
                                },
                                {
                                    searchPath: getUri(ROOT_2),
                                    pattern: patternsToIExpression('**/*.txt', '**/*.txt/**')
                                }
                            ]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('include ./foldername', () => {
                const ROOT_2 = '/project/root2';
                const ROOT_1_FOLDERNAME = 'foldername';
                mockWorkspace.folders = workspace_1.toWorkspaceFolders([{ path: ROOT_1_URI.fsPath, name: ROOT_1_FOLDERNAME }, { path: getUri(ROOT_2).fsPath }], WS_CONFIG_PATH);
                mockWorkspace.configuration = uri_1.URI.file(fixPath('config'));
                const cases = [
                    [
                        './foldername',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI
                                }]
                        }
                    ],
                    [
                        './foldername/foo',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('foo', 'foo/**')
                                }]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('relative includes w/multiple ambiguous root folders', () => {
                const ROOT_2 = '/project/rootB';
                const ROOT_3 = '/otherproject/rootB';
                mockWorkspace.folders = workspace_1.toWorkspaceFolders([{ path: ROOT_1_URI.fsPath }, { path: getUri(ROOT_2).fsPath }, { path: getUri(ROOT_3).fsPath }], WS_CONFIG_PATH);
                mockWorkspace.configuration = uri_1.URI.file(fixPath('/config'));
                const cases = [
                    [
                        '',
                        {
                            searchPaths: undefined
                        }
                    ],
                    [
                        './',
                        {
                            searchPaths: undefined
                        }
                    ],
                    [
                        './root1',
                        {
                            searchPaths: [{
                                    searchPath: getUri(ROOT_1)
                                }]
                        }
                    ],
                    [
                        './root1,./',
                        {
                            searchPaths: [{
                                    searchPath: getUri(ROOT_1)
                                }]
                        }
                    ],
                    [
                        './rootB',
                        {
                            searchPaths: [
                                {
                                    searchPath: getUri(ROOT_2),
                                },
                                {
                                    searchPath: getUri(ROOT_3),
                                }
                            ]
                        }
                    ],
                    [
                        './rootB/a/**/b, ./rootB/b/**/*.txt',
                        {
                            searchPaths: [
                                {
                                    searchPath: getUri(ROOT_2),
                                    pattern: patternsToIExpression('a/**/b', 'a/**/b/**', 'b/**/*.txt', 'b/**/*.txt/**')
                                },
                                {
                                    searchPath: getUri(ROOT_3),
                                    pattern: patternsToIExpression('a/**/b', 'a/**/b/**', 'b/**/*.txt', 'b/**/*.txt/**')
                                }
                            ]
                        }
                    ],
                    [
                        './root1/**/foo/, bar/',
                        {
                            pattern: patternsToIExpression('**/bar', '**/bar/**'),
                            searchPaths: [
                                {
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('**/foo', '**/foo/**')
                                }
                            ]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
        });
        suite('smartCase', () => {
            test('no flags -> no change', () => {
                const query = queryBuilder.text({
                    pattern: 'a'
                }, []);
                assert(!query.contentPattern.isCaseSensitive);
            });
            test('maintains isCaseSensitive when smartCase not set', () => {
                const query = queryBuilder.text({
                    pattern: 'a',
                    isCaseSensitive: true
                }, []);
                assert(query.contentPattern.isCaseSensitive);
            });
            test('maintains isCaseSensitive when smartCase set', () => {
                const query = queryBuilder.text({
                    pattern: 'a',
                    isCaseSensitive: true
                }, [], {
                    isSmartCase: true
                });
                assert(query.contentPattern.isCaseSensitive);
            });
            test('smartCase determines not case sensitive', () => {
                const query = queryBuilder.text({
                    pattern: 'abcd'
                }, [], {
                    isSmartCase: true
                });
                assert(!query.contentPattern.isCaseSensitive);
            });
            test('smartCase determines case sensitive', () => {
                const query = queryBuilder.text({
                    pattern: 'abCd'
                }, [], {
                    isSmartCase: true
                });
                assert(query.contentPattern.isCaseSensitive);
            });
            test('smartCase determines not case sensitive (regex)', () => {
                const query = queryBuilder.text({
                    pattern: 'ab\\Sd',
                    isRegExp: true
                }, [], {
                    isSmartCase: true
                });
                assert(!query.contentPattern.isCaseSensitive);
            });
            test('smartCase determines case sensitive (regex)', () => {
                const query = queryBuilder.text({
                    pattern: 'ab[A-Z]d',
                    isRegExp: true
                }, [], {
                    isSmartCase: true
                });
                assert(query.contentPattern.isCaseSensitive);
            });
        });
        suite('file', () => {
            test('simple file query', () => {
                const cacheKey = 'asdf';
                const query = queryBuilder.file([ROOT_1_URI], {
                    cacheKey,
                    sortByScore: true
                });
                assert.equal(query.folderQueries.length, 1);
                assert.equal(query.cacheKey, cacheKey);
                assert(query.sortByScore);
            });
        });
    });
    function assertEqualTextQueries(actual, expected) {
        expected = Object.assign(Object.assign({}, DEFAULT_TEXT_QUERY_PROPS), expected);
        return assertEqualQueries(actual, expected);
    }
    function assertEqualQueries(actual, expected) {
        expected = Object.assign(Object.assign({}, DEFAULT_QUERY_PROPS), expected);
        const folderQueryToCompareObject = (fq) => {
            return {
                path: fq.folder.fsPath,
                excludePattern: normalizeExpression(fq.excludePattern),
                includePattern: normalizeExpression(fq.includePattern),
                fileEncoding: fq.fileEncoding
            };
        };
        // Avoid comparing URI objects, not a good idea
        if (expected.folderQueries) {
            assert.deepEqual(actual.folderQueries.map(folderQueryToCompareObject), expected.folderQueries.map(folderQueryToCompareObject));
            delete actual.folderQueries;
            delete expected.folderQueries;
        }
        if (expected.extraFileResources) {
            assert.deepEqual(actual.extraFileResources.map(extraFile => extraFile.fsPath), expected.extraFileResources.map(extraFile => extraFile.fsPath));
            delete expected.extraFileResources;
            delete actual.extraFileResources;
        }
        delete actual.usingSearchPaths;
        actual.includePattern = normalizeExpression(actual.includePattern);
        actual.excludePattern = normalizeExpression(actual.excludePattern);
        cleanUndefinedQueryValues(actual);
        assert.deepEqual(actual, expected);
    }
    function assertEqualSearchPathResults(actual, expected, message) {
        cleanUndefinedQueryValues(actual);
        assert.deepEqual(actual.pattern, expected.pattern, message);
        assert.equal(actual.searchPaths && actual.searchPaths.length, expected.searchPaths && expected.searchPaths.length);
        if (actual.searchPaths) {
            actual.searchPaths.forEach((searchPath, i) => {
                const expectedSearchPath = expected.searchPaths[i];
                assert.deepEqual(searchPath.pattern, expectedSearchPath.pattern);
                assert.equal(searchPath.searchPath.toString(), expectedSearchPath.searchPath.toString());
            });
        }
    }
    /**
     * Recursively delete all undefined property values from the search query, to make it easier to
     * assert.deepEqual with some expected object.
     */
    function cleanUndefinedQueryValues(q) {
        for (const key in q) {
            if (q[key] === undefined) {
                delete q[key];
            }
            else if (typeof q[key] === 'object') {
                cleanUndefinedQueryValues(q[key]);
            }
        }
        return q;
    }
    function globalGlob(pattern) {
        return [
            `**/${pattern}/**`,
            `**/${pattern}`
        ];
    }
    function patternsToIExpression(...patterns) {
        return patterns.length ?
            patterns.reduce((glob, cur) => { glob[cur] = true; return glob; }, Object.create(null)) :
            undefined;
    }
    function getUri(...slashPathParts) {
        return uri_1.URI.file(fixPath(...slashPathParts));
    }
    function fixPath(...slashPathParts) {
        if (platform_1.isWindows && slashPathParts.length && !slashPathParts[0].match(/^c:/i)) {
            slashPathParts.unshift('c:');
        }
        return path_1.join(...slashPathParts);
    }
    function normalizeExpression(expression) {
        if (!expression) {
            return expression;
        }
        const normalized = Object.create(null);
        Object.keys(expression).forEach(key => {
            normalized[key.replace(/\\/g, '/')] = expression[key];
        });
        return normalized;
    }
});
//# sourceMappingURL=queryBuilder.test.js.map