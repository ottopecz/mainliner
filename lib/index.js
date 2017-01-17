const lifeCycles = require("./lifeCycles");
const modifiers = require("./modifiers");
const Graph = require("./Graph");
const Container = require("./Container");
const Composer = require("talentcomposer");

module.exports = {
  create() {
    return new Container(new Graph(lifeCycles, modifiers), modifiers);
  },
  createTalent(record) {
    return Composer.createTalent(record);
  },
  "required": Composer.required
};
