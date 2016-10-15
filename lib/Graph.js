module.exports = class Graph {

  constructor(lifeCycles, vertexes, edges) {

    if (!Array.isArray(lifeCycles)) {
      throw new TypeError("The lifeCycles parameter should be an array");
    }

    for (const lifeCyle of lifeCycles) {
      if (typeof lifeCyle !== "string") {
        throw new TypeError("RootA lifeCycle should be a string");
      }
    }

    if (vertexes && !(vertexes instanceof Map)) {
      throw new TypeError("The vertexes parameter has to be a Map");
    }

    if (edges && !(Array.isArray(edges))) {
      throw new TypeError("The edges parameter has to be an array");
    }

    this.vertexes_ = vertexes || new Map();
    this.edges_ = edges || [];
    this.lifeCycles_ = lifeCycles;
  }

  addVertex(name, vertex, lifeCycle) {

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

    const iter = this.vertexes_.entries();
    let currentVertex = iter.next().value;

    while (currentVertex.name === name) {
      currentVertex = iter.next().value;
    }

    return currentVertex[1];
  }

  addEdge(edge) {

    this.edges_.push(edge);
  }

  getAdjacentVertexes(vertexName) {

    const ret = new Map();

    for (const edge of (this.edges_)) {

      if (edge[0] === vertexName) {
        ret.set(vertexName, this.getVertexData(edge[1]));
      }
    }

    return ret;
  }
};
