const gulp = require('gulp')
const cache = require('gulp-cached')
const fileinclude = require('gulp-file-include')
const sourcemaps = require('gulp-sourcemaps')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const browserify = require('browserify')
const babel = require('babelify')
const uglify = require('gulp-uglify')
const cleanCss = require('gulp-clean-css')
const sass = require('gulp-sass')
const newer = require('gulp-newer')
const imagemin = require('gulp-imagemin')
const gulpif = require('gulp-if')
const browserSync = require('browser-sync')
const rimraf = require('rimraf')
const postcss = require('gulp-postcss')
const inject = require('gulp-inject-string')
const argv = require('yargs').argv

sass.compiler = require('node-sass')
imagemin.jpegoptim = require('imagemin-jpegoptim')

const path = {
  src: {
    html: 'src/html/**/*.html',
    scripts: 'src/scripts/*.js',
    styles: {
      main: 'src/styles/main.scss',
      editor: 'src/styles/editor.scss'
    },
    images: 'src/assets/images/**/*.{png,jpg,gif,svg}',
    icons: 'src/assets/icons/**/*.svg',
    fonts: 'src/assets/fonts/**/*.*',
    root: ['src/assets/root/**/*.*', 'src/assets/root/**/.*']
  },
  dest: {
    html: 'public/',
    js: 'public/js/',
    css: 'public/css/',
    img: 'public/img/',
    icons: 'public/icons/',
    fonts: 'public/fonts/',
    root: 'public/'
  },
  cache: {
    img: 'cache/img/'
  },
  watch: {
    html: 'src/html/**/*.*',
    scripts: 'src/scripts/**/*.*',
    styles: 'src/styles/**/*.*',
    images: 'src/assets/images/**/*.*',
    icons: 'src/assets/icons/**/*.*',
    fonts: 'src/assets/fonts/**/*.*',
    root: 'src/assets/root/**/*.*'
  },
  clear: {
    dest: 'public/'
  }
}

const config = {
  browsersync: {
    server: {
      baseDir: './public/'
    },
    files: [
      path.dest.html + '**/*.*',
      path.dest.js + '**/*.*',
      path.dest.img + '**/*.*',
      path.dest.css + '**/*.*'
    ],
    notify: false
  }
}

function wrapPipe (taskFn) {
  return function (done) {
    const onSuccess = function () {
      done()
    }
    const onError = function (err) {
      done(err)
    }
    const outStream = taskFn(onSuccess, onError)
    if (outStream && typeof outStream.on === 'function') {
      outStream.on('end', onSuccess)
    }
  }
}

/* HTML */
gulp.task('html:build', function () {
  const ts = +new Date()
  return gulp.src(path.src.html)
    .pipe(inject.replace('#TS#', ts))
    .pipe(fileinclude())
    .pipe(gulp.dest(path.dest.html))
    .pipe(browserSync.stream())
})

/* Root files */
gulp.task('root:build', function () {
  return gulp.src(path.src.root)
    .pipe(cache('root'))
    .pipe(gulp.dest(path.dest.root))
    .pipe(browserSync.stream())
})

/* Fonts */
gulp.task('fonts:build', function () {
  return gulp.src(path.src.fonts)
    .pipe(cache('fonts'))
    .pipe(gulp.dest(path.dest.fonts))
    .pipe(browserSync.stream())
})

/* Scripts */
gulp.task('scripts:build', wrapPipe(function (success, error) {
  browserify('./src/scripts/main.js', { debug: true }).transform(babel)
    .bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(gulpif(argv.dev, sourcemaps.init({ loadMaps: true }).on('error', error)))
    .pipe(gulpif(!argv.dev, uglify().on('error', error)))
    .pipe(gulpif(argv.dev, sourcemaps.write('.')))
    .pipe(gulp.dest(path.dest.js))
    .pipe(browserSync.stream())
  success()
}))

/* Main styles */
gulp.task('styles.main:build', wrapPipe(function (success, error) {
  gulp.src(path.src.styles.main)
    .pipe(gulpif(argv.dev, sourcemaps.init({ loadMaps: true }).on('error', error)))
    .pipe(sass().on('error', error))
    .pipe(postcss().on('error', error))
    .pipe(cleanCss().on('error', error))
    .pipe(gulpif(argv.dev, sourcemaps.write('.')))
    .pipe(gulp.dest(path.dest.css))
    .pipe(browserSync.stream())
  success()
}))

/* Editor styles */
gulp.task('styles.editor:build', wrapPipe(function (success, error) {
  gulp.src(path.src.styles.editor)
    .pipe(gulpif(argv.dev, sourcemaps.init({ loadMaps: true }).on('error', error)))
    .pipe(sass().on('error', error))
    .pipe(postcss().on('error', error))
    .pipe(cleanCss().on('error', error))
    .pipe(gulpif(argv.dev, sourcemaps.write('.')))
    .pipe(gulp.dest(path.dest.css))
    .pipe(browserSync.stream())
  success()
}))

/* Styles */
gulp.task('styles:build', gulp.parallel('styles.main:build', 'styles.editor:build'))

/* Images cache */
gulp.task('images:cache', function () {
  return gulp.src(path.src.images)
    .pipe(newer(path.cache.img))
    .pipe(imagemin([
      imagemin.gifsicle({ interlaced: true }),
      imagemin.jpegoptim({ progressive: true, max: 85 }),
      imagemin.optipng({ optimizationLevel: 7 }),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest(path.cache.img))
    .pipe(browserSync.stream())
})

/* Images build */
gulp.task('images:build', gulp.series('images:cache', function () {
  return gulp.src(path.cache.img + '**/*.*')
    .pipe(newer(path.dest.img))
    .pipe(gulp.dest(path.dest.img))
    .pipe(browserSync.stream())
}))

/* Icons build */
gulp.task('icons:build', function () {
  return gulp.src(path.src.icons)
    .pipe(imagemin([
      imagemin.svgo({
        plugins: [
          { removeXMLNS: true },
          { removeViewBox: false },
          { removeDimensions: true }
        ]
      })
    ]))
    .pipe(gulp.dest(path.dest.icons))
    .pipe(browserSync.stream())
})

/* Build clear */
gulp.task('build:clear', function (cb) {
  return rimraf(path.clear.dest, cb)
})

/* Build */
gulp.task('build', gulp.series(
  'build:clear',
  'fonts:build',
  gulp.parallel(
    'root:build',
    'images:build',
    'icons:build',
    'scripts:build',
    'html:build',
    'styles:build'
  )
))

/* Web server */
gulp.task('webserver', gulp.series('build', function (done) {
  browserSync.init(config.browsersync)
  done()
}))

/* Watch */
gulp.task('watch', gulp.series('webserver', function () {
  gulp.watch(path.watch.html, gulp.series('html:build'))
  gulp.watch(path.watch.root, gulp.series('root:build'))
  gulp.watch(path.watch.styles, gulp.series('styles:build'))
  gulp.watch(path.watch.scripts, gulp.series('scripts:build'))
  gulp.watch(path.watch.images, gulp.series('images:build'))
  gulp.watch(path.watch.icons, gulp.series('icons:build'))
  gulp.watch(path.watch.fonts, gulp.series('fonts:build'))
}))

gulp.task('default', gulp.series('watch'))
