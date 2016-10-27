"use strict";

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

  createInjection_(current, dependencies, perRequestCache, rootParam) {

    const vertexData = this.getTamperedVertexData_(current);

    if (!vertexData) {
      throw new Error(`${ current } hasn't been registered`);
    }

    switch (vertexData.type) {
      case "optional":
        return null;
      case "factory":
        return {
          get: function get(param) {
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

    const vertexData = this.graph_.getVertexData(this.modifiers_.factory.chop(name));

    if (!vertexData) {
      throw new Error(`${ name } hasn't been registered`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9Db250YWluZXIuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIkNvbnRhaW5lciIsImNvbnN0cnVjdG9yIiwiZ3JhcGgiLCJtb2RpZmllcnMiLCJncmFwaF8iLCJtb2RpZmllcnNfIiwic2luZ2xldG9uQ2FjaGVfIiwiTWFwIiwiZ2V0VGFtcGVyZWRWZXJ0ZXhEYXRhXyIsImN1cnJlbnQiLCJvcHRpb25hbCIsImlzT3B0aW9uYWwiLCJjaG9wcGVkT3B0aW9uYWwiLCJjaG9wIiwiZ2V0VmVydGV4RGF0YSIsImZhY3RvcnkiLCJpc0ZhY3RvcnkiLCJjaG9wcGVkQ3VycmVudCIsInZlcnRleERhdGEiLCJ0eXBlIiwiRXJyb3IiLCJjcmVhdGVJbmplY3Rpb25fIiwiZGVwZW5kZW5jaWVzIiwicGVyUmVxdWVzdENhY2hlIiwicm9vdFBhcmFtIiwiZ2V0IiwicGFyYW0iLCJwdXNoIiwiUmVmbGVjdCIsImNvbnN0cnVjdCIsInZlcnRleCIsImxpZmVDeWNsZSIsImhhcyIsInNpbmdsZXRvbkluc3RhbmNlIiwic2V0IiwicGVyUmVxdWVzdEluc3RhbmNlIiwiYXBwbHkiLCJkZnNfIiwiZXhwbG9yaW5nIiwiY2hpbGRWZXJ0ZXhlcyIsImdldEFkamFjZW50VmVydGV4ZXMiLCJBcnJheSIsImZyb20iLCJtYXAiLCJjaGlsZFZlcnRleCIsImluY2x1ZGVzIiwicG9wIiwibmFtZSIsInJlZ2lzdGVyIiwiYWRkVmVydGV4IiwiJGluamVjdCIsImlzQXJyYXkiLCJpbmplY3QiLCJhZGRFZGdlIl0sIm1hcHBpbmdzIjoiOztBQUFBQSxPQUFPQyxPQUFQLEdBQWlCLE1BQU1DLFNBQU4sQ0FBZ0I7O0FBRS9CQyxjQUFZQyxLQUFaLEVBQW1CQyxTQUFuQixFQUE4QjtBQUM1QixTQUFLQyxNQUFMLEdBQWNGLEtBQWQ7QUFDQSxTQUFLRyxVQUFMLEdBQWtCRixTQUFsQjtBQUNBLFNBQUtHLGVBQUwsR0FBdUIsSUFBSUMsR0FBSixFQUF2QjtBQUNEOztBQUVE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RCxFQUFPSyxNQUFQLENBQXBCO0FBQ0Q7QUFDRjtBQTVKOEIsQ0FBakMiLCJmaWxlIjoiQ29udGFpbmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb250YWluZXIge1xuXG4gIGNvbnN0cnVjdG9yKGdyYXBoLCBtb2RpZmllcnMpIHtcbiAgICB0aGlzLmdyYXBoXyA9IGdyYXBoO1xuICAgIHRoaXMubW9kaWZpZXJzXyA9IG1vZGlmaWVycztcbiAgICB0aGlzLnNpbmdsZXRvbkNhY2hlXyA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIGdldFRhbXBlcmVkVmVydGV4RGF0YV8oY3VycmVudCkge1xuXG4gICAgaWYgKHRoaXMubW9kaWZpZXJzXy5vcHRpb25hbC5pc09wdGlvbmFsKGN1cnJlbnQpKSB7XG5cbiAgICAgIGNvbnN0IGNob3BwZWRPcHRpb25hbCA9IHRoaXMubW9kaWZpZXJzXy5vcHRpb25hbC5jaG9wKGN1cnJlbnQpO1xuXG4gICAgICByZXR1cm4gdGhpcy5ncmFwaF8uZ2V0VmVydGV4RGF0YShjaG9wcGVkT3B0aW9uYWwpIHx8IHtcInR5cGVcIjogXCJvcHRpb25hbFwifTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5tb2RpZmllcnNfLmZhY3RvcnkuaXNGYWN0b3J5KGN1cnJlbnQpKSB7XG5cbiAgICAgIGNvbnN0IGNob3BwZWRDdXJyZW50ID0gdGhpcy5tb2RpZmllcnNfLmZhY3RvcnkuY2hvcChjdXJyZW50KTtcbiAgICAgIGNvbnN0IHZlcnRleERhdGEgPSB0aGlzLmdyYXBoXy5nZXRWZXJ0ZXhEYXRhKGNob3BwZWRDdXJyZW50KTtcblxuICAgICAgaWYgKHZlcnRleERhdGEgJiYgdmVydGV4RGF0YS50eXBlICE9PSBcImNsYXNzXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT25seSBjbGFzc2VzIGNhbiBiZSBmYWN0b3JpemVkXCIpO1xuICAgICAgfVxuXG4gICAgICBpZiAodmVydGV4RGF0YSkge1xuICAgICAgICB2ZXJ0ZXhEYXRhLnR5cGUgPSBcImZhY3RvcnlcIjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZlcnRleERhdGE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ3JhcGhfLmdldFZlcnRleERhdGEoY3VycmVudCk7XG4gIH1cblxuICBjcmVhdGVJbmplY3Rpb25fKGN1cnJlbnQsIGRlcGVuZGVuY2llcywgcGVyUmVxdWVzdENhY2hlLCByb290UGFyYW0pIHtcblxuICAgIGNvbnN0IHZlcnRleERhdGEgPSB0aGlzLmdldFRhbXBlcmVkVmVydGV4RGF0YV8oY3VycmVudCk7XG5cbiAgICBpZiAoIXZlcnRleERhdGEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtjdXJyZW50fSBoYXNuJ3QgYmVlbiByZWdpc3RlcmVkYCk7XG4gICAgfVxuXG4gICAgc3dpdGNoICh2ZXJ0ZXhEYXRhLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJvcHRpb25hbFwiOlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIGNhc2UgXCJmYWN0b3J5XCI6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZ2V0KHBhcmFtKSB7XG4gICAgICAgICAgICBpZiAocm9vdFBhcmFtKSB7XG4gICAgICAgICAgICAgIGRlcGVuZGVuY2llcy5wdXNoKHJvb3RQYXJhbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZXBlbmRlbmNpZXMucHVzaChwYXJhbSk7XG4gICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5jb25zdHJ1Y3QodmVydGV4RGF0YS52ZXJ0ZXgsIGRlcGVuZGVuY2llcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgY2FzZSBcImNsYXNzXCI6XG4gICAgICAgIHN3aXRjaCAodmVydGV4RGF0YS5saWZlQ3ljbGUpIHtcbiAgICAgICAgICBjYXNlIFwidW5pcXVlXCI6XG4gICAgICAgICAgICBpZiAocm9vdFBhcmFtKSB7XG4gICAgICAgICAgICAgIGRlcGVuZGVuY2llcy5wdXNoKHJvb3RQYXJhbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5jb25zdHJ1Y3QodmVydGV4RGF0YS52ZXJ0ZXgsIGRlcGVuZGVuY2llcyk7XG4gICAgICAgICAgY2FzZSBcInNpbmdsZXRvblwiOlxuXG4gICAgICAgICAgICBpZiAodGhpcy5zaW5nbGV0b25DYWNoZV8uaGFzKGN1cnJlbnQpKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnNpbmdsZXRvbkNhY2hlXy5nZXQoY3VycmVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyb290UGFyYW0pIHtcbiAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzLnB1c2gocm9vdFBhcmFtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgc2luZ2xldG9uSW5zdGFuY2UgPSBSZWZsZWN0LmNvbnN0cnVjdCh2ZXJ0ZXhEYXRhLnZlcnRleCwgZGVwZW5kZW5jaWVzKTtcblxuICAgICAgICAgICAgdGhpcy5zaW5nbGV0b25DYWNoZV8uc2V0KGN1cnJlbnQsIHNpbmdsZXRvbkluc3RhbmNlKTtcbiAgICAgICAgICAgIHJldHVybiBzaW5nbGV0b25JbnN0YW5jZTtcbiAgICAgICAgICBkZWZhdWx0OlxuXG4gICAgICAgICAgICBpZiAocGVyUmVxdWVzdENhY2hlLmhhcyhjdXJyZW50KSkge1xuICAgICAgICAgICAgICByZXR1cm4gcGVyUmVxdWVzdENhY2hlLmdldChjdXJyZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJvb3RQYXJhbSkge1xuICAgICAgICAgICAgICBkZXBlbmRlbmNpZXMucHVzaChyb290UGFyYW0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwZXJSZXF1ZXN0SW5zdGFuY2UgPSBSZWZsZWN0LmNvbnN0cnVjdCh2ZXJ0ZXhEYXRhLnZlcnRleCwgZGVwZW5kZW5jaWVzKTtcblxuICAgICAgICAgICAgcGVyUmVxdWVzdENhY2hlLnNldChjdXJyZW50LCBwZXJSZXF1ZXN0SW5zdGFuY2UpO1xuICAgICAgICAgICAgcmV0dXJuIHBlclJlcXVlc3RJbnN0YW5jZTtcbiAgICAgICAgfVxuICAgICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICAgIGlmIChyb290UGFyYW0pIHtcbiAgICAgICAgICBkZXBlbmRlbmNpZXMucHVzaChyb290UGFyYW0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBSZWZsZWN0LmFwcGx5KHZlcnRleERhdGEudmVydGV4LCBudWxsLCBkZXBlbmRlbmNpZXMpO1xuICAgICAgY2FzZSBcInBhc3NUaHJvdWdoXCI6XG4gICAgICAgIHJldHVybiB2ZXJ0ZXhEYXRhLnZlcnRleDtcbiAgICB9XG4gIH1cblxuICBkZnNfKGN1cnJlbnQsIGV4cGxvcmluZywgcGVyUmVxdWVzdENhY2hlLCBwYXJhbSkge1xuXG4gICAgZXhwbG9yaW5nLnB1c2goY3VycmVudCk7XG5cbiAgICBjb25zdCBjaGlsZFZlcnRleGVzID0gdGhpcy5ncmFwaF8uZ2V0QWRqYWNlbnRWZXJ0ZXhlcyhjdXJyZW50KTtcbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBBcnJheS5mcm9tKGNoaWxkVmVydGV4ZXMpLm1hcChjaGlsZFZlcnRleCA9PiB7XG5cbiAgICAgIGlmIChleHBsb3JpbmcuaW5jbHVkZXMoY2hpbGRWZXJ0ZXgpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkEgY3ljbGUgaGFzIGJlZW4gZGV0ZWN0ZWRcIik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmRmc18oY2hpbGRWZXJ0ZXgsIGV4cGxvcmluZywgcGVyUmVxdWVzdENhY2hlKTtcbiAgICB9KTtcblxuICAgIGV4cGxvcmluZy5wb3AoKTtcblxuICAgIHJldHVybiB0aGlzLmNyZWF0ZUluamVjdGlvbl8oY3VycmVudCwgZGVwZW5kZW5jaWVzLCBwZXJSZXF1ZXN0Q2FjaGUsIHBhcmFtKTtcbiAgfVxuXG4gIGdldChuYW1lLCBwYXJhbSkge1xuXG4gICAgY29uc3QgdmVydGV4RGF0YSA9IHRoaXMuZ3JhcGhfLmdldFZlcnRleERhdGEodGhpcy5tb2RpZmllcnNfLmZhY3RvcnkuY2hvcChuYW1lKSk7XG5cbiAgICBpZiAoIXZlcnRleERhdGEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtuYW1lfSBoYXNuJ3QgYmVlbiByZWdpc3RlcmVkYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZGZzXyhuYW1lLCBbXSwgbmV3IE1hcCgpLCBwYXJhbSk7XG4gIH1cblxuICByZWdpc3RlcihuYW1lLCB2ZXJ0ZXgsIGxpZmVDeWNsZSkge1xuXG4gICAgdGhpcy5ncmFwaF8uYWRkVmVydGV4KG5hbWUsIHZlcnRleCwgbGlmZUN5Y2xlKTtcblxuICAgIGlmICghdmVydGV4LiRpbmplY3QpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodmVydGV4LiRpbmplY3QgJiYgIUFycmF5LmlzQXJyYXkodmVydGV4LiRpbmplY3QpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgXFxcIiRpbmplY3RcXFwiIGxpc3Qgc2hvdWxkIGJlIGFuIGFycmF5IG9mIHN0cmluZ3NcIik7XG4gICAgfVxuXG4gICAgaWYgKHZlcnRleC4kaW5qZWN0ICYmIEFycmF5LmlzQXJyYXkodmVydGV4LiRpbmplY3QpKSB7XG4gICAgICBmb3IgKGNvbnN0IGluamVjdCBvZiB2ZXJ0ZXguJGluamVjdCkge1xuICAgICAgICBpZiAodHlwZW9mIGluamVjdCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBcXFwiJGluamVjdFxcXCIgbGlzdCBzaG91bGQgYmUgYW4gYXJyYXkgb2Ygc3RyaW5nc1wiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgaW5qZWN0IG9mIHZlcnRleC4kaW5qZWN0KSB7XG4gICAgICB0aGlzLmdyYXBoXy5hZGRFZGdlKFtuYW1lLCBpbmplY3RdKTtcbiAgICB9XG4gIH1cbn07XG4iXX0=
