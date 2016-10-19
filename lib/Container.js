module.exports = class Container {

  constructor(graph, modifiers) {
    this.graph_ = graph;
    this.modifiers_ = modifiers;
    this.singletonCache_ = new Map();
  }

  getTamperedVertexData_(current) {

    if (this.modifiers_.optional.isOptional(current)) {

      const choppedOptional = this.modifiers_.optional.chop(current);

      return this.graph_.getVertexData(choppedOptional) || {"type": "optional"};
    }

    if (this.modifiers_.factory.isFactory(current)) {

      const choppedCurrent = this.modifiers_.factory.chop(current);
      const vertexData = this.graph_.getVertexData(choppedCurrent);

      if (vertexData && vertexData.type !== "class") {
        throw new Error("Only classes can be factorized");
      } else if (vertexData) {
        vertexData.type = "factory";
      }

      return vertexData;
    }

    return this.graph_.getVertexData(current);
  }

  createInjection_(current, dependencies, perRequestCache, rootParam) {

    const vertexData = this.getTamperedVertexData_(current);

    if (!vertexData) {
      throw new Error(`${current} hasn't been registered`);
    }

    switch (vertexData.type) {
      case "optional":
        return null;
      case "factory":
        return {
          get(param) {
            if (rootParam) {
              dependencies.push(rootParam);
            }
            dependencies.push(param);
            return Reflect.construct(vertexData.vertex, dependencies);
          }
        };
      case "class":
        switch (vertexData.lifeCycle) {
          case "unique":
            if (rootParam) {
              dependencies.push(rootParam);
            }
            return Reflect.construct(vertexData.vertex, dependencies);
          case "singleton":

            if (this.singletonCache_.has(current)) {
              return this.singletonCache_.get(current);
            }

            if (rootParam) {
              dependencies.push(rootParam);
            }

            const singletonInstance = Reflect.construct(vertexData.vertex, dependencies);

            this.singletonCache_.set(current, singletonInstance);
            return singletonInstance;
          default:

            if (perRequestCache.has(current)) {
              return perRequestCache.get(current);
            }

            if (rootParam) {
              dependencies.push(rootParam);
            }

            const perRequestInstance = Reflect.construct(vertexData.vertex, dependencies);

            perRequestCache.set(current, perRequestInstance);
            return perRequestInstance;
        }
      case "function":
        if (rootParam) {
          dependencies.push(rootParam);
        }
        return Reflect.apply(vertexData.vertex, null, dependencies);
      case "passThrough":
        return vertexData.vertex;
    }
  }

  dfs_(current, exploring, perRequestCache, param) {

    exploring.push(current);

    const childVertexes = this.graph_.getAdjacentVertexes(current);
    const dependencies = Array.from(childVertexes).map(childVertex => {

      if (exploring.includes(childVertex)) {
        throw new Error("A cycle has been detected");
      }

      return this.dfs_(childVertex, exploring, perRequestCache);
    });

    exploring.pop();

    return this.createInjection_(current, dependencies, perRequestCache, param);
  }

  get(name, param) {

    const vertexData = this.graph_.getVertexData(name);

    if (!vertexData) {
      throw new Error(`${name} hasn't been registered`);
    }

    return this.dfs_(name, [], new Map(), param);
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
};
