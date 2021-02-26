// папка вывода
let project_folder = "dist";

// папка ввода
let source_folder = "src";

// указание путей
let path = {
  // пути вывода
  build:{
    html: project_folder + "/",
    css: project_folder + "/css/",
    js: project_folder + "/js/",
    img: project_folder + "/img/",
    fonts: project_folder + "/fonts/",
  },
  // пути ввода
  src:{
    html: [source_folder + "/*.html", "!" + source_folder + "/_*.html" ],
    css: source_folder + "/scss/style.scss",
    js: source_folder + "/js/script.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
    fonts: source_folder + "/fonts/*.ttf",
  },
  // пути для watch файлов
  watch:{
    html: source_folder + "/**/*.html",
    css: source_folder + "/scss/**/*.scss",
    js: source_folder + "/js/**/*.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
  },
  // путь для очистки папки вывода
  clean: "./" + project_folder + "/"
}


// объявление переменных 
let {src, dest } = require('gulp'),
  gulp = require('gulp'),
  browsersync = require('browser-sync').create(),
  fileinclude = require('gulp-file-include'),
  del = require('del'),
  scss = require('gulp-sass'),
  group_media = require('gulp-group-css-media-queries'),
  clean_css = require('gulp-clean-css'),
  rename = require('gulp-rename'),
  autoprefixer = require('autoprefixer'),
  sourcemaps = require('gulp-sourcemaps'),
  postcss = require('gulp-postcss'),
  uglify = require('gulp-uglify'),
  pipeline = require('readable-stream').pipeline;

// подключение browsersync 
function browserSync(params){
  browsersync.init({
    server:{
      baseDir: "./" + project_folder + "/",
    },
    port: 3000,
    notify: false
  })
}

// обработка HTML файлов
function html(){
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}

// обработка scss фалов в css
function css(){
  return src(path.src.css)
  .pipe(
    scss({
      outputStyle: "expanded"
    })
  )
  .pipe(
    group_media()
  )
  .pipe(dest(path.build.css))
  .pipe(sourcemaps.init())
  .pipe(postcss([ autoprefixer() ]))
  .pipe(sourcemaps.write('.'))
  .pipe(clean_css())
  .pipe(
    rename({
      extname: ".min.css"
    })
  )
  .pipe(dest(path.build.css))
  .pipe(browsersync.stream())
}

// обработка js файлов
function js(){
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(
      rename({
        extname: ".min.js"
      })
    )
    .pipe(uglify())
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
}

// установка watch для файлов
function watchFiles(params){
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
}

// очистка папки - dir
function clean(params){
  return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel( html, css, js ));
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
