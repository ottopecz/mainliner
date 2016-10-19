const lifeCycles = require("./lifeCycles");
const modifiers = require("./modifiers");
const Graph = require("./Graph");
const Container = require("./Container");

module.exports = {
  create() {
    return new Container(new Graph(lifeCycles, modifiers), modifiers);
  }
};
