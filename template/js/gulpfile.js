/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

const fsextra = require("fs-extra");
const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const tsc = require("gulp-typescript");
const tslint = require("gulp-tslint");
const infoAgentScript = require("@coaty/core/scripts/info");

/**
 * Clean distribution folder
 */
gulp.task("clean", () => {
    return fsextra.emptyDir("dist");
});

/**
 * Generate Agent Info
 */
gulp.task("agentinfo", infoAgentScript.gulpBuildAgentInfo("./src/", "agent.info.ts"));

/**
* Build the application
*/
gulp.task("transpile", () => {
    const tscConfig = require("./tsconfig.json");
    return gulp
        .src(["src/typings/**/*.d.ts", "src/**/*.ts"])
        .pipe(sourcemaps.init())
        .pipe(tsc(tscConfig.compilerOptions))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("dist"));
});

/**
 * Lint the application
 */
gulp.task("lint", () => {
    return gulp.src(["src/**/*.ts"])
        .pipe(tslint({
            configuration: "./tslint.json",
            formatter: "verbose",
        }))
        .pipe(tslint.report({
            emitError: false,
            summarizeFailureOutput: true
        }));
});

/**
 * Lint the application and fix lint errors
 */
gulp.task("lint:fix", () => {
    return gulp.src(["src/**/*.ts"])
        .pipe(tslint({
            configuration: "./tslint.json",
            formatter: "verbose",
            fix: true
        }))
        .pipe(tslint.report({
            emitError: false,
            summarizeFailureOutput: true
        }));
});;

gulp.task("build", gulp.series("clean", "agentinfo", "transpile", "lint"));

gulp.task("default", gulp.series("build"));
