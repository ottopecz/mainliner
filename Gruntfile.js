module.exports = function(grunt) {

  grunt.initConfig({
    "mochaTest": {
      "test": {
        "src": ["test-lib/**/*.spec.js"]
      }
    },
    "eslint": {
      "target": ["lib/**/*.js", "test-lib/**/*.spec.js"]
    }
  });

  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks("grunt-eslint");

  grunt.registerTask("default", ["mochaTest"]);
};