/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

const gulp = require('gulp');
const util = require('./lib/util');
const task = require('./lib/task');
const compilation = require('./lib/compilation');

// Full compile, including nls and inline sources in sourcemaps, for build
const compileBuildCoder = task.define('compile-coder',
	task.series(
		// util.rimraf('out-coder'),
		compilation.compileTask('src/vs/server', 'out-coder', true)));

gulp.task(compileBuildCoder);
exports.compileBuildTask = compileBuildCoder;
