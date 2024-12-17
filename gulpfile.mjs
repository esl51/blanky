import gulp from 'gulp'
import cache from 'gulp-cache'
import cleancss from '@sequencemedia/gulp-clean-css'
import gulpif from 'gulp-if'
import svgo from 'gulp-svgo'
import postcss from 'gulp-postcss'
import * as sassCompiler from 'sass'
import gulpSass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import terser from 'gulp-terser'
import babelify from 'babelify'
import browserify from 'browserify'
import sync from 'browser-sync'
import { deleteAsync } from 'del'
import buffer from 'vinyl-buffer'
import source from 'vinyl-source-stream'
import through from 'through2'
import sharp from 'sharp'
import sharpIco from 'sharp-ico'
import penthouse from 'penthouse'
import twig from 'gulp-twig'
import fs from 'fs'
import path from 'path'

const isDev = process.env.NODE_ENV === 'development'
const sass = gulpSass(sassCompiler)

// Config

const config = {
  html: 'src/html/',
  scripts: 'src/scripts/',
  styles: 'src/styles/',
  assets: 'src/assets/',
  dest: 'public/',
  pw: '../site/templates/',
}

// Errors handler

function error(error) {
  console.error(error.toString())
  this.emit('end')
}

// Clean

export const clean = () => deleteAsync(config.dest)

// Root

export const root = () => {
  return gulp
    .src([config.assets + 'root/**/*.*', config.assets + 'root/**/.*'], {
      encoding: false,
    })
    .pipe(gulp.dest(config.dest))
    .pipe(sync.stream())
}

// Favicon

export const favicon = () => {
  return gulp
    .src(config.assets + 'root/icon.svg')
    .pipe(
      cache(
        through.obj(async function (src, enc, cb) {
          const items = {
            'favicon.ico': [32, 32],
            'apple-touch-icon.png': [180, 180],
            'icon-192.png': [192, 192],
            'icon-512.png': [512, 512],
          }
          for (const name in items) {
            const size = items[name]
            const buf = await sharp(src.path)
              .resize(...size)
              .toFormat('png')
              .toBuffer()
            const img = src.clone()
            const ext = name.split('.')[1]
            if (ext === 'ico') {
              img.contents = sharpIco.encode([buf])
            } else {
              img.contents = buf
            }
            img.stem = name.split('.')[0]
            img.extname = '.' + ext
            this.push(img)
          }
          cb()
        }),
        { name: 'favicon' },
      ),
    )
    .pipe(gulp.dest(config.dest))
    .pipe(sync.stream())
}

// Fonts

export const fonts = () => {
  return gulp
    .src(config.assets + 'fonts/**/*.*', { encoding: false })
    .pipe(gulp.dest(config.dest + 'fonts/'))
    .pipe(sync.stream())
}

// Icons

export const icons = () => {
  return gulp
    .src(config.assets + 'icons/**/*.svg')
    .pipe(
      cache(
        svgo({
          plugins: [
            { removeXMLNS: true },
            { removeViewBox: false },
            { removeDimensions: true },
          ],
        }),
        { name: 'icons' },
      ),
    )
    .pipe(gulp.dest(config.dest + 'icons/'))
    .pipe(sync.stream())
}

// Images

export const images = () => {
  return gulp
    .src(config.assets + 'images/**/*.{png,jpg,gif}', { encoding: false })
    .pipe(
      cache(
        through.obj(async function (src, enc, cb) {
          let buf = null
          if (src.extname === '.gif') {
            buf = await sharp(src.path).gif({ quality: 90 }).toBuffer()
          } else if (src.extname === '.png') {
            buf = await sharp(src.path).png({ quality: 90 }).toBuffer()
          } else {
            buf = await sharp(src.path).jpeg({ quality: 90 }).toBuffer()
          }
          const img = src.clone()
          img.contents = buf
          const webp = src.clone()
          const webpBuf = await sharp(src.path).webp({ quality: 90 }).toBuffer()
          webp.contents = webpBuf
          webp.extname = '.webp'
          this.push(img)
          this.push(webp)
          cb()
        }),
        { name: 'images' },
      ),
    )
    .pipe(gulp.dest(config.dest + 'img/'))
    .pipe(sync.stream())
}

// Svg

export const svg = () => {
  return gulp
    .src(config.assets + 'images/**/*.{svg}', { encoding: false })
    .pipe(cache(svgo(), { name: 'svg' }))
    .pipe(gulp.dest(config.dest + 'img/'))
    .pipe(sync.stream())
}

// HTML

