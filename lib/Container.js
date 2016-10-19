module.exports = class Container {

  constructor(graph) {
    this.graph_ = graph;
    this.singletonCache_ = new Map();
  }

  dfs_(current, exploring = [], perRequestCache = new Map()) {

    exploring.push(current);

    const childVertexes = this.graph_.getAdjacentVertexes(current);
    const dependencies = Array.from(childVertexes).map(childVertex => {

      if (exploring.includes(childVertex)) {
        throw new Error("A cycle has been detected");
      }

      return this.dfs_(childVertex, exploring, perRequestCache);
    });

    const vertexData = this.graph_.getVertexData(current);

    exploring.pop();

    switch (vertexData.type) {
      case "class":
        switch (vertexData.lifeCycle) {
          case "unique":
            return Reflect.construct(vertexData.vertex, dependencies);
          case "singleton":

            if (this.singletonCache_.has(current)) {
              return this.singletonCache_.get(current);
            }

            const singletonInstance = Reflect.construct(vertexData.vertex, dependencies);

            this.singletonCache_.set(current, singletonInstance);
            return singletonInstance;
          default:

            if (perRequestCache.has(current)) {
              return perRequestCache.get(current);
            }

            const perRequestInstance = Reflect.construct(vertexData.vertex, dependencies);

            perRequestCache.set(current, perRequestInstance);
            return perRequestInstance;
        }
    }
  }

  register(name, vertex, lifeCycle) {

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
