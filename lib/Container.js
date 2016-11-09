module.exports = class Container {

  constructor(graph, modifiers) {
    this.graph_ = graph;
    this.modifiers_ = modifiers;
    this.singletonCache_ = new Map();
  }

  static copyProperties(source, target) {

    for (const key of Reflect.ownKeys(source)) {

      if (key !== "constructor") {

        const targetProto = Reflect.getPrototypeOf(target);
        const attributes = (Reflect.ownKeys(targetProto).includes(key)) ? {
          get() {
            throw new Error(`The trait "${key}" is conflicted`);
          },
          set() {
            throw new Error(`The trait "${key}" is conflicted`);
          }
        } : Reflect.getOwnPropertyDescriptor(source, key);

        Reflect.defineProperty(target, key, attributes);
      }
    }
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
      }

      if (vertexData) {
        vertexData.type = "factory";
      }

      return vertexData;
    }

    return this.graph_.getVertexData(current);
  }

  compose_(vertexData, instance) {

    if (!vertexData.vertex.$compose) {
      return instance;
    }

    if (!Array.isArray(vertexData.vertex.$compose)) {
      throw new Error("The \"$compose\" list should be an array of strings");
    }

    for (const trait of vertexData.vertex.$compose) {

      if (typeof trait !== "string") {
        throw new Error("The \"$compose\" list should be an array of strings");
      }

      const traitData = this.graph_.getVertexData(trait);

      if (!traitData) {
        throw new Error(`The trait "${trait}" is not registered`);
      }

      switch (traitData.type) {
        case "class":
          Container.copyProperties(traitData.vertex.prototype, instance);
          break;
        case "function":

          const fakePrototype = {};

          fakePrototype[traitData.vertex.name] = traitData.vertex;
          Container.copyProperties(fakePrototype, instance);
      }
    }
    return instance;
  }

  createInjectionForClass_(vertexData, args, current, perRequestCache) {

    switch (vertexData.lifeCycle) {
      case "unique":
        return this.compose_(vertexData, Reflect.construct(vertexData.vertex, args));
      case "singleton":

        if (this.singletonCache_.has(current)) {
          return this.singletonCache_.get(current);
        }

        const singletonInstance = this.compose_(vertexData, Reflect.construct(vertexData.vertex, args));

        this.singletonCache_.set(current, singletonInstance);
        return singletonInstance;
      default:

        if (perRequestCache.has(current)) {
          return perRequestCache.get(current);
        }

        const perRequestInstance = this.compose_(vertexData, Reflect.construct(vertexData.vertex, args));

        perRequestCache.set(current, perRequestInstance);
        return perRequestInstance;
    }
  }

  createInjection_(current, dependencies, perRequestCache, ...extraParams) {

    const vertexData = this.getTamperedVertexData_(current);
    const args = [...dependencies, ...extraParams];

    if (!vertexData) {
      throw new Error(`${current} hasn't been registered`);
    }

    switch (vertexData.type) {
      case "optional":
        return null;
      case "factory":
        return {
          get(...factoryParams) {
            return Reflect.construct(vertexData.vertex, [...args, ...factoryParams]);
          }
        };
      case "class":
        return this.createInjectionForClass_(vertexData, args, current, perRequestCache);
      case "function":
        return Reflect.apply(vertexData.vertex, null, args);
      case "passThrough":
        return vertexData.vertex;
    }
  }

  dfs_(current, exploring, perRequestCache, ...extraParams) {

    exploring.push(current);

    const childVertexes = this.graph_.getAdjacentVertexes(current);
    const dependencies = Array.from(childVertexes).map(childVertex => {

      if (exploring.includes(childVertex)) {
        throw new Error("A cycle has been detected");
      }

      return this.dfs_(childVertex, exploring, perRequestCache);
    });

    exploring.pop();

    return this.createInjection_(current, dependencies, perRequestCache, ...extraParams);
  }

  get(name, ...extraParams) {

    const vertexData = this.graph_.getVertexData(this.modifiers_.factory.chop(name));

    if (!vertexData) {
      throw new Error(`${name} hasn't been registered`);
    }

    return this.dfs_(name, [], new Map(), ...extraParams);
  }

  register(name, vertex, lifeCycle) {

    this.graph_.addVertex(name, vertex, lifeCycle);

    if (!vertex.$inject) {
      return;
    }

    if (!Array.isArray(vertex.$inject)) {
      throw new Error("The \"$inject\" list should be an array of strings");
    }

    for (const inject of vertex.$inject) {

      if (typeof inject !== "string") {
        throw new Error("The \"$inject\" list should be an array of strings");
      }

      this.graph_.addEdge([name, inject]);
    }
  }
};
