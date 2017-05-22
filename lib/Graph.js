/**
 * Represents a virtual cycle free graph of dependencies
 * @class
 * @type {Graph}
 */
module.exports = class Graph {

  /**
   * Constructs the graph instance
   * @constructor
   * @param {Object} lifeCycles The life cycle data with its methodsd
   * @param {Object} modifiers The modifier methods
   * @param {Map} vertexes The graph vertexes data container
   * @param {Set} edges The graph edges data container
   */
  constructor(lifeCycles, modifiers, vertexes, edges) {

    if (!lifeCycles) {
      throw new Error("The life cycles must be a parameter of the constructor");
    }

    if (!modifiers) {
      throw new Error("The modifiers must be a parameter of the constructor");
    }

    if (vertexes && !(vertexes instanceof Map)) {
      throw new TypeError("The vertexes parameter has to be a Map");
    }

    if (edges && !(edges instanceof Set)) {
      throw new TypeError("The edges parameter has to be a Set");
    }

    this.lifeCycles_ = lifeCycles;
    this.modifiers_ = modifiers;
    this.vertexes_ = vertexes || new Map();
    this.edges_ = edges || new Set();
  }

  /**
   * Adds new vertex to the vertex container
   * @param {string} name The name of the vertex
   * @param {*} vertex The actual vertex
   * @param {string} lifeCycle The life cycle of the vertex if that's supposed to be an instance of a class
   * @public
   * @returns {undefined}
   */
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

  /**
   * Returns the vertex data
   * @param {string} name The name of the vertex whose data is to returned
   * @returns {Object} The vertex data
   */
  getVertexData(name) {

    for (const [key, value] of this.vertexes_) {
      if (key === name) {

        const copy = {};

        for (const ownKey of Reflect.ownKeys(value)) {

          const desc = Reflect.getOwnPropertyDescriptor(value, ownKey);

          Reflect.defineProperty(copy, ownKey, desc);
        }
        return copy;
      }
    }
  }

  /**
   * Adds a new edge to the edge data container
   * @param {Array.<string>} edge The 2 element array which represents an adge in the graph
   * @returns {undefined}
   */
  addEdge(edge) {

    for (const storedEdge of this.edges_) {
      if ((edge[0] === storedEdge[0]) && (edge[1] === storedEdge[1])) {
        throw new Error("Duplicated edge");
      }
    }

    this.edges_.add(edge);
  }

  /**
   * Gets all the adjacent vertexes of one vertex
   * @param {string} vertexName The name of the veretex whode adjacents must be returned
   * @returns {Set} The set of the adjacent vertexes
   */
  getAdjacentVertexes(vertexName) {

    const chopped = this.modifiers_.factory.chop(this.modifiers_.optional.chop(vertexName));
    const ret = new Set();

    for (const edge of (this.edges_)) {
      if (edge[0] === chopped) {
        ret.add(edge[1]);
      }
    }

    return ret;
  }
};
