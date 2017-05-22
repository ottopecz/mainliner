const lifeCycles = require("./lifeCycles");
const modifiers = require("./modifiers");
const Graph = require("./Graph");
const Container = require("./Container");
const Composer = require("talentcomposer");

/**
 * The API of the tool
 * @type {{create: (()), createTalent: ((record?)), required: Symbol}}
 */
module.exports = {

  /**
   * Creates a new ioc container
   * @returns {Container} The created ioc container
   */
  create() {
    return new Container(new Graph(lifeCycles, modifiers), modifiers);
  },

  /**
   * Creates a new talent (Proxies to the talentcomposer library)
   * @param {Object} record The source record of the talent. Must be an object literal
   * @returns {*} Whatever the talentcomposer library returns. Hopefully a Talent
   */
  createTalent(record) {
    return Composer.createTalent(record);
  },

  /**
   * The required marker for talents
   * @type {Symbol}
   */
  "required": Composer.required
};
