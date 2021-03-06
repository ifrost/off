module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        shell: {
            uglify: {
                command: 'uglifyjs off.js --mangle --compress -o off-min.js'
                
            },
            bumpup: {
                command: 'mversion patch -m'
            },
            test: {
                command: 'jasmine'
            }
        },


    });

    grunt.loadNpmTasks('grunt-shell');
    grunt.registerTask('build', ['shell:test','shell:uglify']);
    grunt.registerTask('bumpup', ['shell:bumpup']);
};