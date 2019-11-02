define(["require", "exports", "vs/platform/log/node/spdlogService"], function (require, exports, spdlogService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OutputAppender {
        constructor(name, file) {
            this.file = file;
            this.appender = spdlogService_1.createRotatingLogger(name, file, 1024 * 1024 * 30, 1);
            this.appender.clearFormatters();
        }
        append(content) {
            this.appender.critical(content);
        }
        flush() {
            this.appender.flush();
        }
    }
    exports.OutputAppender = OutputAppender;
});
//# sourceMappingURL=outputAppender.js.map