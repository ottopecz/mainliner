module.exports = class Graph {

  constructor(lifeCycles, vertexes, edges) {

    if (!Array.isArray(lifeCycles)) {
      throw new TypeError("The lifeCycles parameter should be an array");
    }

    for (const lifeCyle of lifeCycles) {
      if (typeof lifeCyle !== "string") {
        throw new TypeError("A lifeCycle should be a string");
      }
    }

    if (vertexes && !(vertexes instanceof Map)) {
      throw new TypeError("The vertexes parameter has to be a Map");
    }

    if (edges && !(edges instanceof Set)) {
      throw new TypeError("The edges parameter has to be a Set");
    }

    this.vertexes_ = vertexes || new Map();
    this.edges_ = edges || new Set();
    this.lifeCycles_ = lifeCycles;
  }

  addVertex(name, vertex, lifeCycle) {

    if (this.vertexes_.has(name)) {
      throw new Error(`${name} has already been registered`);
    }

    if (!this.lifeCycles_.includes(lifeCycle)) {
      throw new RangeError("Unknown lifecycle");
    }

    let type;

    if (typeof vertex === "function") {
      type = vertex.toString().includes("class") ? "class" : "function";
    } else {
      type = "passThrough";
    }

    this.vertexes_.set(name, {
      vertex,
      lifeCycle,
      type
    });
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
