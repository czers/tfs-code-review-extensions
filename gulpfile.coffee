gulp = require 'gulp'
$ = do require "gulp-load-plugins"
generate = require './tools/generator'

series = (x) -> gulp.series.apply gulp, x
parallel = (x) -> gulp.parallel.apply gulp, x

# #####################################
# Libraries and scripts for domains
#

generate 'content', [
    'node_modules/jquery/dist/jquery.min.js'
], [
    '*.ts'
]

generate 'options', [
    'node_modules/jquery/dist/jquery.min.js'
    'node_modules/materialize-css/dist/js/materialize.min.js'
    'node_modules/materialize-css/dist/css/materialize.min.css'
    'node_modules/mdi/css/materialdesignicons.min.css'
], [
    'options.ts'
]

generate 'popup', [
    'node_modules/jquery/dist/jquery.min.js'
    'node_modules/materialize-css/dist/js/materialize.min.js'
    'node_modules/materialize-css/dist/css/materialize.min.css'
    'node_modules/mdi/css/materialdesignicons.min.css'
], [
    'popup.ts'
]

# #####################################
# Compile templates
#

gulp.task 'build:html', ->
    gulp.src 'src/**/*.pug'
        .pipe $.pug()
        .pipe gulp.dest 'dist'

# #####################################
# Copy static assets
#

gulp.task 'copy:manifest', ->
    gulp.src 'src/manifest.json'
        .pipe gulp.dest 'dist'

gulp.task 'copy:images', ->
    gulp.src 'src/**/*.+(png|jpg|gif|svg)'
        .pipe gulp.dest 'dist'

gulp.task 'copy:fonts', ->
    gulp.src [
        'node_modules/materialize-css/dist/fonts/**/*.*'
        'node_modules/mdi/fonts/**/*.*'
    ]
        .pipe gulp.dest 'dist/fonts'

# #####################################
# Build tasks for watch
#

gulp.task 'build:scripts', parallel [
    'build:content:scripts'
    'build:options:scripts'
    'build:popup:scripts'
]

gulp.task 'build:styles', parallel [
    'build:content:styles'
    'build:options:styles'
    'build:popup:styles'
]

# #####################################
# Build everything
#

gulp.task 'build', parallel [
    'build:content'
    'build:options'
    'build:popup'
    'build:html'
    'copy:manifest'
    'copy:images'
    'copy:fonts'
]

# #####################################
# Clean everything
#

gulp.task 'clean', ->
    require('del') ['dist', 'bin']


# #####################################
# Create packages
#

gulp.task 'pack:zip', () ->
    {'7z' : _7z} = require('7zip')
    {spawn} = require('child_process')
    spawn(_7z, ['a', 'bin\\extension.zip', '.\\dist\\*'])

gulp.task 'pack:crx', () ->
    fs = require 'fs'
    {join} = require 'path'
    ChromeExtension = require 'crx'

    fs.mkdirSync('bin') unless fs.existsSync('bin')

    crx = new ChromeExtension    
        privateKey: fs.readFileSync join(__dirname, 'key.pem')
    crx.load(join(__dirname,'dist'))
        .then ->
            crx.pack()
                .then (crxBuffer) ->
                    fs.writeFile join(__dirname,'bin','extension.crx'), crxBuffer, (err) ->
                        console.log err if err

gulp.task 'pack', parallel [
    'pack:zip'
    'pack:crx'
]

gulp.task 'default', series [
    'clean'
    'build'
    'pack'
]

# #####################################
# Watch for changes (dev mode)
#

gulp.task 'watch', ->
    gulp.watch 'src/**/*.pug',      parallel ['build:html']
    gulp.watch 'src/**/*.ts',       parallel ['build:scripts']
    gulp.watch 'src/**/*.scss',     parallel ['build:styles']
    gulp.watch 'src/manifest.json', parallel ['copy:manifest']
