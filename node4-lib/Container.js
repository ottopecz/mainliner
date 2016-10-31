"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

module.exports = class Container {

  constructor(graph, modifiers) {
    this.graph_ = graph;
    this.modifiers_ = modifiers;
    this.singletonCache_ = new Map();
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
        switch (vertexData.lifeCycle) {
          case "unique":
            return Reflect.construct(vertexData.vertex, args);
          case "singleton":

            if (this.singletonCache_.has(current)) {
              return this.singletonCache_.get(current);
            }

            const singletonInstance = Reflect.construct(vertexData.vertex, args);

            this.singletonCache_.set(current, singletonInstance);
            return singletonInstance;
          default:

            if (perRequestCache.has(current)) {
              return perRequestCache.get(current);
            }

            const perRequestInstance = Reflect.construct(vertexData.vertex, args);

            perRequestCache.set(current, perRequestInstance);
            return perRequestInstance;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9Db250YWluZXIuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIkNvbnRhaW5lciIsImNvbnN0cnVjdG9yIiwiZ3JhcGgiLCJtb2RpZmllcnMiLCJncmFwaF8iLCJtb2RpZmllcnNfIiwic2luZ2xldG9uQ2FjaGVfIiwiTWFwIiwiZ2V0VGFtcGVyZWRWZXJ0ZXhEYXRhXyIsImN1cnJlbnQiLCJvcHRpb25hbCIsImlzT3B0aW9uYWwiLCJjaG9wcGVkT3B0aW9uYWwiLCJjaG9wIiwiZ2V0VmVydGV4RGF0YSIsImZhY3RvcnkiLCJpc0ZhY3RvcnkiLCJjaG9wcGVkQ3VycmVudCIsInZlcnRleERhdGEiLCJ0eXBlIiwiRXJyb3IiLCJjcmVhdGVJbmplY3Rpb25fIiwiZGVwZW5kZW5jaWVzIiwicGVyUmVxdWVzdENhY2hlIiwiZXh0cmFQYXJhbXMiLCJhcmdzIiwiZ2V0IiwiZmFjdG9yeVBhcmFtcyIsIlJlZmxlY3QiLCJjb25zdHJ1Y3QiLCJ2ZXJ0ZXgiLCJsaWZlQ3ljbGUiLCJoYXMiLCJzaW5nbGV0b25JbnN0YW5jZSIsInNldCIsInBlclJlcXVlc3RJbnN0YW5jZSIsImFwcGx5IiwiZGZzXyIsImV4cGxvcmluZyIsInB1c2giLCJjaGlsZFZlcnRleGVzIiwiZ2V0QWRqYWNlbnRWZXJ0ZXhlcyIsIkFycmF5IiwiZnJvbSIsIm1hcCIsImNoaWxkVmVydGV4IiwiaW5jbHVkZXMiLCJwb3AiLCJuYW1lIiwicmVnaXN0ZXIiLCJhZGRWZXJ0ZXgiLCIkaW5qZWN0IiwiaXNBcnJheSIsImluamVjdCIsImFkZEVkZ2UiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQUEsT0FBT0MsT0FBUCxHQUFpQixNQUFNQyxTQUFOLENBQWdCOztBQUUvQkMsY0FBWUMsS0FBWixFQUFtQkMsU0FBbkIsRUFBOEI7QUFDNUIsU0FBS0MsTUFBTCxHQUFjRixLQUFkO0FBQ0EsU0FBS0csVUFBTCxHQUFrQkYsU0FBbEI7QUFDQSxTQUFLRyxlQUFMLEdBQXVCLElBQUlDLEdB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NEIsSUFBSywwQkFBbEIsQ0FBTjtBQUNEOztBQU51Qix1Q0FBYnhCLFdBQWE7QUFBYkEsaUJBQWE7QUFBQTs7QUFReEIsV0FBTyxLQUFLYSxJQUFMLGNBQVVXLElBQVYsRUFBZ0IsRUFBaEIsRUFBb0IsSUFBSXpDLEdBQUosRUFBcEIsU0FBa0NpQixXQUFsQyxFQUFQO0FBQ0Q7O0FBRUR5QixXQUFTRCxJQUFULEVBQWVsQixNQUFmLEVBQXVCQyxTQUF2QixFQUFrQzs7QUFFaEMsU0FBSzNCLE1BQUwsQ0FBWThDLFNBQVosQ0FBc0JGLElBQXRCLEVBQTRCbEIsTUFBNUIsRUFBb0NDLFNBQXBDOztBQUVBLFFBQUksQ0FBQ0QsT0FBT3FCLE9BQVosRUFBcUI7QUFDbkI7QUFDRDs7QUFFRCxRQUFJckIsT0FBT3FCLE9BQVAsSUFBa0IsQ0FBQ1QsTUFBTVUsT0FBTixDQUFjdEIsT0FBT3FCLE9BQXJCLENBQXZCLEVBQXNEO0FBQ3BELFlBQU0sSUFBSS9CLEtBQUosQ0FBVSxvREFBVixDQUFOO0FBQ0Q7O0FBRUQsUUFBSVUsT0FBT3FCLE9BQVAsSUFBa0JULE1BQU1VLE9BQU4sQ0FBY3RCLE9BQU9xQixPQUFyQixDQUF0QixFQUFxRDtBQUNuRCxXQUFLLE1BQU1FLE1BQVgsSUFBcUJ2QixPQUFPcUIsT0FBNUIsRUFBcUM7QUFDbkMsWUFBSSxPQUFPRSxNQUFQLEtBQWtCLFFBQXRCLEVBQWdDO0FBQzlCLGdCQUFNLElBQUlqQyxLQUFKLENBQVUsb0RBQVYsQ0FBTjtBQUNEO0FBQ0Y7QUFDRjs7QUFFRCxTQUFLLE1BQU1pQyxNQUFYLElBQXFCdkIsT0FBT3FCLE9BQTVCLEVBQXFDO0FBQ25DLFdBQUsvQyxNQUFMLENBQVlrRCxPQUFaLENBQW9CLENBQUNOLElBQUQsRUFBT0ssTUFBUCxDQUFwQjtBQUNEO0FBQ0Y7QUEzSThCLENBQWpDIiwiZmlsZSI6IkNvbnRhaW5lci5qcyIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ29udGFpbmVyIHtcblxuICBjb25zdHJ1Y3RvcihncmFwaCwgbW9kaWZpZXJzKSB7XG4gICAgdGhpcy5ncmFwaF8gPSBncmFwaDtcbiAgICB0aGlzLm1vZGlmaWVyc18gPSBtb2RpZmllcnM7XG4gICAgdGhpcy5zaW5nbGV0b25DYWNoZV8gPSBuZXcgTWFwKCk7XG4gIH1cblxuICBnZXRUYW1wZXJlZFZlcnRleERhdGFfKGN1cnJlbnQpIHtcblxuICAgIGlmICh0aGlzLm1vZGlmaWVyc18ub3B0aW9uYWwuaXNPcHRpb25hbChjdXJyZW50KSkge1xuXG4gICAgICBjb25zdCBjaG9wcGVkT3B0aW9uYWwgPSB0aGlzLm1vZGlmaWVyc18ub3B0aW9uYWwuY2hvcChjdXJyZW50KTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ3JhcGhfLmdldFZlcnRleERhdGEoY2hvcHBlZE9wdGlvbmFsKSB8fCB7XCJ0eXBlXCI6IFwib3B0aW9uYWxcIn07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubW9kaWZpZXJzXy5mYWN0b3J5LmlzRmFjdG9yeShjdXJyZW50KSkge1xuXG4gICAgICBjb25zdCBjaG9wcGVkQ3VycmVudCA9IHRoaXMubW9kaWZpZXJzXy5mYWN0b3J5LmNob3AoY3VycmVudCk7XG4gICAgICBjb25zdCB2ZXJ0ZXhEYXRhID0gdGhpcy5ncmFwaF8uZ2V0VmVydGV4RGF0YShjaG9wcGVkQ3VycmVudCk7XG5cbiAgICAgIGlmICh2ZXJ0ZXhEYXRhICYmIHZlcnRleERhdGEudHlwZSAhPT0gXCJjbGFzc1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9ubHkgY2xhc3NlcyBjYW4gYmUgZmFjdG9yaXplZFwiKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHZlcnRleERhdGEpIHtcbiAgICAgICAgdmVydGV4RGF0YS50eXBlID0gXCJmYWN0b3J5XCI7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2ZXJ0ZXhEYXRhO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmdyYXBoXy5nZXRWZXJ0ZXhEYXRhKGN1cnJlbnQpO1xuICB9XG5cbiAgY3JlYXRlSW5qZWN0aW9uXyhjdXJyZW50LCBkZXBlbmRlbmNpZXMsIHBlclJlcXVlc3RDYWNoZSwgLi4uZXh0cmFQYXJhbXMpIHtcblxuICAgIGNvbnN0IHZlcnRleERhdGEgPSB0aGlzLmdldFRhbXBlcmVkVmVydGV4RGF0YV8oY3VycmVudCk7XG4gICAgY29uc3QgYXJncyA9IFsuLi5kZXBlbmRlbmNpZXMsIC4uLmV4dHJhUGFyYW1zXTtcblxuICAgIGlmICghdmVydGV4RGF0YSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2N1cnJlbnR9IGhhc24ndCBiZWVuIHJlZ2lzdGVyZWRgKTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHZlcnRleERhdGEudHlwZSkge1xuICAgICAgY2FzZSBcIm9wdGlvbmFsXCI6XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgY2FzZSBcImZhY3RvcnlcIjpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBnZXQoLi4uZmFjdG9yeVBhcmFtcykge1xuICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KHZlcnRleERhdGEudmVydGV4LCBbLi4uYXJncywgLi4uZmFjdG9yeVBhcmFtc10pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIGNhc2UgXCJjbGFzc1wiOlxuICAgICAgICBzd2l0Y2ggKHZlcnRleERhdGEubGlmZUN5Y2xlKSB7XG4gICAgICAgICAgY2FzZSBcInVuaXF1ZVwiOlxuICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KHZlcnRleERhdGEudmVydGV4LCBhcmdzKTtcbiAgICAgICAgICBjYXNlIFwic2luZ2xldG9uXCI6XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNpbmdsZXRvbkNhY2hlXy5oYXMoY3VycmVudCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2luZ2xldG9uQ2FjaGVfLmdldChjdXJyZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgc2luZ2xldG9uSW5zdGFuY2UgPSBSZWZsZWN0LmNvbnN0cnVjdCh2ZXJ0ZXhEYXRhLnZlcnRleCwgYXJncyk7XG5cbiAgICAgICAgICAgIHRoaXMuc2luZ2xldG9uQ2FjaGVfLnNldChjdXJyZW50LCBzaW5nbGV0b25JbnN0YW5jZSk7XG4gICAgICAgICAgICByZXR1cm4gc2luZ2xldG9uSW5zdGFuY2U7XG4gICAgICAgICAgZGVmYXVsdDpcblxuICAgICAgICAgICAgaWYgKHBlclJlcXVlc3RDYWNoZS5oYXMoY3VycmVudCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHBlclJlcXVlc3RDYWNoZS5nZXQoY3VycmVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBlclJlcXVlc3RJbnN0YW5jZSA9IFJlZmxlY3QuY29uc3RydWN0KHZlcnRleERhdGEudmVydGV4LCBhcmdzKTtcblxuICAgICAgICAgICAgcGVyUmVxdWVzdENhY2hlLnNldChjdXJyZW50LCBwZXJSZXF1ZXN0SW5zdGFuY2UpO1xuICAgICAgICAgICAgcmV0dXJuIHBlclJlcXVlc3RJbnN0YW5jZTtcbiAgICAgICAgfVxuICAgICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICAgIHJldHVybiBSZWZsZWN0LmFwcGx5KHZlcnRleERhdGEudmVydGV4LCBudWxsLCBhcmdzKTtcbiAgICAgIGNhc2UgXCJwYXNzVGhyb3VnaFwiOlxuICAgICAgICByZXR1cm4gdmVydGV4RGF0YS52ZXJ0ZXg7XG4gICAgfVxuICB9XG5cbiAgZGZzXyhjdXJyZW50LCBleHBsb3JpbmcsIHBlclJlcXVlc3RDYWNoZSwgLi4uZXh0cmFQYXJhbXMpIHtcblxuICAgIGV4cGxvcmluZy5wdXNoKGN1cnJlbnQpO1xuXG4gICAgY29uc3QgY2hpbGRWZXJ0ZXhlcyA9IHRoaXMuZ3JhcGhfLmdldEFkamFjZW50VmVydGV4ZXMoY3VycmVudCk7XG4gICAgY29uc3QgZGVwZW5kZW5jaWVzID0gQXJyYXkuZnJvbShjaGlsZFZlcnRleGVzKS5tYXAoY2hpbGRWZXJ0ZXggPT4ge1xuXG4gICAgICBpZiAoZXhwbG9yaW5nLmluY2x1ZGVzKGNoaWxkVmVydGV4KSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBIGN5Y2xlIGhhcyBiZWVuIGRldGVjdGVkXCIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5kZnNfKGNoaWxkVmVydGV4LCBleHBsb3JpbmcsIHBlclJlcXVlc3RDYWNoZSk7XG4gICAgfSk7XG5cbiAgICBleHBsb3JpbmcucG9wKCk7XG5cbiAgICByZXR1cm4gdGhpcy5jcmVhdGVJbmplY3Rpb25fKGN1cnJlbnQsIGRlcGVuZGVuY2llcywgcGVyUmVxdWVzdENhY2hlLCAuLi5leHRyYVBhcmFtcyk7XG4gIH1cblxuICBnZXQobmFtZSwgLi4uZXh0cmFQYXJhbXMpIHtcblxuICAgIGNvbnN0IHZlcnRleERhdGEgPSB0aGlzLmdyYXBoXy5nZXRWZXJ0ZXhEYXRhKHRoaXMubW9kaWZpZXJzXy5mYWN0b3J5LmNob3AobmFtZSkpO1xuXG4gICAgaWYgKCF2ZXJ0ZXhEYXRhKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bmFtZX0gaGFzbid0IGJlZW4gcmVnaXN0ZXJlZGApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRmc18obmFtZSwgW10sIG5ldyBNYXAoKSwgLi4uZXh0cmFQYXJhbXMpO1xuICB9XG5cbiAgcmVnaXN0ZXIobmFtZSwgdmVydGV4LCBsaWZlQ3ljbGUpIHtcblxuICAgIHRoaXMuZ3JhcGhfLmFkZFZlcnRleChuYW1lLCB2ZXJ0ZXgsIGxpZmVDeWNsZSk7XG5cbiAgICBpZiAoIXZlcnRleC4kaW5qZWN0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHZlcnRleC4kaW5qZWN0ICYmICFBcnJheS5pc0FycmF5KHZlcnRleC4kaW5qZWN0KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIFxcXCIkaW5qZWN0XFxcIiBsaXN0IHNob3VsZCBiZSBhbiBhcnJheSBvZiBzdHJpbmdzXCIpO1xuICAgIH1cblxuICAgIGlmICh2ZXJ0ZXguJGluamVjdCAmJiBBcnJheS5pc0FycmF5KHZlcnRleC4kaW5qZWN0KSkge1xuICAgICAgZm9yIChjb25zdCBpbmplY3Qgb2YgdmVydGV4LiRpbmplY3QpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBpbmplY3QgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgXFxcIiRpbmplY3RcXFwiIGxpc3Qgc2hvdWxkIGJlIGFuIGFycmF5IG9mIHN0cmluZ3NcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGluamVjdCBvZiB2ZXJ0ZXguJGluamVjdCkge1xuICAgICAgdGhpcy5ncmFwaF8uYWRkRWRnZShbbmFtZSwgaW5qZWN0XSk7XG4gICAgfVxuICB9XG59O1xuIl19
