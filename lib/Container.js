module.exports = class Container {

  constructor(graph, singletonCache) {
    this.graph_ = graph;
    this.singletonCache = singletonCache;
    this.perRequestCache = new Map();
  }

  dfs_(current, exploring = []) {

    exploring.push(current);

    const childVertexes = this.graph_.getAdjacentVertexes(current);

    for (const childVertex of childVertexes) {

      if (exploring.includes(childVertex)) {
        throw new Error("A cycle has been detected");
      }

      this.dfs_(childVertex, exploring);
    }

    const vertexData = this.graph_.getVertexData(name);

    switch (vertexData.type) {
      case "class": {
        // !!! Continue from here !!!
        // const vertexInstance = (...args) => {return new vertexData.vertex(...args)(????)
      }
    }

    exploring.pop();
  }

  register(name, vertex, lifeCycle = "perRequest") {

    this.graph_.addVertex(name, vertex, lifeCycle);

    if (!vertex.$inject) {
      return;
    }

    if (vertex.$inject && !Array.isArray(vertex.$inject)) {
      throw new Error("The \"$inject\" list should be an array of strings");
    }

    if (vertex.$inject && Array.isArray(vertex.$inject)) {
      for (const inject of vertex.$inject) {
        if (typeof inject !== "string") {
          throw new Error("The \"$inject\" list should be an array of strings");
        }
      }
    }

    for (const inject of vertex.$inject) {
      this.graph_.addEdge([name, inject]);
    }
  }

  get(name, ...rest) {

    const vertexData = this.graph_.getVertexData(name);

    if (!vertexData) {
      throw new Error(`${name} hasn't been registered`);
    }

    this.dfs_(name);


  }
};
