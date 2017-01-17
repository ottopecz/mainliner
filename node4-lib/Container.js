"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

const Composer = require("talentcomposer");

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

    return { name: name, aliases: aliases, excludes: excludes };
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

      var _parseTalentName_ = this.parseTalentName_(talentName);

      const name = _parseTalentName_.name,
            aliases = _parseTalentName_.aliases,
            excludes = _parseTalentName_.excludes;


      const talentData = this.graph_.getVertexData(name);

      if (!talentData) {
        throw new Error(`The talent "${ talentName }" is not registered`);
      }

      if (talentData.type !== "passThrough") {
        throw new Error(`The talent "${ talentName }" has to be a talent created by the "#createTalent" method`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9Db250YWluZXIuanMiXSwibmFtZXMiOlsiQ29tcG9zZXIiLCJyZXF1aXJlIiwibW9kdWxlIiwiZXhwb3J0cyIsIkNvbnRhaW5lciIsImNvbnN0cnVjdG9yIiwiZ3JhcGgiLCJtb2RpZmllcnMiLCJncmFwaF8iLCJtb2RpZmllcnNfIiwic2luZ2xldG9uQ2FjaGVfIiwiTWFwIiwiZ2V0VGFtcGVyZWRWZXJ0ZXhEYXRhXyIsImN1cnJlbnQiLCJvcHRpb25hbCIsImlzT3B0aW9uYWwiLCJjaG9wcGVkT3B0aW9uYWwiLCJjaG9wIiwiZ2V0VmVydGV4RGF0YSIsImZhY3RvcnkiLCJpc0ZhY3RvcnkiLCJjaG9wcGVkQ3VycmVudCIsInZlcnRleERhdGEiLCJ0eXBlIiwiRXJyb3IiLCJwYXJzZVRhbGVudE5hbWVfIiwidGFsZW50TmFtZSIsInJlMSIsInJlMiIsInJlMyIsInJlNCIsInJlNSIsInJlNiIsIm5hbWUiLCJTeW1ib2wiLCJtYXRjaCIsInRyaW0iLCJyZXNvbHV0aW9ucyIsInNwbGl0IiwibWFwIiwiYWxpYXNlcyIsInJlZHVjZSIsImFjY3UiLCJyZXNvbHV0aW9uIiwidGVzdCIsInB1c2giLCJleGNsdWRlcyIsImNvbXBvc2VfIiwiaW5zdGFuY2UiLCJ2ZXJ0ZXgiLCIkY29tcG9zZSIsIkFycmF5IiwiaXNBcnJheSIsInRhbGVudHMiLCJ0YWxlbnREYXRhIiwicmV0IiwibGVuZ3RoIiwiYWxpYXMiLCJleGNsdWRlIiwiY29tcG9zZVdpdGhUYWxlbnRzIiwiY3JlYXRlSW5qZWN0aW9uRm9yQ2xhc3NfIiwiYXJncyIsInBlclJlcXVlc3RDYWNoZSIsImxpZmVDeWNsZSIsIlJlZmxlY3QiLCJjb25zdHJ1Y3QiLCJoYXMiLCJnZXQiLCJzaW5nbGV0b25JbnN0YW5jZSIsInNldCIsInBlclJlcXVlc3RJbnN0YW5jZSIsImNyZWF0ZUluamVjdGlvbl8iLCJkZXBlbmRlbmNpZXMiLCJleHRyYVBhcmFtcyIsImZhY3RvcnlQYXJhbXMiLCJhcHBseSIsImRmc18iLCJleHBsb3JpbmciLCJjaGlsZFZlcnRleGVzIiwiZ2V0QWRqYWNlbnRWZXJ0ZXhlcyIsImZyb20iLCJjaGlsZFZlcnRleCIsImluY2x1ZGVzIiwicG9wIiwicmVnaXN0ZXIiLCJhZGRWZXJ0ZXgiLCIkaW5qZWN0IiwiaW5qZWN0IiwiYWRkRWRnZSJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE1BQU1BLFdBQVdDLFFBQVEsZ0JBQVIsQ0FBakI7O0FBRUFDLE9BQU9DLE9BQVAsR0FBaUIsTUFBTUMsU0FBTixDQUFnQjs7QUFFL0JDLGNBQVlDLEtBQVosRUFBbUJDLFNBQW5CLEVBQThCO0FBQzVCLFNBQUtDLE1BQUwsR0FBY0YsS0FBZDtBQUNBLFNBQUtHLFVBQUwsR0FBa0JGLFNBQWxCO0FBQ0EsU0FBS0csZUFBTCxHQUF1QixJQUFJQyxHQUFKLEVBQXZCO0FBQ0Q7O0FBRURDLHlCQUF1QkMsT0FBdkIsRUFBZ0M7O0FBRTlCLFFBQUksS0FBS0osVUFBTCxDQUFnQkssUUFBaEIsQ0FBeUJDLFVBQXpCLENBQW9DRixPQUFwQyxDQUFKLEVBQWtEOztBQUVoRCxZQUFNRyxrQkFBa0IsS0FBS1AsVUFBTCxDQUFnQkssUUFBaEIsQ0FBeUJHLElBQXpCLENBQThCSixPQUE5QixDQUF4Qjs7QUFFQSxhQUFPLEtBQUtMLE1BQUwsQ0FBWVUsYUFBWixDQUEwQkYsZUFBMUIsS0FBOEMsRUFBQyxRQUFRLFVBQVQsRUFBckQ7QUFDRDs7QUFFRCxRQUFJLEtBQUtQLFVBQUwsQ0FBZ0JVLE9BQWhCLENBQXdCQyxTQUF4QixDQUFrQ1AsT0FBbEMsQ0FBSixFQUFnRDs7QUFFOUMsWUFBTVEsaUJBQWlCLEtBQUtaLFVBQUwsQ0FBZ0JVLE9BQWhCLENBQXdCRixJQUF4QixDQUE2QkosT0FBN0IsQ0FBdkI7QUFDQSxZQUFNUyxhQUFhLEtBQUtkLE1BQUwsQ0FBWVUsYUFBWixDQUEwQkcsY0FBMUIsQ0FBbkI7O0FBRUEsVUFBSUMsY0FBY0EsV0FBV0MsSUFBWCxLQUFvQixPQUF0QyxFQUErQztBQUM3QyxjQUFNLElBQUlD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LEtBQUtkLE1BQUwsQ0FBWVUsYUFBWixDQUEwQixLQUFLVCxVQUFMLENBQWdCVSxPQUFoQixDQUF3QkYsSUFBeEIsQ0FBNkJnQixJQUE3QixDQUExQixDQUFuQjs7QUFFQSxRQUFJLENBQUNYLFVBQUwsRUFBaUI7QUFDZixZQUFNLElBQUlFLEtBQUosQ0FBVyxJQUFFUyxJQUFLLDBCQUFsQixDQUFOO0FBQ0Q7O0FBTnVCLHVDQUFid0MsV0FBYTtBQUFiQSxpQkFBYTtBQUFBOztBQVF4QixXQUFPLEtBQUtHLElBQUwsY0FBVTNDLElBQVYsRUFBZ0IsRUFBaEIsRUFBb0IsSUFBSXRCLEdBQUosRUFBcEIsU0FBa0M4RCxXQUFsQyxFQUFQO0FBQ0Q7O0FBRURXLFdBQVNuRCxJQUFULEVBQWVnQixNQUFmLEVBQXVCYyxTQUF2QixFQUFrQzs7QUFFaEMsU0FBS3ZELE1BQUwsQ0FBWTZFLFNBQVosQ0FBc0JwRCxJQUF0QixFQUE0QmdCLE1BQTVCLEVBQW9DYyxTQUFwQzs7QUFFQSxRQUFJLENBQUNkLE9BQU9xQyxPQUFaLEVBQXFCO0FBQ25CO0FBQ0Q7O0FBRUQsUUFBSSxDQUFDbkMsTUFBTUMsT0FBTixDQUFjSCxPQUFPcUMsT0FBckIsQ0FBTCxFQUFvQztBQUNsQyxZQUFNLElBQUk5RCxLQUFKLENBQVUsb0RBQVYsQ0FBTjtBQUNEOztBQUVELFNBQUssTUFBTStELE1BQVgsSUFBcUJ0QyxPQUFPcUMsT0FBNUIsRUFBcUM7O0FBRW5DLFVBQUksT0FBT0MsTUFBUCxLQUFrQixRQUF0QixFQUFnQztBQUM5QixjQUFNLElBQUkvRCxLQUFKLENBQVUsb0RBQVYsQ0FBTjtBQUNEOztBQUVELFdBQUtoQixNQUFMLENBQVlnRixPQUFaLENBQW9CLENBQUN2RCxJQUFELEVBQU9zRCxNQUFQLENBQXBCO0FBQ0Q7QUFDRjtBQXBPOEIsQ0FBakMiLCJmaWxlIjoiQ29udGFpbmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgQ29tcG9zZXIgPSByZXF1aXJlKFwidGFsZW50Y29tcG9zZXJcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ29udGFpbmVyIHtcblxuICBjb25zdHJ1Y3RvcihncmFwaCwgbW9kaWZpZXJzKSB7XG4gICAgdGhpcy5ncmFwaF8gPSBncmFwaDtcbiAgICB0aGlzLm1vZGlmaWVyc18gPSBtb2RpZmllcnM7XG4gICAgdGhpcy5zaW5nbGV0b25DYWNoZV8gPSBuZXcgTWFwKCk7XG4gIH1cblxuICBnZXRUYW1wZXJlZFZlcnRleERhdGFfKGN1cnJlbnQpIHtcblxuICAgIGlmICh0aGlzLm1vZGlmaWVyc18ub3B0aW9uYWwuaXNPcHRpb25hbChjdXJyZW50KSkge1xuXG4gICAgICBjb25zdCBjaG9wcGVkT3B0aW9uYWwgPSB0aGlzLm1vZGlmaWVyc18ub3B0aW9uYWwuY2hvcChjdXJyZW50KTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ3JhcGhfLmdldFZlcnRleERhdGEoY2hvcHBlZE9wdGlvbmFsKSB8fCB7XCJ0eXBlXCI6IFwib3B0aW9uYWxcIn07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubW9kaWZpZXJzXy5mYWN0b3J5LmlzRmFjdG9yeShjdXJyZW50KSkge1xuXG4gICAgICBjb25zdCBjaG9wcGVkQ3VycmVudCA9IHRoaXMubW9kaWZpZXJzXy5mYWN0b3J5LmNob3AoY3VycmVudCk7XG4gICAgICBjb25zdCB2ZXJ0ZXhEYXRhID0gdGhpcy5ncmFwaF8uZ2V0VmVydGV4RGF0YShjaG9wcGVkQ3VycmVudCk7XG5cbiAgICAgIGlmICh2ZXJ0ZXhEYXRhICYmIHZlcnRleERhdGEudHlwZSAhPT0gXCJjbGFzc1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9ubHkgY2xhc3NlcyBjYW4gYmUgZmFjdG9yaXplZFwiKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHZlcnRleERhdGEpIHtcbiAgICAgICAgdmVydGV4RGF0YS50eXBlID0gXCJmYWN0b3J5XCI7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2ZXJ0ZXhEYXRhO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmdyYXBoXy5nZXRWZXJ0ZXhEYXRhKGN1cnJlbnQpO1xuICB9XG5cbiAgcGFyc2VUYWxlbnROYW1lXyh0YWxlbnROYW1lKSB7XG5cbiAgICBjb25zdCByZTEgPSAvW146XSovO1xuICAgIGNvbnN0IHJlMiA9IC9bXjpdKiQvO1xuICAgIGNvbnN0IHJlMyA9IC9cXCwvO1xuICAgIGNvbnN0IHJlNCA9IC9cXD4vO1xuICAgIGNvbnN0IHJlNSA9IC9cXC0vO1xuICAgIGNvbnN0IHJlNiA9IC9bXi1dKi87XG4gICAgY29uc3QgbmFtZSA9IHJlMVtTeW1ib2wubWF0Y2hdKHRhbGVudE5hbWUpWzBdLnRyaW0oKTtcbiAgICBsZXQgcmVzb2x1dGlvbnMgPSByZTJbU3ltYm9sLm1hdGNoXSh0YWxlbnROYW1lKVswXS50cmltKCk7XG5cbiAgICByZXNvbHV0aW9ucyA9IHJlM1tTeW1ib2wuc3BsaXRdKHJlc29sdXRpb25zKS5tYXAobWF0Y2ggPT4gbWF0Y2gudHJpbSgpKTtcblxuICAgIGNvbnN0IGFsaWFzZXMgPSByZXNvbHV0aW9ucy5yZWR1Y2UoKGFjY3UsIHJlc29sdXRpb24pID0+IHtcblxuICAgICAgaWYgKHJlNC50ZXN0KHJlc29sdXRpb24pKSB7XG5cbiAgICAgICAgYWNjdS5wdXNoKHJlNFtTeW1ib2wuc3BsaXRdKHJlc29sdXRpb24pLm1hcChtYXRjaCA9PiBtYXRjaC50cmltKCkpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjY3U7XG4gICAgfSwgW10pO1xuICAgIGNvbnN0IGV4Y2x1ZGVzID0gcmVzb2x1dGlvbnMucmVkdWNlKChhY2N1LCByZXNvbHV0aW9uKSA9PiB7XG5cbiAgICAgIGlmIChyZTUudGVzdChyZXNvbHV0aW9uKSkge1xuXG4gICAgICAgIGFjY3UucHVzaChyZTZbU3ltYm9sLm1hdGNoXShyZXNvbHV0aW9uKS5tYXAobWF0Y2ggPT4gbWF0Y2gudHJpbSgpKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY2N1O1xuICAgIH0sIFtdKTtcblxuICAgIHJldHVybiB7bmFtZSwgYWxpYXNlcywgZXhjbHVkZXN9O1xuICB9XG5cbiAgY29tcG9zZV8odmVydGV4RGF0YSwgaW5zdGFuY2UpIHtcblxuICAgIGlmICghdmVydGV4RGF0YS52ZXJ0ZXguJGNvbXBvc2UpIHtcbiAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmVydGV4RGF0YS52ZXJ0ZXguJGNvbXBvc2UpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgXFxcIiRjb21wb3NlXFxcIiBsaXN0IHNob3VsZCBiZSBhbiBhcnJheSBvZiBzdHJpbmdzXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHRhbGVudHMgPSB2ZXJ0ZXhEYXRhLnZlcnRleC4kY29tcG9zZS5tYXAodGFsZW50TmFtZSA9PiB7XG5cbiAgICAgIGlmICh0eXBlb2YgdGFsZW50TmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgXFxcIiRjb21wb3NlXFxcIiBsaXN0IHNob3VsZCBiZSBhbiBhcnJheSBvZiBzdHJpbmdzXCIpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB7bmFtZSwgYWxpYXNlcywgZXhjbHVkZXN9ID0gdGhpcy5wYXJzZVRhbGVudE5hbWVfKHRhbGVudE5hbWUpO1xuXG4gICAgICBjb25zdCB0YWxlbnREYXRhID0gdGhpcy5ncmFwaF8uZ2V0VmVydGV4RGF0YShuYW1lKTtcblxuICAgICAgaWYgKCF0YWxlbnREYXRhKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIHRhbGVudCBcIiR7dGFsZW50TmFtZX1cIiBpcyBub3QgcmVnaXN0ZXJlZGApO1xuICAgICAgfVxuXG4gICAgICBpZiAodGFsZW50RGF0YS50eXBlICE9PSBcInBhc3NUaHJvdWdoXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgdGFsZW50IFwiJHt0YWxlbnROYW1lfVwiIGhhcyB0byBiZSBhIHRhbGVudCBjcmVhdGVkIGJ5IHRoZSBcIiNjcmVhdGVUYWxlbnRcIiBtZXRob2RgKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHJldCA9IHRhbGVudERhdGEudmVydGV4O1xuXG4gICAgICBpZiAoYWxpYXNlcy5sZW5ndGgpIHtcblxuICAgICAgICBmb3IgKGNvbnN0IGFsaWFzIG9mIGFsaWFzZXMpIHtcblxuICAgICAgICAgIHJldCA9IENvbXBvc2VyLmFsaWFzKHJldCwgYWxpYXNbMF0sIGFsaWFzWzFdKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZXhjbHVkZXMubGVuZ3RoKSB7XG5cbiAgICAgICAgZm9yIChjb25zdCBleGNsdWRlIG9mIGV4Y2x1ZGVzKSB7XG5cbiAgICAgICAgICByZXQgPSBDb21wb3Nlci5leGNsdWRlKHJldCwgZXhjbHVkZVswXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJldDtcbiAgICB9KTtcblxuICAgIHJldHVybiBDb21wb3Nlci5jb21wb3NlV2l0aFRhbGVudHMoaW5zdGFuY2UsIC4uLnRhbGVudHMpO1xuICB9XG5cbiAgY3JlYXRlSW5qZWN0aW9uRm9yQ2xhc3NfKHZlcnRleERhdGEsIGFyZ3MsIGN1cnJlbnQsIHBlclJlcXVlc3RDYWNoZSkge1xuXG4gICAgc3dpdGNoICh2ZXJ0ZXhEYXRhLmxpZmVDeWNsZSkge1xuICAgICAgY2FzZSBcInVuaXF1ZVwiOlxuICAgICAgICByZXR1cm4gdGhpcy5jb21wb3NlXyh2ZXJ0ZXhEYXRhLCBSZWZsZWN0LmNvbnN0cnVjdCh2ZXJ0ZXhEYXRhLnZlcnRleCwgYXJncykpO1xuICAgICAgY2FzZSBcInNpbmdsZXRvblwiOlxuXG4gICAgICAgIGlmICh0aGlzLnNpbmdsZXRvbkNhY2hlXy5oYXMoY3VycmVudCkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zaW5nbGV0b25DYWNoZV8uZ2V0KGN1cnJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2luZ2xldG9uSW5zdGFuY2UgPSB0aGlzLmNvbXBvc2VfKHZlcnRleERhdGEsIFJlZmxlY3QuY29uc3RydWN0KHZlcnRleERhdGEudmVydGV4LCBhcmdzKSk7XG5cbiAgICAgICAgdGhpcy5zaW5nbGV0b25DYWNoZV8uc2V0KGN1cnJlbnQsIHNpbmdsZXRvbkluc3RhbmNlKTtcbiAgICAgICAgcmV0dXJuIHNpbmdsZXRvbkluc3RhbmNlO1xuICAgICAgZGVmYXVsdDpcblxuICAgICAgICBpZiAocGVyUmVxdWVzdENhY2hlLmhhcyhjdXJyZW50KSkge1xuICAgICAgICAgIHJldHVybiBwZXJSZXF1ZXN0Q2FjaGUuZ2V0KGN1cnJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGVyUmVxdWVzdEluc3RhbmNlID0gdGhpcy5jb21wb3NlXyh2ZXJ0ZXhEYXRhLCBSZWZsZWN0LmNvbnN0cnVjdCh2ZXJ0ZXhEYXRhLnZlcnRleCwgYXJncykpO1xuXG4gICAgICAgIHBlclJlcXVlc3RDYWNoZS5zZXQoY3VycmVudCwgcGVyUmVxdWVzdEluc3RhbmNlKTtcbiAgICAgICAgcmV0dXJuIHBlclJlcXVlc3RJbnN0YW5jZTtcbiAgICB9XG4gIH1cblxuICBjcmVhdGVJbmplY3Rpb25fKGN1cnJlbnQsIGRlcGVuZGVuY2llcywgcGVyUmVxdWVzdENhY2hlLCAuLi5leHRyYVBhcmFtcykge1xuXG4gICAgY29uc3QgdmVydGV4RGF0YSA9IHRoaXMuZ2V0VGFtcGVyZWRWZXJ0ZXhEYXRhXyhjdXJyZW50KTtcbiAgICBjb25zdCBhcmdzID0gWy4uLmRlcGVuZGVuY2llcywgLi4uZXh0cmFQYXJhbXNdO1xuXG4gICAgaWYgKCF2ZXJ0ZXhEYXRhKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7Y3VycmVudH0gaGFzbid0IGJlZW4gcmVnaXN0ZXJlZGApO1xuICAgIH1cblxuICAgIHN3aXRjaCAodmVydGV4RGF0YS50eXBlKSB7XG4gICAgICBjYXNlIFwib3B0aW9uYWxcIjpcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICBjYXNlIFwiZmFjdG9yeVwiOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGdldCguLi5mYWN0b3J5UGFyYW1zKSB7XG4gICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5jb25zdHJ1Y3QodmVydGV4RGF0YS52ZXJ0ZXgsIFsuLi5hcmdzLCAuLi5mYWN0b3J5UGFyYW1zXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgY2FzZSBcImNsYXNzXCI6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUluamVjdGlvbkZvckNsYXNzXyh2ZXJ0ZXhEYXRhLCBhcmdzLCBjdXJyZW50LCBwZXJSZXF1ZXN0Q2FjaGUpO1xuICAgICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICAgIHJldHVybiBSZWZsZWN0LmFwcGx5KHZlcnRleERhdGEudmVydGV4LCBudWxsLCBhcmdzKTtcbiAgICAgIGNhc2UgXCJwYXNzVGhyb3VnaFwiOlxuICAgICAgICByZXR1cm4gdmVydGV4RGF0YS52ZXJ0ZXg7XG4gICAgfVxuICB9XG5cbiAgZGZzXyhjdXJyZW50LCBleHBsb3JpbmcsIHBlclJlcXVlc3RDYWNoZSwgLi4uZXh0cmFQYXJhbXMpIHtcblxuICAgIGV4cGxvcmluZy5wdXNoKGN1cnJlbnQpO1xuXG4gICAgY29uc3QgY2hpbGRWZXJ0ZXhlcyA9IHRoaXMuZ3JhcGhfLmdldEFkamFjZW50VmVydGV4ZXMoY3VycmVudCk7XG4gICAgY29uc3QgZGVwZW5kZW5jaWVzID0gQXJyYXkuZnJvbShjaGlsZFZlcnRleGVzKS5tYXAoY2hpbGRWZXJ0ZXggPT4ge1xuXG4gICAgICBpZiAoZXhwbG9yaW5nLmluY2x1ZGVzKGNoaWxkVmVydGV4KSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBIGN5Y2xlIGhhcyBiZWVuIGRldGVjdGVkXCIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5kZnNfKGNoaWxkVmVydGV4LCBleHBsb3JpbmcsIHBlclJlcXVlc3RDYWNoZSk7XG4gICAgfSk7XG5cbiAgICBleHBsb3JpbmcucG9wKCk7XG5cbiAgICByZXR1cm4gdGhpcy5jcmVhdGVJbmplY3Rpb25fKGN1cnJlbnQsIGRlcGVuZGVuY2llcywgcGVyUmVxdWVzdENhY2hlLCAuLi5leHRyYVBhcmFtcyk7XG4gIH1cblxuICBnZXQobmFtZSwgLi4uZXh0cmFQYXJhbXMpIHtcblxuICAgIGNvbnN0IHZlcnRleERhdGEgPSB0aGlzLmdyYXBoXy5nZXRWZXJ0ZXhEYXRhKHRoaXMubW9kaWZpZXJzXy5mYWN0b3J5LmNob3AobmFtZSkpO1xuXG4gICAgaWYgKCF2ZXJ0ZXhEYXRhKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bmFtZX0gaGFzbid0IGJlZW4gcmVnaXN0ZXJlZGApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRmc18obmFtZSwgW10sIG5ldyBNYXAoKSwgLi4uZXh0cmFQYXJhbXMpO1xuICB9XG5cbiAgcmVnaXN0ZXIobmFtZSwgdmVydGV4LCBsaWZlQ3ljbGUpIHtcblxuICAgIHRoaXMuZ3JhcGhfLmFkZFZlcnRleChuYW1lLCB2ZXJ0ZXgsIGxpZmVDeWNsZSk7XG5cbiAgICBpZiAoIXZlcnRleC4kaW5qZWN0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHZlcnRleC4kaW5qZWN0KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIFxcXCIkaW5qZWN0XFxcIiBsaXN0IHNob3VsZCBiZSBhbiBhcnJheSBvZiBzdHJpbmdzXCIpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgaW5qZWN0IG9mIHZlcnRleC4kaW5qZWN0KSB7XG5cbiAgICAgIGlmICh0eXBlb2YgaW5qZWN0ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBcXFwiJGluamVjdFxcXCIgbGlzdCBzaG91bGQgYmUgYW4gYXJyYXkgb2Ygc3RyaW5nc1wiKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5ncmFwaF8uYWRkRWRnZShbbmFtZSwgaW5qZWN0XSk7XG4gICAgfVxuICB9XG59O1xuIl19
