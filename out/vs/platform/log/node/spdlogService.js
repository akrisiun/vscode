/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/platform/log/common/log"], function (require, exports, path, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function createSpdLogLogger(processName, logsFolder) {
        // Do not crash if spdlog cannot be loaded
        try {
            const _spdlog = await new Promise((resolve_1, reject_1) => { require(['spdlog'], resolve_1, reject_1); });
            _spdlog.setAsyncMode(8192, 500);
            const logfilePath = path.join(logsFolder, `${processName}.log`);
            return _spdlog.createRotatingLoggerAsync(processName, logfilePath, 1024 * 1024 * 5, 6);
        }
        catch (e) {
            console.error(e);
        }
        return null;
    }
    function createRotatingLogger(name, filename, filesize, filecount) {
        const _spdlog = require.__$__nodeRequire('spdlog');
        return _spdlog.createRotatingLogger(name, filename, filesize, filecount);
    }
    exports.createRotatingLogger = createRotatingLogger;
    function log(logger, level, message) {
        switch (level) {
            case log_1.LogLevel.Trace:
                logger.trace(message);
                break;
            case log_1.LogLevel.Debug:
                logger.debug(message);
                break;
            case log_1.LogLevel.Info:
                logger.info(message);
                break;
            case log_1.LogLevel.Warning:
                logger.warn(message);
                break;
            case log_1.LogLevel.Error:
                logger.error(message);
                break;
            case log_1.LogLevel.Critical:
                logger.critical(message);
                break;
            default: throw new Error('Invalid log level');
        }
    }
    class SpdLogService extends log_1.AbstractLogService {
        constructor(name, logsFolder, level) {
            super();
            this.name = name;
            this.logsFolder = logsFolder;
            this.buffer = [];
            this._loggerCreationPromise = undefined;
            this.setLevel(level);
            this._createSpdLogLogger();
            this._register(this.onDidChangeLogLevel(level => {
                if (this._logger) {
                    this._logger.setLevel(level);
                }
            }));
        }
        _createSpdLogLogger() {
            if (!this._loggerCreationPromise) {
                this._loggerCreationPromise = createSpdLogLogger(this.name, this.logsFolder)
                    .then(logger => {
                    if (logger) {
                        this._logger = logger;
                        this._logger.setLevel(this.getLevel());
                        for (const { level, message } of this.buffer) {
                            log(this._logger, level, message);
                        }
                        this.buffer = [];
                    }
                });
            }
            return this._loggerCreationPromise;
        }
        _log(level, message) {
            if (this._logger) {
                log(this._logger, level, message);
            }
            else if (this.getLevel() <= level) {
                this.buffer.push({ level, message });
            }
        }
        trace(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Trace) {
                this._log(log_1.LogLevel.Trace, this.format([message, ...args]));
            }
        }
        debug(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Debug) {
                this._log(log_1.LogLevel.Debug, this.format([message, ...args]));
            }
        }
        info(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Info) {
                this._log(log_1.LogLevel.Info, this.format([message, ...args]));
            }
        }
        warn(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Warning) {
                this._log(log_1.LogLevel.Warning, this.format([message, ...args]));
            }
        }
        error(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Error) {
                if (message instanceof Error) {
                    const array = Array.prototype.slice.call(arguments);
                    array[0] = message.stack;
                    this._log(log_1.LogLevel.Error, this.format(array));
                }
                else {
                    this._log(log_1.LogLevel.Error, this.format([message, ...args]));
                }
            }
        }
        critical(message, ...args) {
            if (this.getLevel() <= log_1.LogLevel.Critical) {
                this._log(log_1.LogLevel.Critical, this.format([message, ...args]));
            }
        }
        flush() {
            if (this._logger) {
                this._logger.flush();
            }
            else if (this._loggerCreationPromise) {
                this._loggerCreationPromise.then(() => this.flush());
            }
        }
        dispose() {
            if (this._logger) {
                this.disposeLogger();
            }
            else if (this._loggerCreationPromise) {
                this._loggerCreationPromise.then(() => this.disposeLogger());
            }
            this._loggerCreationPromise = undefined;
        }
        disposeLogger() {
            if (this._logger) {
                this._logger.drop();
                this._logger = undefined;
            }
        }
        format(args) {
            let result = '';
            for (let i = 0; i < args.length; i++) {
                let a = args[i];
                if (typeof a === 'object') {
                    try {
                        a = JSON.stringify(a);
                    }
                    catch (e) { }
                }
                result += (i > 0 ? ' ' : '') + a;
            }
            return result;
        }
    }
    exports.SpdLogService = SpdLogService;
});
//# sourceMappingURL=spdlogService.js.map