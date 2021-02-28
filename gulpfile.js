// папка вывода (обычно dist), здесь же оно будет выглядеть так {"имя корневой папки проекта" - build}
let project_folder = require("path").basename(__dirname) + " - build";

// папка ввода
let source_folder = "src";

// filesystem
let fs = require('fs');
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
  imagemin = require('gulp-imagemin'),
  webp = require('gulp-webp'),
  webphtml = require('gulp-webp-html'),
  webpcss = require('gulp-webpcss'),
  ttf2woff = require('gulp-ttf2woff'),
  ttf2woff2 = require('gulp-ttf2woff2'),
  fonter = require('gulp-fonter');


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
    .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}

// обработка изображений 
function images(){
  return src(path.src.img)
    .pipe(
      webp({
        quality: 70
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false}],
        interlaced: true,
        optimizationLevel: 3 // 0 - 7 
      })
    )
    .pipe(dest(path.build.img))
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
  .pipe(postcss([ autoprefixer() ]))
  .pipe(sourcemaps.write('.'))
  .pipe(sourcemaps.init())
  .pipe(webpcss())
  .pipe(dest(path.build.css))
  .pipe(clean_css())
  .pipe(
    rename({
      extname: ".min.css"
    })
  )
  .pipe(dest(path.build.css))
  .pipe(browsersync.stream())
}

// обработка ttf шрифтов 
function fonts(){
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts));
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts));
}


// обработка otf шрифтов
gulp.task('otf2ttf', function(){
  return src([source_folder + '/fonts/*.otf'])
  .pipe(fonter({
    formats: ['ttf']
  }))
  .pipe(dest(source_folder + '/fonts/'));
})
 
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

// подключение шрифтов к файлу стилей 
function fontsStyle(params) {
  let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
  if (file_content == '') {
    fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
  if (items) {
    let c_fontname;
    for (var i = 0; i < items.length; i++) {
      let fontname = items[i].split('.');
      fontname = fontname[0];
      if (c_fontname != fontname) {
        fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
      }
      c_fontname = fontname;
    }
  }
})
}
}

// callback функция
function cb(){

}

// установка watch для файлов
function watchFiles(params){
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
}

// очистка папки - dir
function clean(params){
  return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel( html, css, js, images, fonts), fontsStyle);
let watch = gulp.parallel(build, watchFiles, browserSync);


exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
