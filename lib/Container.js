const Composer = require("talentcomposer");

/**
 * Represents the ioc container instance
 * @class
 * @type {Container}
 */
module.exports = class Container {

  /**
   * Constructs the instance
   * @constructor
   * @param {Graph} graph The graph instance
   * @param {Object} modifiers The vertex modifiers like instead of the vertex a factory which can create the vertex must be returned or the the vertex is optional
   */
  constructor(graph, modifiers) {
    this.graph_ = graph;
    this.modifiers_ = modifiers;
    this.singletonCache_ = new Map();
  }

  /**
   * Returns the vertex data and tampers it using modifiers if necessary
   * @param {string} current The name of the current vertex in traversal
   * @private
   * @returns {Object} The data which belongs to the current vertex
   */
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

  /**
   * Parses the talent names as clauses
   * @param {string} talentName The talent clause
   * @private
   * @returns {Object} The name, optional alias and the optional exclusion marker for the talent
   */
  parseTalentName_(talentName) {

    const re1 = /[^:]*/;
    const re2 = /[^:]*$/;
    const re3 = /\,/;
    const re4 = /\>/;
    const re5 = /\-/;
    const re6 = /[^-]*/;
    const name = re1[Symbol.match](talentName)[0].trim();
    let resolutions = re2[Symbol.match](talentName)[0].trim();

    resolutions = re3[Symbol.split](resolutions).map(match => match.trim());

    const aliases = resolutions.reduce((accu, resolution) => {

      if (re4.test(resolution)) {

        accu.push(re4[Symbol.split](resolution).map(match => match.trim()));
      }

      return accu;
    }, []);
    const excludes = resolutions.reduce((accu, resolution) => {

      if (re5.test(resolution)) {

        accu.push(re6[Symbol.match](resolution).map(match => match.trim()));
      }

      return accu;
    }, []);

    return {name, aliases, excludes};
  }

  /**
   * Composes the instance with talents using talentcomposer library
   * @param {Object} vertexData The data belonging to the vertex
   * @param {Object} instance The instance to compose with
   * @private
   * @returns {*} Whatever talentcomposer returns (Hopefully a composed instance)
   */
  compose_(vertexData, instance) {

    if (!vertexData.vertex.$compose) {
      return instance;
    }

    if (!Array.isArray(vertexData.vertex.$compose)) {
      throw new Error("The \"$compose\" list should be an array of strings");
    }

    const talents = vertexData.vertex.$compose.map(talentName => {

      if (typeof talentName !== "string") {
        throw new Error("The \"$compose\" list should be an array of strings");
      }

      const {name, aliases, excludes} = this.parseTalentName_(talentName);

      const talentData = this.graph_.getVertexData(name);

      if (!talentData) {
        throw new Error(`The talent "${talentName}" is not registered`);
      }

      if (talentData.type !== "passThrough") {
        throw new Error(`The talent "${talentName}" has to be a talent created by the "#createTalent" method`);
      }

      let ret = talentData.vertex;

      if (aliases.length) {

        for (const alias of aliases) {

          ret = Composer.alias(ret, alias[0], alias[1]);
        }
      }

      if (excludes.length) {

        for (const exclude of excludes) {

          ret = Composer.exclude(ret, exclude[0]);
        }
      }

      return ret;
    });

    return Composer.composeWithTalents(instance, ...talents);
  }

  /**
   * Prepares injection for a class
   * @param {Object} vertexData The data belonging to the vertex
   * @param {Array.<*>} args The dependencies to inject and extra params together
   * @param {string} current The name of the current vertex in traversal
   * @param {Object} perRequestCache The cache where the per request singletons are
   * @private
   * @returns {Object} The prepared instance ready to be injected/returned
   */
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

  /**
   * Prepares injection for a generic vertex
   * @param {string} current The name of the current vertex in traversal
   * @param {string} dependencies The returned/instantiated dependencies for this vertex
   * @param {Object} perRequestCache The cache where the per request singletons are
   * @param {...*} extraParams The extra parameters specified runtime
   * @private
   * @returns {Object} The prepared vertex ready to be injected/returned
   */
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

  /**
   * The !!!core!!! The implemented dfs(depth first) traverse algorythm
   * @param {string} current The name of the current vertex in traversal
   * @param {Array.<Object>} exploring The vertexes under exploration
   * @param {Object} perRequestCache The cache where the per request singletons are
   * @param {...*} extraParams The extra parameters specified runtime
   * @private
   * @returns {*} The result of traversal
   */
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

  /**
   * Returns a prepared vertex fro the graph (The actual request)
   * @param {string} name The name of the vertex
   * @param {...*} extraParams The extra parameters specified runtime
   * @public
   * @returns {*} The result of the request
   */
  get(name, ...extraParams) {

    const vertexData = this.graph_.getVertexData(this.modifiers_.factory.chop(name));

    if (!vertexData) {
      throw new Error(`${name} hasn't been registered`);
    }

    return this.dfs_(name, [], new Map(), ...extraParams);
  }

  /**
   * Registers a vertex on the container and put it into the graph
   * @param {string} name The name of the vertex on the container
   * @param {*} vertex The actual physical vertex to register
   * @param {"unique"|"perRequest"|"singleton"} lifeCycle The life cycle specifier for an instance
   * @public
   * @returns {undefined}
   */
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
