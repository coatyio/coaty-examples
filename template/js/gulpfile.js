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
 * Transpile TS into JS code, using TS compiler in local typescript npm package.
 * Remove all comments except copyright header comments, and do not generate
 * corresponding .d.ts files (see task "transpile:dts").
 */
gulp.task("transpile:ts", () => {
    const tscConfig = require("./tsconfig.json");
    return gulp
        .src(["src/typings/**/*.d.ts", "src/**/*.ts"])

        // Comment out next line if source maps should not be generated.
        .pipe(sourcemaps.init())

        .pipe(tsc(Object.assign(tscConfig.compilerOptions, {
            removeComments: true,
            declaration: false,
        })))

        // Comment out next line if source maps should not be generated.
        .pipe(sourcemaps.write("."))

        .pipe(gulp.dest("dist"));
});

/**
 * Only emit TS declaration files, using TS compiler in local typescript npm
 * package. The generated declaration files include all comments so that IDEs
 * can provide this information to developers.
 */
gulp.task("transpile:dts", () => {
    const tscConfig = require("./tsconfig.json");
    return gulp
        .src(["src/typings/**/*.d.ts", "src/**/*.ts"])
        .pipe(tsc(Object.assign(tscConfig.compilerOptions, {
            removeComments: false,
            declaration: true,
        })))
        .dts
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

gulp.task("build", gulp.series("clean", "agentinfo", "transpile:ts", "transpile:dts", "lint"));

gulp.task("default", gulp.series("build"));
