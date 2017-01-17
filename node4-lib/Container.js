"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

const Composer = require("talentcomposer");

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
        const attributes = Reflect.ownKeys(targetProto).includes(key) ? {
          get: function get() {
            throw new Error(`The trait "${ key }" is conflicted`);
          },
          set: function set() {
            throw new Error(`The trait "${ key }" is conflicted`);
          }
        } : Reflect.getOwnPropertyDescriptor(source, key);

        Reflect.defineProperty(target, key, attributes);
      }
    }
  }

  getTamperedVertexData_(current) {

    if (this.modifiers_.optional.isOptional(current)) {

      const choppedOptional = this.modifiers_.optional.chop(current);

      return this.graph_.getVertexData(choppedOptional) || { "type": "optional" };
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

    const talents = vertexData.vertex.$compose.map(talentName => {

      if (typeof talentName !== "string") {
        throw new Error("The \"$compose\" list should be an array of strings");
      }

      const talentData = this.graph_.getVertexData(talentName);

      if (!talentData) {
        throw new Error(`The talent "${ talentName }" is not registered`);
      }

      if (talentData.type !== "passThrough") {
        throw new Error(`The talent "${ talentName }" has to be a talent created by the "#createTalent" method`);
      }

      return talentData.vertex;
    });

    return Composer.composeWithTalents.apply(Composer, [instance].concat(_toConsumableArray(talents)));
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

  createInjection_(current, dependencies, perRequestCache) {

    const vertexData = this.getTamperedVertexData_(current);

    for (var _len = arguments.length, extraParams = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
      extraParams[_key - 3] = arguments[_key];
    }

    const args = [].concat(_toConsumableArray(dependencies), extraParams);

    if (!vertexData) {
      throw new Error(`${ current } hasn't been registered`);
    }

    switch (vertexData.type) {
      case "optional":
        return null;
      case "factory":
        return {
          get: function get() {
            for (var _len2 = arguments.length, factoryParams = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
              factoryParams[_key2] = arguments[_key2];
            }

            return Reflect.construct(vertexData.vertex, [].concat(_toConsumableArray(args), _toConsumableArray(factoryParams)));
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

  dfs_(current, exploring, perRequestCache) {

    exploring.push(current);

    const childVertexes = this.graph_.getAdjacentVertexes(current);
    const dependencies = Array.from(childVertexes).map(childVertex => {

      if (exploring.includes(childVertex)) {
        throw new Error("A cycle has been detected");
      }

      return this.dfs_(childVertex, exploring, perRequestCache);
    });

    exploring.pop();

    for (var _len3 = arguments.length, extraParams = Array(_len3 > 3 ? _len3 - 3 : 0), _key3 = 3; _key3 < _len3; _key3++) {
      extraParams[_key3 - 3] = arguments[_key3];
    }

    return this.createInjection_.apply(this, [current, dependencies, perRequestCache].concat(extraParams));
  }

  get(name) {

    const vertexData = this.graph_.getVertexData(this.modifiers_.factory.chop(name));

    if (!vertexData) {
      throw new Error(`${ name } hasn't been registered`);
    }

    for (var _len4 = arguments.length, extraParams = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      extraParams[_key4 - 1] = arguments[_key4];
    }

    return this.dfs_.apply(this, [name, [], new Map()].concat(extraParams));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9Db250YWluZXIuanMiXSwibmFtZXMiOlsiQ29tcG9zZXIiLCJyZXF1aXJlIiwibW9kdWxlIiwiZXhwb3J0cyIsIkNvbnRhaW5lciIsImNvbnN0cnVjdG9yIiwiZ3JhcGgiLCJtb2RpZmllcnMiLCJncmFwaF8iLCJtb2RpZmllcnNfIiwic2luZ2xldG9uQ2FjaGVfIiwiTWFwIiwiY29weVByb3BlcnRpZXMiLCJzb3VyY2UiLCJ0YXJnZXQiLCJrZXkiLCJSZWZsZWN0Iiwib3duS2V5cyIsInRhcmdldFByb3RvIiwiZ2V0UHJvdG90eXBlT2YiLCJhdHRyaWJ1dGVzIiwiaW5jbHVkZXMiLCJnZXQiLCJFcnJvciIsInNldCIsImdldE93blByb3BlcnR5RGVzY3JpcHRvciIsImRlZmluZVByb3BlcnR5IiwiZ2V0VGFtcGVyZWRWZXJ0ZXhEYXRhXyIsImN1cnJlbnQiLCJvcHRpb25hbCIsImlzT3B0aW9uYWwiLCJjaG9wcGVkT3B0aW9uYWwiLCJjaG9wIiwiZ2V0VmVydGV4RGF0YSIsImZhY3RvcnkiLCJpc0ZhY3RvcnkiLCJjaG9wcGVkQ3VycmVudCIsInZlcnRleERhdGEiLCJ0eXBlIiwiY29tcG9zZV8iLCJpbnN0YW5jZSIsInZlcnRleCIsIiRjb21wb3NlIiwiQXJyYXkiLCJpc0FycmF5IiwidGFsZW50cyIsIm1hcCIsInRhbGVudE5hbWUiLCJ0YWxlbnREYXRhIiwiY29tcG9zZVdpdGhUYWxlbnRzIiwiY3JlYXRlSW5qZWN0aW9uRm9yQ2xhc3NfIiwiYXJncyIsInBlclJlcXVlc3RDYWNoZSIsImxpZmVDeWNsZSIsImNvbnN0cnVjdCIsImhhcyIsInNpbmdsZXRvbkluc3RhbmNlIiwicGVyUmVxdWVzdEluc3RhbmNlIiwiY3JlYXRlSW5qZWN0aW9uXyIsImRlcGVuZGVuY2llcyIsImV4dHJhUGFyYW1zIiwiZmFjdG9yeVBhcmFtcyIsImFwcGx5IiwiZGZzXyIsImV4cGxvcmluZyIsInB1c2giLCJjaGlsZFZlcnRleGVzIiwiZ2V0QWRqYWNlbnRWZXJ0ZXhlcyIsImZyb20iLCJjaGlsZFZlcnRleCIsInBvcCIsIm5hbWUiLCJyZWdpc3RlciIsImFkZFZlcnRleCIsIiRpbmplY3QiLCJpbmplY3QiLCJhZGRFZGdlIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUEsTUFBTUEsV0FBV0MsUUFBUSxnQkFBUixDQUFqQjs7QUFFQUMsT0FBT0MsT0FBUCxHQUFpQixNQUFNQyxTQUFOLENBQWdCOztBQUUvQkMsY0FBWUMsS0FBWixFQUFtQkMsU0FBbkIsRUFBOEI7QUFDNUIsU0FBS0MsTUFBTCxHQUFjRixLQUFkO0FBQ0EsU0FBS0csVUFBTCxHQUFrQkYsU0FBbEI7QUFDQSxTQUFLRyxlQUFMLEdBQXVCLElBQUlDLEdBQUosRUFBdkI7QUFDRDs7QUFFRCxTQUFPQyxjQUFQLENBQXNCQyxNQUF0QixFQUE4QkMsTUFBOUIsRUFBc0M7O0FBRXBDLFNBQUssTUFBTUMsR0FBWCxJQUFrQkMsUUFBUUMsT0FBUixDQUFnQkosTUFBaEIsQ0FBbEIsRUFBMkM7O0FBRXpDLFVBQUlFLFFBQVEsYUFBWixFQUEyQjs7QUFFekIsY0FBTUcsY0FBY0YsUUFBUUcsY0FBUixDQUF1QkwsTUFBdkIsQ0FBcEI7QUFDQSxjQUFNTSxhQUFjSixRQUFRQyxPQUFSLENBQWdCQyxXQUFoQixFQUE2QkcsUUFBN0IsQ0FBc0NOLEdBQXRDLENBQUQsR0FBK0M7QUFDaEVPLGFBRGdFLGlCQUMxRDtBQUNKLGtCQUFNLElBQUlDLEtBQUosQ0FBVyxlQUFhUixHQUFJLGtCQUE1QixDQUFOO0FBQ0QsV0FIK0Q7QUFJaEVTLGFBSmdFLGlCQUkxRDtBQUNKLGtCQUFNLElBQUlELEtBQUosQ0FBVyxlQUFhUixHQUFJLGtCQUE1QixDQUFOO0FBQ0Q7QUFOK0QsU0FBL0MsR0FPZkMsUUFBUVMsd0JBQVIsQ0FBaUNaLE1BQWpDLEVBQXlDRSxHQUF6QyxDQVBKOztBQVNBQyxnQkFBUVUsY0FBUixDQUF1QlosTUFBdkIsRUFBK0JDLEdBQS9CLEVBQW9DSyxVQUFwQztBQUNEO0FBQ0Y7QUFDRjs7QUFFRE8seUJBQXVC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LElBQXhCLENBQTZCdUMsSUFBN0IsQ0FBMUIsQ0FBbkI7O0FBRUEsUUFBSSxDQUFDbEMsVUFBTCxFQUFpQjtBQUNmLFlBQU0sSUFBSWQsS0FBSixDQUFXLElBQUVnRCxJQUFLLDBCQUFsQixDQUFOO0FBQ0Q7O0FBTnVCLHVDQUFiWCxXQUFhO0FBQWJBLGlCQUFhO0FBQUE7O0FBUXhCLFdBQU8sS0FBS0csSUFBTCxjQUFVUSxJQUFWLEVBQWdCLEVBQWhCLEVBQW9CLElBQUk1RCxHQUFKLEVBQXBCLFNBQWtDaUQsV0FBbEMsRUFBUDtBQUNEOztBQUVEWSxXQUFTRCxJQUFULEVBQWU5QixNQUFmLEVBQXVCWSxTQUF2QixFQUFrQzs7QUFFaEMsU0FBSzdDLE1BQUwsQ0FBWWlFLFNBQVosQ0FBc0JGLElBQXRCLEVBQTRCOUIsTUFBNUIsRUFBb0NZLFNBQXBDOztBQUVBLFFBQUksQ0FBQ1osT0FBT2lDLE9BQVosRUFBcUI7QUFDbkI7QUFDRDs7QUFFRCxRQUFJLENBQUMvQixNQUFNQyxPQUFOLENBQWNILE9BQU9pQyxPQUFyQixDQUFMLEVBQW9DO0FBQ2xDLFlBQU0sSUFBSW5ELEtBQUosQ0FBVSxvREFBVixDQUFOO0FBQ0Q7O0FBRUQsU0FBSyxNQUFNb0QsTUFBWCxJQUFxQmxDLE9BQU9pQyxPQUE1QixFQUFxQzs7QUFFbkMsVUFBSSxPQUFPQyxNQUFQLEtBQWtCLFFBQXRCLEVBQWdDO0FBQzlCLGNBQU0sSUFBSXBELEtBQUosQ0FBVSxvREFBVixDQUFOO0FBQ0Q7O0FBRUQsV0FBS2YsTUFBTCxDQUFZb0UsT0FBWixDQUFvQixDQUFDTCxJQUFELEVBQU9JLE1BQVAsQ0FBcEI7QUFDRDtBQUNGO0FBbE04QixDQUFqQyIsImZpbGUiOiJDb250YWluZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBDb21wb3NlciA9IHJlcXVpcmUoXCJ0YWxlbnRjb21wb3NlclwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb250YWluZXIge1xuXG4gIGNvbnN0cnVjdG9yKGdyYXBoLCBtb2RpZmllcnMpIHtcbiAgICB0aGlzLmdyYXBoXyA9IGdyYXBoO1xuICAgIHRoaXMubW9kaWZpZXJzXyA9IG1vZGlmaWVycztcbiAgICB0aGlzLnNpbmdsZXRvbkNhY2hlXyA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIHN0YXRpYyBjb3B5UHJvcGVydGllcyhzb3VyY2UsIHRhcmdldCkge1xuXG4gICAgZm9yIChjb25zdCBrZXkgb2YgUmVmbGVjdC5vd25LZXlzKHNvdXJjZSkpIHtcblxuICAgICAgaWYgKGtleSAhPT0gXCJjb25zdHJ1Y3RvclwiKSB7XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0UHJvdG8gPSBSZWZsZWN0LmdldFByb3RvdHlwZU9mKHRhcmdldCk7XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSAoUmVmbGVjdC5vd25LZXlzKHRhcmdldFByb3RvKS5pbmNsdWRlcyhrZXkpKSA/IHtcbiAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSB0cmFpdCBcIiR7a2V5fVwiIGlzIGNvbmZsaWN0ZWRgKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNldCgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIHRyYWl0IFwiJHtrZXl9XCIgaXMgY29uZmxpY3RlZGApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSA6IFJlZmxlY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHNvdXJjZSwga2V5KTtcblxuICAgICAgICBSZWZsZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCBhdHRyaWJ1dGVzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRUYW1wZXJlZFZlcnRleERhdGFfKGN1cnJlbnQpIHtcblxuICAgIGlmICh0aGlzLm1vZGlmaWVyc18ub3B0aW9uYWwuaXNPcHRpb25hbChjdXJyZW50KSkge1xuXG4gICAgICBjb25zdCBjaG9wcGVkT3B0aW9uYWwgPSB0aGlzLm1vZGlmaWVyc18ub3B0aW9uYWwuY2hvcChjdXJyZW50KTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ3JhcGhfLmdldFZlcnRleERhdGEoY2hvcHBlZE9wdGlvbmFsKSB8fCB7XCJ0eXBlXCI6IFwib3B0aW9uYWxcIn07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubW9kaWZpZXJzXy5mYWN0b3J5LmlzRmFjdG9yeShjdXJyZW50KSkge1xuXG4gICAgICBjb25zdCBjaG9wcGVkQ3VycmVudCA9IHRoaXMubW9kaWZpZXJzXy5mYWN0b3J5LmNob3AoY3VycmVudCk7XG4gICAgICBjb25zdCB2ZXJ0ZXhEYXRhID0gdGhpcy5ncmFwaF8uZ2V0VmVydGV4RGF0YShjaG9wcGVkQ3VycmVudCk7XG5cbiAgICAgIGlmICh2ZXJ0ZXhEYXRhICYmIHZlcnRleERhdGEudHlwZSAhPT0gXCJjbGFzc1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9ubHkgY2xhc3NlcyBjYW4gYmUgZmFjdG9yaXplZFwiKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHZlcnRleERhdGEpIHtcbiAgICAgICAgdmVydGV4RGF0YS50eXBlID0gXCJmYWN0b3J5XCI7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2ZXJ0ZXhEYXRhO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmdyYXBoXy5nZXRWZXJ0ZXhEYXRhKGN1cnJlbnQpO1xuICB9XG5cbiAgY29tcG9zZV8odmVydGV4RGF0YSwgaW5zdGFuY2UpIHtcblxuICAgIGlmICghdmVydGV4RGF0YS52ZXJ0ZXguJGNvbXBvc2UpIHtcbiAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmVydGV4RGF0YS52ZXJ0ZXguJGNvbXBvc2UpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgXFxcIiRjb21wb3NlXFxcIiBsaXN0IHNob3VsZCBiZSBhbiBhcnJheSBvZiBzdHJpbmdzXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHRhbGVudHMgPSB2ZXJ0ZXhEYXRhLnZlcnRleC4kY29tcG9zZS5tYXAodGFsZW50TmFtZSA9PiB7XG5cbiAgICAgIGlmICh0eXBlb2YgdGFsZW50TmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgXFxcIiRjb21wb3NlXFxcIiBsaXN0IHNob3VsZCBiZSBhbiBhcnJheSBvZiBzdHJpbmdzXCIpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0YWxlbnREYXRhID0gdGhpcy5ncmFwaF8uZ2V0VmVydGV4RGF0YSh0YWxlbnROYW1lKTtcblxuICAgICAgaWYgKCF0YWxlbnREYXRhKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIHRhbGVudCBcIiR7dGFsZW50TmFtZX1cIiBpcyBub3QgcmVnaXN0ZXJlZGApO1xuICAgICAgfVxuXG4gICAgICBpZiAodGFsZW50RGF0YS50eXBlICE9PSBcInBhc3NUaHJvdWdoXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgdGFsZW50IFwiJHt0YWxlbnROYW1lfVwiIGhhcyB0byBiZSBhIHRhbGVudCBjcmVhdGVkIGJ5IHRoZSBcIiNjcmVhdGVUYWxlbnRcIiBtZXRob2RgKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRhbGVudERhdGEudmVydGV4O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIENvbXBvc2VyLmNvbXBvc2VXaXRoVGFsZW50cyhpbnN0YW5jZSwgLi4udGFsZW50cyk7XG4gIH1cblxuICBjcmVhdGVJbmplY3Rpb25Gb3JDbGFzc18odmVydGV4RGF0YSwgYXJncywgY3VycmVudCwgcGVyUmVxdWVzdENhY2hlKSB7XG5cbiAgICBzd2l0Y2ggKHZlcnRleERhdGEubGlmZUN5Y2xlKSB7XG4gICAgICBjYXNlIFwidW5pcXVlXCI6XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBvc2VfKHZlcnRleERhdGEsIFJlZmxlY3QuY29uc3RydWN0KHZlcnRleERhdGEudmVydGV4LCBhcmdzKSk7XG4gICAgICBjYXNlIFwic2luZ2xldG9uXCI6XG5cbiAgICAgICAgaWYgKHRoaXMuc2luZ2xldG9uQ2FjaGVfLmhhcyhjdXJyZW50KSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnNpbmdsZXRvbkNhY2hlXy5nZXQoY3VycmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzaW5nbGV0b25JbnN0YW5jZSA9IHRoaXMuY29tcG9zZV8odmVydGV4RGF0YSwgUmVmbGVjdC5jb25zdHJ1Y3QodmVydGV4RGF0YS52ZXJ0ZXgsIGFyZ3MpKTtcblxuICAgICAgICB0aGlzLnNpbmdsZXRvbkNhY2hlXy5zZXQoY3VycmVudCwgc2luZ2xldG9uSW5zdGFuY2UpO1xuICAgICAgICByZXR1cm4gc2luZ2xldG9uSW5zdGFuY2U7XG4gICAgICBkZWZhdWx0OlxuXG4gICAgICAgIGlmIChwZXJSZXF1ZXN0Q2FjaGUuaGFzKGN1cnJlbnQpKSB7XG4gICAgICAgICAgcmV0dXJuIHBlclJlcXVlc3RDYWNoZS5nZXQoY3VycmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwZXJSZXF1ZXN0SW5zdGFuY2UgPSB0aGlzLmNvbXBvc2VfKHZlcnRleERhdGEsIFJlZmxlY3QuY29uc3RydWN0KHZlcnRleERhdGEudmVydGV4LCBhcmdzKSk7XG5cbiAgICAgICAgcGVyUmVxdWVzdENhY2hlLnNldChjdXJyZW50LCBwZXJSZXF1ZXN0SW5zdGFuY2UpO1xuICAgICAgICByZXR1cm4gcGVyUmVxdWVzdEluc3RhbmNlO1xuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZUluamVjdGlvbl8oY3VycmVudCwgZGVwZW5kZW5jaWVzLCBwZXJSZXF1ZXN0Q2FjaGUsIC4uLmV4dHJhUGFyYW1zKSB7XG5cbiAgICBjb25zdCB2ZXJ0ZXhEYXRhID0gdGhpcy5nZXRUYW1wZXJlZFZlcnRleERhdGFfKGN1cnJlbnQpO1xuICAgIGNvbnN0IGFyZ3MgPSBbLi4uZGVwZW5kZW5jaWVzLCAuLi5leHRyYVBhcmFtc107XG5cbiAgICBpZiAoIXZlcnRleERhdGEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtjdXJyZW50fSBoYXNuJ3QgYmVlbiByZWdpc3RlcmVkYCk7XG4gICAgfVxuXG4gICAgc3dpdGNoICh2ZXJ0ZXhEYXRhLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJvcHRpb25hbFwiOlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIGNhc2UgXCJmYWN0b3J5XCI6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZ2V0KC4uLmZhY3RvcnlQYXJhbXMpIHtcbiAgICAgICAgICAgIHJldHVybiBSZWZsZWN0LmNvbnN0cnVjdCh2ZXJ0ZXhEYXRhLnZlcnRleCwgWy4uLmFyZ3MsIC4uLmZhY3RvcnlQYXJhbXNdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICBjYXNlIFwiY2xhc3NcIjpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlSW5qZWN0aW9uRm9yQ2xhc3NfKHZlcnRleERhdGEsIGFyZ3MsIGN1cnJlbnQsIHBlclJlcXVlc3RDYWNoZSk7XG4gICAgICBjYXNlIFwiZnVuY3Rpb25cIjpcbiAgICAgICAgcmV0dXJuIFJlZmxlY3QuYXBwbHkodmVydGV4RGF0YS52ZXJ0ZXgsIG51bGwsIGFyZ3MpO1xuICAgICAgY2FzZSBcInBhc3NUaHJvdWdoXCI6XG4gICAgICAgIHJldHVybiB2ZXJ0ZXhEYXRhLnZlcnRleDtcbiAgICB9XG4gIH1cblxuICBkZnNfKGN1cnJlbnQsIGV4cGxvcmluZywgcGVyUmVxdWVzdENhY2hlLCAuLi5leHRyYVBhcmFtcykge1xuXG4gICAgZXhwbG9yaW5nLnB1c2goY3VycmVudCk7XG5cbiAgICBjb25zdCBjaGlsZFZlcnRleGVzID0gdGhpcy5ncmFwaF8uZ2V0QWRqYWNlbnRWZXJ0ZXhlcyhjdXJyZW50KTtcbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBBcnJheS5mcm9tKGNoaWxkVmVydGV4ZXMpLm1hcChjaGlsZFZlcnRleCA9PiB7XG5cbiAgICAgIGlmIChleHBsb3JpbmcuaW5jbHVkZXMoY2hpbGRWZXJ0ZXgpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkEgY3ljbGUgaGFzIGJlZW4gZGV0ZWN0ZWRcIik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmRmc18oY2hpbGRWZXJ0ZXgsIGV4cGxvcmluZywgcGVyUmVxdWVzdENhY2hlKTtcbiAgICB9KTtcblxuICAgIGV4cGxvcmluZy5wb3AoKTtcblxuICAgIHJldHVybiB0aGlzLmNyZWF0ZUluamVjdGlvbl8oY3VycmVudCwgZGVwZW5kZW5jaWVzLCBwZXJSZXF1ZXN0Q2FjaGUsIC4uLmV4dHJhUGFyYW1zKTtcbiAgfVxuXG4gIGdldChuYW1lLCAuLi5leHRyYVBhcmFtcykge1xuXG4gICAgY29uc3QgdmVydGV4RGF0YSA9IHRoaXMuZ3JhcGhfLmdldFZlcnRleERhdGEodGhpcy5tb2RpZmllcnNfLmZhY3RvcnkuY2hvcChuYW1lKSk7XG5cbiAgICBpZiAoIXZlcnRleERhdGEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtuYW1lfSBoYXNuJ3QgYmVlbiByZWdpc3RlcmVkYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZGZzXyhuYW1lLCBbXSwgbmV3IE1hcCgpLCAuLi5leHRyYVBhcmFtcyk7XG4gIH1cblxuICByZWdpc3RlcihuYW1lLCB2ZXJ0ZXgsIGxpZmVDeWNsZSkge1xuXG4gICAgdGhpcy5ncmFwaF8uYWRkVmVydGV4KG5hbWUsIHZlcnRleCwgbGlmZUN5Y2xlKTtcblxuICAgIGlmICghdmVydGV4LiRpbmplY3QpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmVydGV4LiRpbmplY3QpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgXFxcIiRpbmplY3RcXFwiIGxpc3Qgc2hvdWxkIGJlIGFuIGFycmF5IG9mIHN0cmluZ3NcIik7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBpbmplY3Qgb2YgdmVydGV4LiRpbmplY3QpIHtcblxuICAgICAgaWYgKHR5cGVvZiBpbmplY3QgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIFxcXCIkaW5qZWN0XFxcIiBsaXN0IHNob3VsZCBiZSBhbiBhcnJheSBvZiBzdHJpbmdzXCIpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmdyYXBoXy5hZGRFZGdlKFtuYW1lLCBpbmplY3RdKTtcbiAgICB9XG4gIH1cbn07XG4iXX0=
