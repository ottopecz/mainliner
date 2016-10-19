module.exports = class Graph {

  constructor(lifeCycles, vertexes, edges) {

    if (!lifeCycles) {
      throw new Error("The life cycles must be a parameter of the constructor");
    }

    if (vertexes && !(vertexes instanceof Map)) {
      throw new TypeError("The vertexes parameter has to be a Map");
    }

    if (edges && !(edges instanceof Set)) {
      throw new TypeError("The edges parameter has to be a Set");
    }

    this.lifeCycles_ = lifeCycles;
    this.vertexes_ = vertexes || new Map();
    this.edges_ = edges || new Set();
  }

  addVertex(name, vertex, lifeCycle) {

    if (this.vertexes_.has(name)) {
      throw new Error(`${name} has already been registered`);
    }

    if (lifeCycle && !this.lifeCycles_.contains(lifeCycle)) {
      throw new RangeError("Unknown lifecycle");
    }

    if (typeof vertex === "function") {
      if (vertex.toString().includes("class")) {
        this.vertexes_.set(name, {
          vertex,
          "lifeCycle": lifeCycle || this.lifeCycles_.getDefault(),
          "type": "class"
        });
      } else {
        this.vertexes_.set(name, {vertex, "type": "function"});
      }
    } else {
      this.vertexes_.set(name, {vertex, "type": "passThrough"});
    }
  }

  getVertexData(name) {

    for (const [key, value] of this.vertexes_) {
      if (key === name) {
        return value;
      }
    }
  }

  addEdge(edge) {

    for (const storedEdge of this.edges_) {
      if ((edge[0] === storedEdge[0]) && (edge[1] === storedEdge[1])) {
        throw new Error("Duplicated edge");
      }
    }

    this.edges_.add(edge);
  }

  getAdjacentVertexes(vertexName) {

    const ret = new Set();

    for (const edge of (this.edges_)) {
      if (edge[0] === vertexName) {
        ret.add(edge[1]);
      }
    }

    return ret;
  }
};
