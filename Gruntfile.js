module.exports = function(grunt) {
  
  grunt.initConfig({
    ngtemplates: {
      models: {
        cwd: "assets/",
        src: "ngTemplates/**/*.html",
        dest: "templates.js",
        options: {
          htmlmin: {
            collapseBooleanAttributes:      true,
            collapseWhitespace:             false,
            removeAttributeQuotes:          true,
            removeComments:                 true, // Only if you don't use comment directives!
            removeEmptyAttributes:          true,
            removeRedundantAttributes:      true,
            removeScriptTypeAttributes:     true,
            removeStyleLinkTypeAttributes:  true
          },
          url: function(url) { return url.replace('ngTemplates', '/templates'); },
        }
      }
    },
    concat: {
      js: {
        options: {
          separator: ';'
        },
        src: [
          'assets/js/**/*.js',
          'templates.js'
        ],
        dest: 'public/js/admin.js'
      },
    },
    uglify: {
      options: {
        mangle: false
      },
      js: {
        files: {
          'public/js/admin.min.js': 'public/js/admin.js',
        }
      }
    },
    less: {
      style: {
        files: {
          "public/css/admin.css": "assets/css/admin.less"
        }
      }
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: 'css/',
        files: {
          'public/css/admin.min.css': ['public/css/admin.css']
        }
      }
    }
  });
 
  // load tasks
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Default task(s).
  grunt.registerTask('default', ['ngtemplates','concat','uglify','less','cssmin']);
};