module.exports = class Container {

  constructor(graph, singletonCache) {
    this.graph_ = graph;
    this.singletonCache = singletonCache;
    this.perRequestCache = new Map();
  }

  dfs_(current, exploring = []) {

    exploring.push(current);

    const childVertexes = this.graph_.getAdjacentVertexes(current);
    const dependencies = Array.from(childVertexes).map(childVertex => {

      if (exploring.includes(childVertex)) {
        throw new Error("A cycle has been detected");
      }

      return this.dfs_(childVertex, exploring);
    });

    const vertexData = this.graph_.getVertexData(current);

    exploring.pop();

    switch (vertexData.type) {
      case "class": {
        return Reflect.apply((...args) => new vertexData.vertex(...args), null, dependencies);
      }
    }
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

  get(name) {

    const vertexData = this.graph_.getVertexData(name);

    if (!vertexData) {
      throw new Error(`${name} hasn't been registered`);
    }

    return this.dfs_(name);
  }
};
