import gulp from 'gulp'
import cache from 'gulp-cache'
import cleancss from 'gulp-clean-css'
import include from 'gulp-file-include'
import gulpif from 'gulp-if'
import imagemin, { gifsicle, mozjpeg, optipng, svgo } from 'gulp-imagemin'
import postcss from 'gulp-postcss'
import replace from 'gulp-replace'
import sassCompiler from 'sass'
import gulpSass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import terser from 'gulp-terser'
import cwebp from 'gulp-webp'
import babelify from 'babelify'
import browserify from 'browserify'
import sync from 'browser-sync'
import del from 'del'
import buffer from 'vinyl-buffer'
import source from 'vinyl-source-stream'

const isDev = process.env.NODE_ENV === 'development'
const sass = gulpSass(sassCompiler)

/* Config */

const config = {
  html: 'src/html/',
  scripts: 'src/scripts/',
  styles: 'src/styles/',
  assets: 'src/assets/',
  dest: 'public/'
}

/* Errors handler */

function error (error) {
  console.error(error.toString())
  this.emit('end')
}

/* Clean */

export const clean = () => del(config.dest)

/* Root */

export const root = () => {
  return gulp.src([
    config.assets + 'root/**/*.*',
    config.assets + 'root/**/.*'
  ])
    .pipe(gulp.dest(config.dest))
    .pipe(sync.stream())
}

/* Fonts */

export const fonts = () => {
  return gulp.src(config.assets + 'fonts/**/*.*')
    .pipe(gulp.dest(config.dest + 'fonts/'))
    .pipe(sync.stream())
}

/* Icons */

export const icons = () => {
  return gulp.src(config.assets + 'icons/**/*.svg')
    .pipe(cache(
      imagemin([
        svgo({
          plugins: [
            { name: 'removeXMLNS', active: true },
            { name: 'removeViewBox', active: false },
            { name: 'removeDimensions', active: true }
          ]
        })
      ], {
        verbose: true
      }),
      { name: 'icons' }
    ))
    .pipe(gulp.dest(config.dest + 'icons/'))
    .pipe(sync.stream())
}

/* Images */

export const images = () => {
  return gulp.src(config.assets + 'images/**/*.{png,jpg,gif,svg}')
    .pipe(cache(
      imagemin([
        gifsicle({ interlaced: true }),
        mozjpeg({ progressive: true, quality: 85 }),
        optipng({ optimizationLevel: 7 }),
        svgo()
      ], {
        verbose: true
      }),
      { name: 'images' }
    ))
    .pipe(gulp.dest(config.dest + 'img/'))
    .pipe(sync.stream())
}

/* Webp */

export const webp = () => {
  return gulp.src(config.assets + 'images/**/*.{png,jpg,gif}')
    .pipe(cache(
      cwebp({
        quality: 85
      }),
      { name: 'webp' }
    ))
    .pipe(gulp.dest(config.dest + 'img/'))
    .pipe(sync.stream())
}

/* HTML */

export const html = () => {
  return gulp.src(config.html + '[!_]*.html')
    .pipe(include())
    .pipe(gulp.dest(config.dest))
    .pipe(sync.stream())
}

/* Scripts */

export const scripts = () => {
  return browserify('./' + config.scripts + 'main.js', { debug: true }).transform(babelify)
    .bundle().on('error', error)
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(gulpif(isDev, sourcemaps.init({ loadMaps: true }).on('error', error)))
    .pipe(gulpif(!isDev, terser().on('error', error)))
    .pipe(gulpif(isDev, sourcemaps.write('.')))
    .pipe(gulp.dest(config.dest + 'js/'))
    .pipe(sync.stream())
}

/* Styles */

export const styles = () => {
  return gulp.src(config.styles + '*.scss')
    .pipe(gulpif(isDev, sourcemaps.init({ loadMaps: true }).on('error', error)))
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss().on('error', error))
    .pipe(cleancss().on('error', error))
    .pipe(gulpif(isDev, sourcemaps.write('.')))
    .pipe(gulp.dest(config.dest + 'css/'))
    .pipe(sync.stream())
}

/* Timestamps */

export const timestamps = () => {
  const ts = +new Date()
  return gulp.src(config.dest + '*.html')
    .pipe(gulpif(!isDev, replace(/#TS#/g, ts)))
    .pipe(gulpif(isDev, replace(/\?#TS#/g, '')))
    .pipe(gulp.dest(config.dest))
}

/* Flush cache */

export const flush = () => {
  return cache.clearAll()
}

/* Build */

export const build = gulp.series(
  clean,
  gulp.parallel(
    root,
    fonts,
    icons,
    images,
    webp,
    html,
    scripts,
    styles
  ),
  timestamps
)

/* Server */

export const server = () => {
  sync.init({
    ui: false,
    notify: false,
    server: {
      baseDir: config.dest
    }
  })
}

/* Watch */

export const watch = () => {
  gulp.watch([
    config.assets + 'root/**/*.*',
    config.assets + 'root/**/.*'
  ], root)
  gulp.watch(config.assets + 'fonts/**/*.*', fonts)
  gulp.watch(config.assets + 'icons/**/*.svg', icons)
  gulp.watch(config.assets + 'images/**/*.{png,jpg,gif,svg}', gulp.parallel(images, webp))
  gulp.watch(config.html + '*.html', gulp.series(html, timestamps))
  gulp.watch(config.scripts + '**/*.js', scripts)
  gulp.watch(config.styles + '**/*.scss', styles)
}

/* Default */

export default gulp.series(
  build,
  gulp.parallel(
    watch,
    server
  )
)
