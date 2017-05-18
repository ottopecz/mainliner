module.exports = function(grunt) {

  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks("grunt-eslint");
  grunt.loadNpmTasks("grunt-babel");

  grunt.initConfig({
    "mochaTest": {
      "test": {
        "options": {
          "reporter": "spec",
          "captureFile": "test_results.txt",
          "quiet": false,
          "clearRequireCache": true,
          "noFail": false
        },
        "src": ["test-lib/**/*.spec.js"]
      }
    },
    "eslint": {
      "target": ["lib/**/*.js", "test-lib/**/*.spec.js"]
    }
  });

  grunt.registerTask("default", ["eslint", "mochaTest"]);
};
