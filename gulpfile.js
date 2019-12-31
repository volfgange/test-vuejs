/**
 * @Author: Laurent Vergerolle <laurent>
 * @Date:   2019-12-29T13:19:15-04:00
 * @Email:  laurent@ipeos.com
 * @Last modified by:   laurent
 * @Last modified time: 2019-12-29T18:00:10-04:00
 * @License: GPLv3
 */
var gulp = require('gulp');

var del = require('del');
var cleanCSS = require('gulp-clean-css');
var pug = require('gulp-pug');
var minify = require('gulp-minify');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var sass = require('gulp-sass');
var header = require('gulp-header');
var pkg = require('./package.json');
var browserSync = require('browser-sync').create();

var src_path = 'src';
var dest_path =  'www';
var node_path = 'node_modules';
var banner = ['/*!\n',
    ' * <%= pkg.name %> v<%= pkg.version %>\n',
    ' * <%= pkg.author %> Copyright ' + (((new Date()).getFullYear() > 2019) ? '2019 - ' + (new Date()).getFullYear() : '2019'), ' \n',
    ' * Licensed under <%= pkg.license %>\n',
    ' * <%= pkg.homepage %>\n',
    ' */\n',
    ''
].join('');

// Compile les fichiers scss en css, les minify et les place dans le www
gulp.task('compile:scss', function(){
  var scss = [
    src_path + '/scss/**/*.scss'
  ]
  return gulp.src(scss)
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCSS({ compatibility: 'ie9' }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(header(banner, { pkg: pkg }))
    .pipe(gulp.dest(dest_path + '/css'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

// Récupère tous les fichiers listés pour les placer dans le www
gulp.task('fix:assets', function() {
  var assets = [
    src_path + '/**/*.{eot,svg,ttf,woff,woff2,png,jpg,gif,ico,mp4,ogg,webm}'
  ];
  return gulp.src(assets)
    .pipe(gulp.dest(dest_path))
    .pipe(browserSync.reload({
      stream: true
    }));
});

// Compresse tous les fichiers js et les place dans le répertoire www
gulp.task('minify:js', function() {
  var js = [src_path + '/**/*.js']
  return gulp.src(js)
    .pipe(minify({
      ext: { min: '.min.js' },
      noSource: true,
      ignoreFiles: ['.combo.js', '-min.js', '.min.js']
    }))
    .pipe(header(banner, { pkg: pkg }))
    .pipe(gulp.dest(dest_path))
    .pipe(browserSync.reload({
      stream: true
    }));
});

// Compile les fichiers pug en html et les place dans le répertoire www
gulp.task('compile:pug', function() {
  var views = [src_path + '/views/*.pug'];
  return gulp.src(views)
    .pipe(replace('../' + node_path, 'vendor'))
    .pipe(pug())
    .pipe(gulp.dest(dest_path))
    .pipe(browserSync.reload({
      stream: true
    }));
});


// Supprime uniquement les vendors du répertoire www
gulp.task('clean:vendor', function() {
  return del(dest_path + '/vendor');
});

// Sort tous les vendor de node_modules et les place dans le répertoire www
gulp.task('vendor:assets', gulp.series('clean:vendor', function(callback) {
  // Jquery
  gulp.src([node_path + '/jquery/dist/jquery.min.js'])
    .pipe(gulp.dest(dest_path + '/vendor/jquery'));

  // bootstrap
  gulp.src([node_path + '/bootstrap/dist/js/bootstrap.min.js'])
    .pipe(gulp.dest(dest_path + '/vendor/bootstrap'));

  // Font Awesome
  gulp.src([node_path + '/@fortawesome/fontawesome-free/css/all.min.css'])
    .pipe(gulp.dest(dest_path + '/vendor/fontawesome/css'));
  gulp.src([node_path + '/@fortawesome/fontawesome-free/webfonts/*'])
    .pipe(gulp.dest(dest_path + '/vendor/fontawesome/webfonts'));
  gulp.src([node_path + '/@fortawesome/fontawesome-free/sprites/*'])
    .pipe(gulp.dest(dest_path + '/vendor/fontawesome/sprites'));
  gulp.src([node_path + '/@fortawesome/fontawesome-free/svgs/**/*'])
    .pipe(gulp.dest(dest_path + '/vendor/fontawesome/svgs'));
  gulp.src([node_path + '/@fortawesome/fontawesome-free/js/all.min.js'])
    .pipe(gulp.dest(dest_path + '/vendor/fontawesome/js'));

  // Vue.js + Axios
  gulp.src([node_path + '/vue/dist/vue.min.js'])
    .pipe(gulp.dest(dest_path + '/vendor/vue'));
  gulp.src([node_path + '/vue-resource/dist/vue-resource.min.js'])
    .pipe(gulp.dest(dest_path + '/vendor/vue-resource'));

  return callback();
}));

// Supprime le répertoire www
gulp.task('clean', function() {
  return del(dest_path);
});

// Construit a neuf le projet à déployer
gulp.task('build',
  gulp.series('clean',
  gulp.parallel('compile:pug', 'compile:scss', 'minify:js'),
  gulp.parallel('fix:assets', 'vendor:assets')));

gulp.task('default', gulp.series('build'));

// Serveur pour un refresh automatique du navigateur après les modifications
gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
      baseDir: "./" + dest_path + "/"
    },
  });
  gulp.watch(src_path + '/scss/**/*.scss', gulp.series('compile:scss'));
  gulp.watch(src_path + '/**/*.{eot,svg,ttf,woff,woff2,png,jpg,gif,ico,mp4,ogg,webm}', gulp.series('fix:assets'));
  gulp.watch(src_path + '/views/**/*.pug', gulp.series('compile:pug'));
  gulp.watch(src_path + '/js/**/*.js', gulp.series('minify:js'));
})

gulp.task('watch', gulp.series('default', 'browser-sync', function() {}));
