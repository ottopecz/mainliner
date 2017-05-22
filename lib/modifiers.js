/**
 * The vertex modifiers and their related methods
 * @type {{factory: {isFactory: ((vertexName?)), chop: ((vertexName))}, optional: {isOptional: ((vertexName?)), chop: ((vertexName))}}}
 */
module.exports = {

  /**
   * @type {Object} The factory modifier methods
   */
  "factory": {

    /**
     * Returns true if the provided vertexName is modified as factory
     * @param {string} vertexName The provided vertex name
     * @returns {boolean} The result of the test
     */
    isFactory(vertexName) {

      const re = /Factory$/;

      return re.test(vertexName);
    },

    /**
     * Chops the vertex name from the factory modifier
     * @param {string} vertexName The vertex name to chop
     * @returns {*} The chopped vertex name
     */
    chop(vertexName) {
      return vertexName.split("Factory")[0];
    }
  },

  /**
   * Returns true if the provided vertex name is modified as optional
   * @param {string} vertexName The provided vertex name
   * @returns {boolean} The result of the test
   */
  "optional": {
    isOptional(vertexName) {

      const re = /\?$/;

      return re.test(vertexName);
    },

    /**
     * Chops the vertex name from the optional modifier
     * @param {string} vertexName The vertex name to chop
     * @returns {*} The chopped vertex name
     */
    chop(vertexName) {
      return vertexName.split("?")[0];
    }
  }
};
