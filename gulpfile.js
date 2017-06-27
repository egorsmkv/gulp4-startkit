'use strict';

const gulp = require('gulp');
const gulpif = require('gulp-if');
const pug = require('gulp-pug');
const emitty = require('emitty').setup('dev', 'pug');
const browserSync = require('browser-sync').create();
const stylus = require('gulp-stylus');
const sourcemaps = require('gulp-sourcemaps');
const csscomb = require('gulp-csscomb');
const plumber = require('gulp-plumber');
const del = require('del');
const concat = require('gulp-concat');
const uglify = require('gulp-uglifyjs');
const autoprefixer = require('gulp-autoprefixer');

const path = {
    build: {
        html: 'build/',
        js: 'build/static/js/',
        css: 'build/static/css/',
        img: {
            images: 'build/static/img/'
        },
        fonts: 'build/static/fonts/'
    },
    src: {
        html: 'dev/pug/**/*.pug',
        js: {
            files: ['dev/static/js/**/*.js'],
            libs: [
                'node_modules/jquery/dist/jquery.js',
                'node_modules/tether/dist/js/tether.js',
                'node_modules/bootstrap/dist/js/bootstrap.js',
            ]
        },
        css: 'dev/static/stylus/',
        img: {
            images: 'dev/static/img/**/*.{png,jpg,gif}'
        },
        fonts: [
            'node_modules/font-awesome/fonts/FontAwesome.otf',
            'node_modules/font-awesome/fonts/fontawesome-webfont.eot',
            'node_modules/font-awesome/fonts/fontawesome-webfont.svg',
            'node_modules/font-awesome/fonts/fontawesome-webfont.ttf',
            'node_modules/font-awesome/fonts/fontawesome-webfont.woff',
            'node_modules/font-awesome/fonts/fontawesome-webfont.woff2',
        ]
    },
    watch: {
        html: 'dev/pug/**/*.pug',
        js: 'dev/static/js/*.js',
        css: 'dev/static/stylus/main.styl',
        img: {
            images: [
                'dev/static/img/**/*.{png,jpg,gif}'
            ],
        }
    },
    clean: './build'
};

gulp.task('pug', () =>
    new Promise((resolve, reject) => {
        emitty.scan(global.emittyChangedFile).then(() => {
            gulp.src('dev/pug/pages/**/*.pug')
                .pipe(gulpif(global.watch, emitty.filter(global.emittyChangedFile)))
                .pipe(pug({pretty: true}))
                .pipe(gulp.dest('build'))
                .on('end', resolve)
                .on('error', reject);
        });
    })
);

gulp.task('serve', () => {
    browserSync.init({
        server: 'build/'
    });

    browserSync.watch('build/**/*.*').on('change', browserSync.reload);
});

gulp.task('fonts:build', () => {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts));
});

gulp.task('scripts:dev', () => {
    return gulp.src(path.src.js.libs)
        .pipe(concat('libs.min.js'))
        .pipe(gulp.dest(path.build.js));
});

gulp.task('scripts:build', () => {
    return gulp.src(path.src.js.libs)
        .pipe(concat('libs.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.build.js));
});

gulp.task('styles:dev', () => {
    return gulp.src(path.watch.css)
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(stylus({
            'include css': true
        }))
        .pipe(sourcemaps.write())
        .pipe(autoprefixer(['last 2 version']))
        .pipe(gulp.dest(path.build.css));
});

gulp.task('styles:build', () => {
    return gulp.src(path.watch.css)
        .pipe(plumber())
        .pipe(stylus({
            'include css': true
        }))
        .pipe(autoprefixer(['last 2 version']))
        .pipe(csscomb())
        .pipe(gulp.dest(path.build.css));
});

gulp.task('clean', () => {
    return del(path.clean);
});

gulp.task('js:copy', () => {
    return gulp.src(path.src.js.files)
        .pipe(gulp.dest(path.build.js));
});

gulp.task('img:dev', () => {
    return gulp.src(path.src.img.images)
        .pipe(gulp.dest(path.build.img.images));
});

gulp.task('watch', () => {
    global.watch = true;

    gulp.watch(path.src.html, gulp.series('pug'))
        .on('all', (event, filepath) => {
            global.emittyChangedFile = filepath;
        });

    gulp.watch(path.src.css, gulp.series('styles:dev'));
    gulp.watch(path.src.js.files, gulp.series('scripts:dev', gulp.parallel('js:copy')));
    gulp.watch(path.watch.img.images, gulp.series('img:dev'));
});

gulp.task('dev', gulp.series(
    'clean',
    gulp.parallel('styles:dev', 'fonts:build', 'pug', 'scripts:dev', 'img:dev', 'js:copy')));

gulp.task('build', gulp.series(
    'clean',
    gulp.parallel('styles:build', 'fonts:build', 'pug', 'scripts:build', 'js:copy'))
);

gulp.task('default', gulp.series('dev', gulp.parallel('watch', 'serve')));
