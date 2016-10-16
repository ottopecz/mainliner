const lifeCycles = require("./lifeCycles.json");
const Graph = require("./Graph");
const Container = require("./Container");

module.exports = {
  create() {
    return new Container(new Graph(lifeCycles));
  }
};
