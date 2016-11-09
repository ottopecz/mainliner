"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

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

    for (const trait of vertexData.vertex.$compose) {

      if (typeof trait !== "string") {
        throw new Error("The \"$compose\" list should be an array of strings");
      }

      const traitData = this.graph_.getVertexData(trait);

      if (!traitData) {
        throw new Error(`The trait "${ trait }" is not registered`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9Db250YWluZXIuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIkNvbnRhaW5lciIsImNvbnN0cnVjdG9yIiwiZ3JhcGgiLCJtb2RpZmllcnMiLCJncmFwaF8iLCJtb2RpZmllcnNfIiwic2luZ2xldG9uQ2FjaGVfIiwiTWFwIiwiY29weVByb3BlcnRpZXMiLCJzb3VyY2UiLCJ0YXJnZXQiLCJrZXkiLCJSZWZsZWN0Iiwib3duS2V5cyIsInRhcmdldFByb3RvIiwiZ2V0UHJvdG90eXBlT2YiLCJhdHRyaWJ1dGVzIiwiaW5jbHVkZXMiLCJnZXQiLCJFcnJvciIsInNldCIsImdldE93blByb3BlcnR5RGVzY3JpcHRvciIsImRlZmluZVByb3BlcnR5IiwiZ2V0VGFtcGVyZWRWZXJ0ZXhEYXRhXyIsImN1cnJlbnQiLCJvcHRpb25hbCIsImlzT3B0aW9uYWwiLCJjaG9wcGVkT3B0aW9uYWwiLCJjaG9wIiwiZ2V0VmVydGV4RGF0YSIsImZhY3RvcnkiLCJpc0ZhY3RvcnkiLCJjaG9wcGVkQ3VycmVudCIsInZlcnRleERhdGEiLCJ0eXBlIiwiY29tcG9zZV8iLCJpbnN0YW5jZSIsInZlcnRleCIsIiRjb21wb3NlIiwiQXJyYXkiLCJpc0FycmF5IiwidHJhaXQiLCJ0cmFpdERhdGEiLCJwcm90b3R5cGUiLCJmYWtlUHJvdG90eXBlIiwibmFtZSIsImNyZWF0ZUluamVjdGlvbkZvckNsYXNzXyIsImFyZ3MiLCJwZXJSZXF1ZXN0Q2FjaGUiLCJsaWZlQ3ljbGUiLCJjb25zdHJ1Y3QiLCJoYXMiLCJzaW5nbGV0b25JbnN0YW5jZSIsInBlclJlcXVlc3RJbnN0YW5jZSIsImNyZWF0ZUluamVjdGlvbl8iLCJkZXBlbmRlbmNpZXMiLCJleHRyYVBhcmFtcyIsImZhY3RvcnlQYXJhbXMiLCJhcHBseSIsImRmc18iLCJleHBsb3JpbmciLCJwdXNoIiwiY2hpbGRWZXJ0ZXhlcyIsImdldEFkamFjZW50VmVydGV4ZXMiLCJmcm9tIiwibWFwIiwiY2hpbGRW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QkYsSUFBeEIsQ0FBNkJpQixJQUE3QixDQUExQixDQUFuQjs7QUFFQSxRQUFJLENBQUNaLFVBQUwsRUFBaUI7QUFDZixZQUFNLElBQUlkLEtBQUosQ0FBVyxJQUFFMEIsSUFBSywwQkFBbEIsQ0FBTjtBQUNEOztBQU51Qix1Q0FBYlcsV0FBYTtBQUFiQSxpQkFBYTtBQUFBOztBQVF4QixXQUFPLEtBQUtHLElBQUwsY0FBVWQsSUFBVixFQUFnQixFQUFoQixFQUFvQixJQUFJdEMsR0FBSixFQUFwQixTQUFrQ2lELFdBQWxDLEVBQVA7QUFDRDs7QUFFRFksV0FBU3ZCLElBQVQsRUFBZVIsTUFBZixFQUF1QlksU0FBdkIsRUFBa0M7O0FBRWhDLFNBQUs3QyxNQUFMLENBQVlpRSxTQUFaLENBQXNCeEIsSUFBdEIsRUFBNEJSLE1BQTVCLEVBQW9DWSxTQUFwQzs7QUFFQSxRQUFJLENBQUNaLE9BQU9pQyxPQUFaLEVBQXFCO0FBQ25CO0FBQ0Q7O0FBRUQsUUFBSSxDQUFDL0IsTUFBTUMsT0FBTixDQUFjSCxPQUFPaUMsT0FBckIsQ0FBTCxFQUFvQztBQUNsQyxZQUFNLElBQUluRCxLQUFKLENBQVUsb0RBQVYsQ0FBTjtBQUNEOztBQUVELFNBQUssTUFBTW9ELE1BQVgsSUFBcUJsQyxPQUFPaUMsT0FBNUIsRUFBcUM7O0FBRW5DLFVBQUksT0FBT0MsTUFBUCxLQUFrQixRQUF0QixFQUFnQztBQUM5QixjQUFNLElBQUlwRCxLQUFKLENBQVUsb0RBQVYsQ0FBTjtBQUNEOztBQUVELFdBQUtmLE1BQUwsQ0FBWW9FLE9BQVosQ0FBb0IsQ0FBQzNCLElBQUQsRUFBTzBCLE1BQVAsQ0FBcEI7QUFDRDtBQUNGO0FBdk04QixDQUFqQyIsImZpbGUiOiJDb250YWluZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbnRhaW5lciB7XG5cbiAgY29uc3RydWN0b3IoZ3JhcGgsIG1vZGlmaWVycykge1xuICAgIHRoaXMuZ3JhcGhfID0gZ3JhcGg7XG4gICAgdGhpcy5tb2RpZmllcnNfID0gbW9kaWZpZXJzO1xuICAgIHRoaXMuc2luZ2xldG9uQ2FjaGVfID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgc3RhdGljIGNvcHlQcm9wZXJ0aWVzKHNvdXJjZSwgdGFyZ2V0KSB7XG5cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBSZWZsZWN0Lm93bktleXMoc291cmNlKSkge1xuXG4gICAgICBpZiAoa2V5ICE9PSBcImNvbnN0cnVjdG9yXCIpIHtcblxuICAgICAgICBjb25zdCB0YXJnZXRQcm90byA9IFJlZmxlY3QuZ2V0UHJvdG90eXBlT2YodGFyZ2V0KTtcbiAgICAgICAgY29uc3QgYXR0cmlidXRlcyA9IChSZWZsZWN0Lm93bktleXModGFyZ2V0UHJvdG8pLmluY2x1ZGVzKGtleSkpID8ge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIHRyYWl0IFwiJHtrZXl9XCIgaXMgY29uZmxpY3RlZGApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2V0KCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgdHJhaXQgXCIke2tleX1cIiBpcyBjb25mbGljdGVkYCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IDogUmVmbGVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Ioc291cmNlLCBrZXkpO1xuXG4gICAgICAgIFJlZmxlY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIGF0dHJpYnV0ZXMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldFRhbXBlcmVkVmVydGV4RGF0YV8oY3VycmVudCkge1xuXG4gICAgaWYgKHRoaXMubW9kaWZpZXJzXy5vcHRpb25hbC5pc09wdGlvbmFsKGN1cnJlbnQpKSB7XG5cbiAgICAgIGNvbnN0IGNob3BwZWRPcHRpb25hbCA9IHRoaXMubW9kaWZpZXJzXy5vcHRpb25hbC5jaG9wKGN1cnJlbnQpO1xuXG4gICAgICByZXR1cm4gdGhpcy5ncmFwaF8uZ2V0VmVydGV4RGF0YShjaG9wcGVkT3B0aW9uYWwpIHx8IHtcInR5cGVcIjogXCJvcHRpb25hbFwifTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5tb2RpZmllcnNfLmZhY3RvcnkuaXNGYWN0b3J5KGN1cnJlbnQpKSB7XG5cbiAgICAgIGNvbnN0IGNob3BwZWRDdXJyZW50ID0gdGhpcy5tb2RpZmllcnNfLmZhY3RvcnkuY2hvcChjdXJyZW50KTtcbiAgICAgIGNvbnN0IHZlcnRleERhdGEgPSB0aGlzLmdyYXBoXy5nZXRWZXJ0ZXhEYXRhKGNob3BwZWRDdXJyZW50KTtcblxuICAgICAgaWYgKHZlcnRleERhdGEgJiYgdmVydGV4RGF0YS50eXBlICE9PSBcImNsYXNzXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT25seSBjbGFzc2VzIGNhbiBiZSBmYWN0b3JpemVkXCIpO1xuICAgICAgfVxuXG4gICAgICBpZiAodmVydGV4RGF0YSkge1xuICAgICAgICB2ZXJ0ZXhEYXRhLnR5cGUgPSBcImZhY3RvcnlcIjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZlcnRleERhdGE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ3JhcGhfLmdldFZlcnRleERhdGEoY3VycmVudCk7XG4gIH1cblxuICBjb21wb3NlXyh2ZXJ0ZXhEYXRhLCBpbnN0YW5jZSkge1xuXG4gICAgaWYgKCF2ZXJ0ZXhEYXRhLnZlcnRleC4kY29tcG9zZSkge1xuICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgIH1cblxuICAgIGlmICghQXJyYXkuaXNBcnJheSh2ZXJ0ZXhEYXRhLnZlcnRleC4kY29tcG9zZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBcXFwiJGNvbXBvc2VcXFwiIGxpc3Qgc2hvdWxkIGJlIGFuIGFycmF5IG9mIHN0cmluZ3NcIik7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB0cmFpdCBvZiB2ZXJ0ZXhEYXRhLnZlcnRleC4kY29tcG9zZSkge1xuXG4gICAgICBpZiAodHlwZW9mIHRyYWl0ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBcXFwiJGNvbXBvc2VcXFwiIGxpc3Qgc2hvdWxkIGJlIGFuIGFycmF5IG9mIHN0cmluZ3NcIik7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRyYWl0RGF0YSA9IHRoaXMuZ3JhcGhfLmdldFZlcnRleERhdGEodHJhaXQpO1xuXG4gICAgICBpZiAoIXRyYWl0RGF0YSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSB0cmFpdCBcIiR7dHJhaXR9XCIgaXMgbm90IHJlZ2lzdGVyZWRgKTtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoICh0cmFpdERhdGEudHlwZSkge1xuICAgICAgICBjYXNlIFwiY2xhc3NcIjpcbiAgICAgICAgICBDb250YWluZXIuY29weVByb3BlcnRpZXModHJhaXREYXRhLnZlcnRleC5wcm90b3R5cGUsIGluc3RhbmNlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImZ1bmN0aW9uXCI6XG5cbiAgICAgICAgICBjb25zdCBmYWtlUHJvdG90eXBlID0ge307XG5cbiAgICAgICAgICBmYWtlUHJvdG90eXBlW3RyYWl0RGF0YS52ZXJ0ZXgubmFtZV0gPSB0cmFpdERhdGEudmVydGV4O1xuICAgICAgICAgIENvbnRhaW5lci5jb3B5UHJvcGVydGllcyhmYWtlUHJvdG90eXBlLCBpbnN0YW5jZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfVxuXG4gIGNyZWF0ZUluamVjdGlvbkZvckNsYXNzXyh2ZXJ0ZXhEYXRhLCBhcmdzLCBjdXJyZW50LCBwZXJSZXF1ZXN0Q2FjaGUpIHtcblxuICAgIHN3aXRjaCAodmVydGV4RGF0YS5saWZlQ3ljbGUpIHtcbiAgICAgIGNhc2UgXCJ1bmlxdWVcIjpcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcG9zZV8odmVydGV4RGF0YSwgUmVmbGVjdC5jb25zdHJ1Y3QodmVydGV4RGF0YS52ZXJ0ZXgsIGFyZ3MpKTtcbiAgICAgIGNhc2UgXCJzaW5nbGV0b25cIjpcblxuICAgICAgICBpZiAodGhpcy5zaW5nbGV0b25DYWNoZV8uaGFzKGN1cnJlbnQpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2luZ2xldG9uQ2FjaGVfLmdldChjdXJyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNpbmdsZXRvbkluc3RhbmNlID0gdGhpcy5jb21wb3NlXyh2ZXJ0ZXhEYXRhLCBSZWZsZWN0LmNvbnN0cnVjdCh2ZXJ0ZXhEYXRhLnZlcnRleCwgYXJncykpO1xuXG4gICAgICAgIHRoaXMuc2luZ2xldG9uQ2FjaGVfLnNldChjdXJyZW50LCBzaW5nbGV0b25JbnN0YW5jZSk7XG4gICAgICAgIHJldHVybiBzaW5nbGV0b25JbnN0YW5jZTtcbiAgICAgIGRlZmF1bHQ6XG5cbiAgICAgICAgaWYgKHBlclJlcXVlc3RDYWNoZS5oYXMoY3VycmVudCkpIHtcbiAgICAgICAgICByZXR1cm4gcGVyUmVxdWVzdENhY2hlLmdldChjdXJyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBlclJlcXVlc3RJbnN0YW5jZSA9IHRoaXMuY29tcG9zZV8odmVydGV4RGF0YSwgUmVmbGVjdC5jb25zdHJ1Y3QodmVydGV4RGF0YS52ZXJ0ZXgsIGFyZ3MpKTtcblxuICAgICAgICBwZXJSZXF1ZXN0Q2FjaGUuc2V0KGN1cnJlbnQsIHBlclJlcXVlc3RJbnN0YW5jZSk7XG4gICAgICAgIHJldHVybiBwZXJSZXF1ZXN0SW5zdGFuY2U7XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlSW5qZWN0aW9uXyhjdXJyZW50LCBkZXBlbmRlbmNpZXMsIHBlclJlcXVlc3RDYWNoZSwgLi4uZXh0cmFQYXJhbXMpIHtcblxuICAgIGNvbnN0IHZlcnRleERhdGEgPSB0aGlzLmdldFRhbXBlcmVkVmVydGV4RGF0YV8oY3VycmVudCk7XG4gICAgY29uc3QgYXJncyA9IFsuLi5kZXBlbmRlbmNpZXMsIC4uLmV4dHJhUGFyYW1zXTtcblxuICAgIGlmICghdmVydGV4RGF0YSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2N1cnJlbnR9IGhhc24ndCBiZWVuIHJlZ2lzdGVyZWRgKTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHZlcnRleERhdGEudHlwZSkge1xuICAgICAgY2FzZSBcIm9wdGlvbmFsXCI6XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgY2FzZSBcImZhY3RvcnlcIjpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBnZXQoLi4uZmFjdG9yeVBhcmFtcykge1xuICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KHZlcnRleERhdGEudmVydGV4LCBbLi4uYXJncywgLi4uZmFjdG9yeVBhcmFtc10pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIGNhc2UgXCJjbGFzc1wiOlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVJbmplY3Rpb25Gb3JDbGFzc18odmVydGV4RGF0YSwgYXJncywgY3VycmVudCwgcGVyUmVxdWVzdENhY2hlKTtcbiAgICAgIGNhc2UgXCJmdW5jdGlvblwiOlxuICAgICAgICByZXR1cm4gUmVmbGVjdC5hcHBseSh2ZXJ0ZXhEYXRhLnZlcnRleCwgbnVsbCwgYXJncyk7XG4gICAgICBjYXNlIFwicGFzc1Rocm91Z2hcIjpcbiAgICAgICAgcmV0dXJuIHZlcnRleERhdGEudmVydGV4O1xuICAgIH1cbiAgfVxuXG4gIGRmc18oY3VycmVudCwgZXhwbG9yaW5nLCBwZXJSZXF1ZXN0Q2FjaGUsIC4uLmV4dHJhUGFyYW1zKSB7XG5cbiAgICBleHBsb3JpbmcucHVzaChjdXJyZW50KTtcblxuICAgIGNvbnN0IGNoaWxkVmVydGV4ZXMgPSB0aGlzLmdyYXBoXy5nZXRBZGphY2VudFZlcnRleGVzKGN1cnJlbnQpO1xuICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IEFycmF5LmZyb20oY2hpbGRWZXJ0ZXhlcykubWFwKGNoaWxkVmVydGV4ID0+IHtcblxuICAgICAgaWYgKGV4cGxvcmluZy5pbmNsdWRlcyhjaGlsZFZlcnRleCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQSBjeWNsZSBoYXMgYmVlbiBkZXRlY3RlZFwiKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZGZzXyhjaGlsZFZlcnRleCwgZXhwbG9yaW5nLCBwZXJSZXF1ZXN0Q2FjaGUpO1xuICAgIH0pO1xuXG4gICAgZXhwbG9yaW5nLnBvcCgpO1xuXG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlSW5qZWN0aW9uXyhjdXJyZW50LCBkZXBlbmRlbmNpZXMsIHBlclJlcXVlc3RDYWNoZSwgLi4uZXh0cmFQYXJhbXMpO1xuICB9XG5cbiAgZ2V0KG5hbWUsIC4uLmV4dHJhUGFyYW1zKSB7XG5cbiAgICBjb25zdCB2ZXJ0ZXhEYXRhID0gdGhpcy5ncmFwaF8uZ2V0VmVydGV4RGF0YSh0aGlzLm1vZGlmaWVyc18uZmFjdG9yeS5jaG9wKG5hbWUpKTtcblxuICAgIGlmICghdmVydGV4RGF0YSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25hbWV9IGhhc24ndCBiZWVuIHJlZ2lzdGVyZWRgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5kZnNfKG5hbWUsIFtdLCBuZXcgTWFwKCksIC4uLmV4dHJhUGFyYW1zKTtcbiAgfVxuXG4gIHJlZ2lzdGVyKG5hbWUsIHZlcnRleCwgbGlmZUN5Y2xlKSB7XG5cbiAgICB0aGlzLmdyYXBoXy5hZGRWZXJ0ZXgobmFtZSwgdmVydGV4LCBsaWZlQ3ljbGUpO1xuXG4gICAgaWYgKCF2ZXJ0ZXguJGluamVjdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghQXJyYXkuaXNBcnJheSh2ZXJ0ZXguJGluamVjdCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBcXFwiJGluamVjdFxcXCIgbGlzdCBzaG91bGQgYmUgYW4gYXJyYXkgb2Ygc3RyaW5nc1wiKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGluamVjdCBvZiB2ZXJ0ZXguJGluamVjdCkge1xuXG4gICAgICBpZiAodHlwZW9mIGluamVjdCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgXFxcIiRpbmplY3RcXFwiIGxpc3Qgc2hvdWxkIGJlIGFuIGFycmF5IG9mIHN0cmluZ3NcIik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZ3JhcGhfLmFkZEVkZ2UoW25hbWUsIGluamVjdF0pO1xuICAgIH1cbiAgfVxufTtcbiJdfQ==
