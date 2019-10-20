define(["require", "exports", "vs/workbench/contrib/tasks/common/problemMatcher", "assert", "vs/base/common/parsers"], function (require, exports, matchers, assert, parsers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ProblemReporter {
        constructor() {
            this._validationStatus = new parsers_1.ValidationStatus();
            this._messages = [];
        }
        info(message) {
            this._messages.push(message);
            this._validationStatus.state = 1 /* Info */;
        }
        warn(message) {
            this._messages.push(message);
            this._validationStatus.state = 2 /* Warning */;
        }
        error(message) {
            this._messages.push(message);
            this._validationStatus.state = 3 /* Error */;
        }
        fatal(message) {
            this._messages.push(message);
            this._validationStatus.state = 4 /* Fatal */;
        }
        hasMessage(message) {
            return this._messages.indexOf(message) !== null;
        }
        get messages() {
            return this._messages;
        }
        get state() {
            return this._validationStatus.state;
        }
        isOK() {
            return this._validationStatus.isOK();
        }
        get status() {
            return this._validationStatus;
        }
    }
    suite('ProblemPatternParser', () => {
        let reporter;
        let parser;
        const testRegexp = new RegExp('test');
        setup(() => {
            reporter = new ProblemReporter();
            parser = new matchers.ProblemPatternParser(reporter);
        });
        suite('single-pattern definitions', () => {
            test('parses a pattern defined by only a regexp', () => {
                let problemPattern = {
                    regexp: 'test'
                };
                let parsed = parser.parse(problemPattern);
                assert(reporter.isOK());
                assert.deepEqual(parsed, {
                    regexp: testRegexp,
                    kind: matchers.ProblemLocationKind.Location,
                    file: 1,
                    line: 2,
                    character: 3,
                    message: 0
                });
            });
            test('does not sets defaults for line and character if kind is File', () => {
                let problemPattern = {
                    regexp: 'test',
                    kind: 'file'
                };
                let parsed = parser.parse(problemPattern);
                assert.deepEqual(parsed, {
                    regexp: testRegexp,
                    kind: matchers.ProblemLocationKind.File,
                    file: 1,
                    message: 0
                });
            });
        });
        suite('multi-pattern definitions', () => {
            test('defines a pattern based on regexp and property fields, with file/line location', () => {
                let problemPattern = [
                    { regexp: 'test', file: 3, line: 4, column: 5, message: 6 }
                ];
                let parsed = parser.parse(problemPattern);
                assert(reporter.isOK());
                assert.deepEqual(parsed, [{
                        regexp: testRegexp,
                        kind: matchers.ProblemLocationKind.Location,
                        file: 3,
                        line: 4,
                        character: 5,
                        message: 6
                    }]);
            });
            test('defines a pattern bsaed on regexp and property fields, with location', () => {
                let problemPattern = [
                    { regexp: 'test', file: 3, location: 4, message: 6 }
                ];
                let parsed = parser.parse(problemPattern);
                assert(reporter.isOK());
                assert.deepEqual(parsed, [{
                        regexp: testRegexp,
                        kind: matchers.ProblemLocationKind.Location,
                        file: 3,
                        location: 4,
                        message: 6
                    }]);
            });
            test('accepts a pattern that provides the fields from multiple entries', () => {
                let problemPattern = [
                    { regexp: 'test', file: 3 },
                    { regexp: 'test1', line: 4 },
                    { regexp: 'test2', column: 5 },
                    { regexp: 'test3', message: 6 }
                ];
                let parsed = parser.parse(problemPattern);
                assert(reporter.isOK());
                assert.deepEqual(parsed, [
                    { regexp: testRegexp, kind: matchers.ProblemLocationKind.Location, file: 3 },
                    { regexp: new RegExp('test1'), line: 4 },
                    { regexp: new RegExp('test2'), character: 5 },
                    { regexp: new RegExp('test3'), message: 6 }
                ]);
            });
            test('forbids setting the loop flag outside of the last element in the array', () => {
                let problemPattern = [
                    { regexp: 'test', file: 3, loop: true },
                    { regexp: 'test1', line: 4 }
                ];
                let parsed = parser.parse(problemPattern);
                assert.equal(null, parsed);
                assert.equal(3 /* Error */, reporter.state);
                assert(reporter.hasMessage('The loop property is only supported on the last line matcher.'));
            });
            test('forbids setting the kind outside of the first element of the array', () => {
                let problemPattern = [
                    { regexp: 'test', file: 3 },
                    { regexp: 'test1', kind: 'file', line: 4 }
                ];
                let parsed = parser.parse(problemPattern);
                assert.equal(null, parsed);
                assert.equal(3 /* Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is invalid. The kind property must be provided only in the first element'));
            });
            test('kind: Location requires a regexp', () => {
                let problemPattern = [
                    { file: 0, line: 1, column: 20, message: 0 }
                ];
                let parsed = parser.parse(problemPattern);
                assert.equal(null, parsed);
                assert.equal(3 /* Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is missing a regular expression.'));
            });
            test('kind: Location requires a regexp on every entry', () => {
                let problemPattern = [
                    { regexp: 'test', file: 3 },
                    { line: 4 },
                    { regexp: 'test2', column: 5 },
                    { regexp: 'test3', message: 6 }
                ];
                let parsed = parser.parse(problemPattern);
                assert.equal(null, parsed);
                assert.equal(3 /* Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is missing a regular expression.'));
            });
            test('kind: Location requires a message', () => {
                let problemPattern = [
                    { regexp: 'test', file: 0, line: 1, column: 20 }
                ];
                let parsed = parser.parse(problemPattern);
                assert.equal(null, parsed);
                assert.equal(3 /* Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is invalid. It must have at least have a file and a message.'));
            });
            test('kind: Location requires a file', () => {
                let problemPattern = [
                    { regexp: 'test', line: 1, column: 20, message: 0 }
                ];
                let parsed = parser.parse(problemPattern);
                assert.equal(null, parsed);
                assert.equal(3 /* Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is invalid. It must either have kind: "file" or have a line or location match group.'));
            });
            test('kind: Location requires either a line or location', () => {
                let problemPattern = [
                    { regexp: 'test', file: 1, column: 20, message: 0 }
                ];
                let parsed = parser.parse(problemPattern);
                assert.equal(null, parsed);
                assert.equal(3 /* Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is invalid. It must either have kind: "file" or have a line or location match group.'));
            });
            test('kind: File accepts a regexp, file and message', () => {
                let problemPattern = [
                    { regexp: 'test', file: 2, kind: 'file', message: 6 }
                ];
                let parsed = parser.parse(problemPattern);
                assert(reporter.isOK());
                assert.deepEqual(parsed, [{
                        regexp: testRegexp,
                        kind: matchers.ProblemLocationKind.File,
                        file: 2,
                        message: 6
                    }]);
            });
            test('kind: File requires a file', () => {
                let problemPattern = [
                    { regexp: 'test', kind: 'file', message: 6 }
                ];
                let parsed = parser.parse(problemPattern);
                assert.equal(null, parsed);
                assert.equal(3 /* Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is invalid. It must have at least have a file and a message.'));
            });
            test('kind: File requires a message', () => {
                let problemPattern = [
                    { regexp: 'test', kind: 'file', file: 6 }
                ];
                let parsed = parser.parse(problemPattern);
                assert.equal(null, parsed);
                assert.equal(3 /* Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is invalid. It must have at least have a file and a message.'));
            });
        });
    });
});
//# sourceMappingURL=problemMatcher.test.js.map