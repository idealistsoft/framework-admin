module.exports = function(grunt) {
  
  grunt.initConfig({
    ngtemplates: {
      app: {
        cwd: "src/",
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
          'src/js/**/*.js',
          'templates.js'
        ],
        dest: 'js/admin.js'
      },
    },
    uglify: {
      options: {
        mangle: false
      },
      js: {
        files: {
          'js/admin.min.js': 'js/admin.js',
        }
      }
    },
    less: {
      style: {
        files: {
          "css/admin.css": "src/css/admin.less"
        }
      }
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: 'css/',
        files: {
          'css/admin.min.css': ['css/admin.css']
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