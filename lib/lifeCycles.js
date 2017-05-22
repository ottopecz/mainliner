/**
 * The available life cycles and the their related methods
 * @type {{data: *[], contains: ((lifeCycle)), getDefault: (())}}
 */
module.exports = {

  /**
   * The available life cycles
   * @type {Array.<Object>}
   */
  "data": [
    {"name": "perRequest", "default": true},
    {"name": "singleton"},
    {"name": "unique"}
  ],

  /**
   * Returns true if the provided life cycle is available
   * @param {string} lifeCycle The life cycle to test
   * @public
   * @returns {boolean} The result of the test
   */
  contains(lifeCycle) {
    return Boolean(this.data.find(item => (lifeCycle === item.name)));
  },

  /**
   * Returns the default lice cycle
   * @public
   * @returns {string} The name of the default life cycle
   */
  getDefault() {
    return this.data.find(item => Boolean(item.default && item.default === true)).name;
  }
};