export const html = () => {
  const dir = path.resolve(path.dirname(''))
  const ts = +new Date()
  return gulp
    .src(config.html + '!(_)*.html.twig')
    .pipe(
      twig({
        data: {
          ts,
        },
        extname: false,
        filters: [
          {
            name: 'icon',
            func: function (name, className) {
              return (
                '<span class="' +
                className +
                ' icon">' +
                fs.readFileSync(
                  path.join(dir, config.assets + 'icons/' + name + '.svg'),
                  'utf8',
                ) +
                '</span>'
              )
            },
          },
        ],
      }),
    )
    .pipe(gulp.dest(config.dest))
    .pipe(sync.stream())
}

// // JSON

export const json = () => {
  return gulp
    .src(config.html + '*.json')
    .pipe(gulp.dest(config.dest))
    .pipe(sync.stream())
}

// Scripts

export const scripts = () => {
  return browserify('./' + config.scripts + 'main.js', { debug: true })
    .transform(babelify)
    .bundle()
    .on('error', error)
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(gulpif(isDev, sourcemaps.init({ loadMaps: true }).on('error', error)))
    .pipe(gulpif(!isDev, terser().on('error', error)))
    .pipe(gulpif(isDev, sourcemaps.write('.')))
    .pipe(gulp.dest(config.dest + 'js/'))
    .pipe(sync.stream())
}

// Styles

export const styles = () => {
  return gulp
    .src(config.styles + '*.scss')
    .pipe(gulpif(isDev, sourcemaps.init({ loadMaps: true }).on('error', error)))
    .pipe(
      sass({
        quietDeps: true,
        silenceDeprecations: ['legacy-js-api'],
      }).on('error', sass.logError),
    )
    .pipe(postcss().on('error', error))
    .pipe(gulpif(!isDev, cleancss().on('error', error)))
    .pipe(gulpif(isDev, sourcemaps.write('.')))
    .pipe(gulp.dest(config.dest + 'css/'))
    .pipe(sync.stream())
}

// Critical styles

export const criticalStyles = () => {
  return gulp
    .src(config.dest + '*.html')
    .pipe(
      cache(
        through.obj(async function (src, enc, cb) {
          let critical = await penthouse({
            url: 'file://' + src.path,
            css: config.dest + 'css/main.css',
          })
          critical = critical.replace(
            /\.\.\/(img|fonts)/g,
            '/site/templates/$1',
          )
          const css = src.clone()
          css.extname = '.css'
          css.contents = Buffer.from(critical)
          css.stem =
            src.path.split('/').slice(-1)[0].split('.')[0] + '-critical'
          this.push(css)
          cb()
        }),
        { name: 'critical' },
      ),
    )
    .pipe(gulp.dest(config.dest + 'css/'))
    .pipe(sync.stream())
}

// Flush cache

export const flush = () => {
  return cache.clearAll()
}

// Build

export const build = gulp.series(
  clean,
  gulp.parallel(
    icons,
    images,
    svg,
    root,
    favicon,
    fonts,
    scripts,
    styles,
    json,
  ),
  html,
)

// PW

export const pw = gulp.series(build, criticalStyles, function () {
  return gulp
    .src(
      [
        config.dest + 'icons/**/*',
        config.dest + 'img/**/*',
        config.dest + 'js/**/*',
        config.dest + 'css/**/*',
        config.dest + 'fonts/**/*',
      ],
      {
        base: config.dest,
        ignore: [config.dest + 'img/temp/**/*', config.dest + 'img/temp'],
        encoding: false,
      },
    )
    .pipe(gulp.dest(config.pw))
})

// Server

export const server = () => {
  sync.init({
    ui: false,
    notify: false,
    server: {
      baseDir: config.dest,
      routes: {},
      middleware: function (req, res, next) {
        if (
          /\.json|\.txt|\.html/.test(req.url) &&
          req.method.toUpperCase() === 'POST'
        ) {
          console.log('[POST => GET] : ' + req.url)
          req.method = 'GET'
        }
        next()
      },
    },
  })
}

// Watch

export const watch = () => {
  gulp.watch(
    [config.assets + 'root/**/*.*', config.assets + 'root/**/.*'],
    root,
  )
  gulp.watch(config.assets + 'root/icon.svg', favicon)
  gulp.watch(config.assets + 'fonts/**/*.*', fonts)
  gulp.watch(config.assets + 'icons/**/*.svg', icons)
  gulp.watch(config.assets + 'images/**/*.{png,jpg,gif}', images)
  gulp.watch(config.assets + 'images/**/*.svg', svg)
  gulp.watch(config.html + '**/*.html.twig', html)
  gulp.watch(config.html + '**/*.json', json)
  gulp.watch(config.scripts + '**/*.js', scripts)
  gulp.watch(config.styles + '**/*.scss', styles)
}

// Default

export default gulp.series(build, gulp.parallel(watch, server))
