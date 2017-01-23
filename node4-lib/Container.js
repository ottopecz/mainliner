"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

const Composer = require("talentcomposer/node4-lib/index");

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9Db250YWluZXIuanMiXSwibmFtZXMiOlsiQ29tcG9zZXIiLCJyZXF1aXJlIiwibW9kdWxlIiwiZXhwb3J0cyIsIkNvbnRhaW5lciIsImNvbnN0cnVjdG9yIiwiZ3JhcGgiLCJtb2RpZmllcnMiLCJncmFwaF8iLCJtb2RpZmllcnNfIiwic2luZ2xldG9uQ2FjaGVfIiwiTWFwIiwiZ2V0VGFtcGVyZWRWZXJ0ZXhEYXRhXyIsImN1cnJlbnQiLCJvcHRpb25hbCIsImlzT3B0aW9uYWwiLCJjaG9wcGVkT3B0aW9uYWwiLCJjaG9wIiwiZ2V0VmVydGV4RGF0YSIsImZhY3RvcnkiLCJpc0ZhY3RvcnkiLCJjaG9wcGVkQ3VycmVudCIsInZlcnRleERhdGEiLCJ0eXBlIiwiRXJyb3IiLCJwYXJzZVRhbGVudE5hbWVfIiwidGFsZW50TmFtZSIsInJlMSIsInJlMiIsInJlMyIsInJlNCIsInJlNSIsInJlNiIsIm5hbWUiLCJTeW1ib2wiLCJtYXRjaCIsInRyaW0iLCJyZXNvbHV0aW9ucyIsInNwbGl0IiwibWFwIiwiYWxpYXNlcyIsInJlZHVjZSIsImFjY3UiLCJyZXNvbHV0aW9uIiwidGVzdCIsInB1c2giLCJleGNsdWRlcyIsImNvbXBvc2VfIiwiaW5zdGFuY2UiLCJ2ZXJ0ZXgiLCIkY29tcG9zZSIsIkFycmF5IiwiaXNBcnJheSIsInRhbGVudHMiLCJ0YWxlbnREYXRhIiwicmV0IiwibGVuZ3RoIiwiYWxpYXMiLCJleGNsdWRlIiwiY29tcG9zZVdpdGhUYWxlbnRzIiwiY3JlYXRlSW5qZWN0aW9uRm9yQ2xhc3NfIiwiYXJncyIsInBlclJlcXVlc3RDYWNoZSIsImxpZmVDeWNsZSIsIlJlZmxlY3QiLCJjb25zdHJ1Y3QiLCJoYXMiLCJnZXQiLCJzaW5nbGV0b25JbnN0YW5jZSIsInNldCIsInBlclJlcXVlc3RJbnN0YW5jZSIsImNyZWF0ZUluamVjdGlvbl8iLCJkZXBlbmRlbmNpZXMiLCJleHRyYVBhcmFtcyIsImZhY3RvcnlQYXJhbXMiLCJhcHBseSIsImRmc18iLCJleHBsb3JpbmciLCJjaGlsZFZlcnRleGVzIiwiZ2V0QWRqYWNlbnRWZXJ0ZXhlcyIsImZyb20iLCJjaGlsZFZlcnRleCIsImluY2x1ZGVzIiwicG9wIiwicmVnaXN0ZXIiLCJhZGRWZXJ0ZXgiLCIkaW5qZWN0IiwiaW5qZWN0IiwiYWRkRWRnZSJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE1BQU1BLFdBQVdDLFFBQVEsZ0NBQVIsQ0FBakI7O0FBRUFDLE9BQU9DLE9BQVAsR0FBaUIsTUFBTUMsU0FBTixDQUFnQjs7QUFFL0JDLGNBQVlDLEtBQVosRUFBbUJDLFNBQW5CLEVBQThCO0FBQzVCLFNBQUtDLE1BQUwsR0FBY0YsS0FBZDtBQUNBLFNBQUtHLFVBQUwsR0FBa0JGLFNBQWxCO0FBQ0EsU0FBS0csZUFBTCxHQUF1QixJQUFJQyxHQUFKLEVBQXZCO0FBQ0Q7O0FBRURDLHlCQUF1QkMsT0FBdkIsRUFBZ0M7O0FBRTlCLFFBQUksS0FBS0osVUFBTCxDQUFnQkssUUFBaEIsQ0FBeUJDLFVBQXpCLENBQW9DRixPQUFwQyxDQUFKLEVBQWtEOztBQUVoRCxZQUFNRyxrQkFBa0IsS0FBS1AsVUFBTCxDQUFnQkssUUFBaEIsQ0FBeUJHLElBQXpCLENBQThCSixPQUE5QixDQUF4Qjs7QUFFQSxhQUFPLEtBQUtMLE1BQUwsQ0FBWVUsYUFBWixDQUEwQkYsZUFBMUIsS0FBOEMsRUFBQyxRQUFRLFVBQVQsRUFBckQ7QUFDRDs7QUFFRCxRQUFJLEtBQUtQLFVBQUwsQ0FBZ0JVLE9BQWhCLENBQXdCQyxTQUF4QixDQUFrQ1AsT0FBbEMsQ0FBSixFQUFnRDs7QUFFOUMsWUFBTVEsaUJBQWlCLEtBQUtaLFVBQUwsQ0FBZ0JVLE9BQWhCLENBQXdCRixJQUF4QixDQUE2QkosT0FBN0IsQ0FBdkI7QUFDQSxZQUFNUyxhQUFhLEtBQUtkLE1BQUwsQ0FBWVUsYUFBWixDQUEwQkcsY0FBMUIsQ0FBbkI7O0FBRUEsVUFBSUMsY0FBY0EsV0FBV0MsSUFBWCxLQUFvQixPQUF0QyxFQUErQztBQUM3QyxjQUFNLElBQUlD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LEtBQUtkLE1BQUwsQ0FBWVUsYUFBWixDQUEwQixLQUFLVCxVQUFMLENBQWdCVSxPQUFoQixDQUF3QkYsSUFBeEIsQ0FBNkJnQixJQUE3QixDQUExQixDQUFuQjs7QUFFQSxRQUFJLENBQUNYLFVBQUwsRUFBaUI7QUFDZixZQUFNLElBQUlFLEtBQUosQ0FBVyxJQUFFUyxJQUFLLDBCQUFsQixDQUFOO0FBQ0Q7O0FBTnVCLHVDQUFid0MsV0FBYTtBQUFiQSxpQkFBYTtBQUFBOztBQVF4QixXQUFPLEtBQUtHLElBQUwsY0FBVTNDLElBQVYsRUFBZ0IsRUFBaEIsRUFBb0IsSUFBSXRCLEdBQUosRUFBcEIsU0FBa0M4RCxXQUFsQyxFQUFQO0FBQ0Q7O0FBRURXLFdBQVNuRCxJQUFULEVBQWVnQixNQUFmLEVBQXVCYyxTQUF2QixFQUFrQzs7QUFFaEMsU0FBS3ZELE1BQUwsQ0FBWTZFLFNBQVosQ0FBc0JwRCxJQUF0QixFQUE0QmdCLE1BQTVCLEVBQW9DYyxTQUFwQzs7QUFFQSxRQUFJLENBQUNkLE9BQU9xQyxPQUFaLEVBQXFCO0FBQ25CO0FBQ0Q7O0FBRUQsUUFBSSxDQUFDbkMsTUFBTUMsT0FBTixDQUFjSCxPQUFPcUMsT0FBckIsQ0FBTCxFQUFvQztBQUNsQyxZQUFNLElBQUk5RCxLQUFKLENBQVUsb0RBQVYsQ0FBTjtBQUNEOztBQUVELFNBQUssTUFBTStELE1BQVgsSUFBcUJ0QyxPQUFPcUMsT0FBNUIsRUFBcUM7O0FBRW5DLFVBQUksT0FBT0MsTUFBUCxLQUFrQixRQUF0QixFQUFnQztBQUM5QixjQUFNLElBQUkvRCxLQUFKLENBQVUsb0RBQVYsQ0FBTjtBQUNEOztBQUVELFdBQUtoQixNQUFMLENBQVlnRixPQUFaLENBQW9CLENBQUN2RCxJQUFELEVBQU9zRCxNQUFQLENBQXBCO0FBQ0Q7QUFDRjtBQXBPOEIsQ0FBakMiLCJmaWxlIjoiQ29udGFpbmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgQ29tcG9zZXIgPSByZXF1aXJlKFwidGFsZW50Y29tcG9zZXIvbm9kZTQtbGliL2luZGV4XCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbnRhaW5lciB7XG5cbiAgY29uc3RydWN0b3IoZ3JhcGgsIG1vZGlmaWVycykge1xuICAgIHRoaXMuZ3JhcGhfID0gZ3JhcGg7XG4gICAgdGhpcy5tb2RpZmllcnNfID0gbW9kaWZpZXJzO1xuICAgIHRoaXMuc2luZ2xldG9uQ2FjaGVfID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgZ2V0VGFtcGVyZWRWZXJ0ZXhEYXRhXyhjdXJyZW50KSB7XG5cbiAgICBpZiAodGhpcy5tb2RpZmllcnNfLm9wdGlvbmFsLmlzT3B0aW9uYWwoY3VycmVudCkpIHtcblxuICAgICAgY29uc3QgY2hvcHBlZE9wdGlvbmFsID0gdGhpcy5tb2RpZmllcnNfLm9wdGlvbmFsLmNob3AoY3VycmVudCk7XG5cbiAgICAgIHJldHVybiB0aGlzLmdyYXBoXy5nZXRWZXJ0ZXhEYXRhKGNob3BwZWRPcHRpb25hbCkgfHwge1widHlwZVwiOiBcIm9wdGlvbmFsXCJ9O1xuICAgIH1cblxuICAgIGlmICh0aGlzLm1vZGlmaWVyc18uZmFjdG9yeS5pc0ZhY3RvcnkoY3VycmVudCkpIHtcblxuICAgICAgY29uc3QgY2hvcHBlZEN1cnJlbnQgPSB0aGlzLm1vZGlmaWVyc18uZmFjdG9yeS5jaG9wKGN1cnJlbnQpO1xuICAgICAgY29uc3QgdmVydGV4RGF0YSA9IHRoaXMuZ3JhcGhfLmdldFZlcnRleERhdGEoY2hvcHBlZEN1cnJlbnQpO1xuXG4gICAgICBpZiAodmVydGV4RGF0YSAmJiB2ZXJ0ZXhEYXRhLnR5cGUgIT09IFwiY2xhc3NcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IGNsYXNzZXMgY2FuIGJlIGZhY3Rvcml6ZWRcIik7XG4gICAgICB9XG5cbiAgICAgIGlmICh2ZXJ0ZXhEYXRhKSB7XG4gICAgICAgIHZlcnRleERhdGEudHlwZSA9IFwiZmFjdG9yeVwiO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmVydGV4RGF0YTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5ncmFwaF8uZ2V0VmVydGV4RGF0YShjdXJyZW50KTtcbiAgfVxuXG4gIHBhcnNlVGFsZW50TmFtZV8odGFsZW50TmFtZSkge1xuXG4gICAgY29uc3QgcmUxID0gL1teOl0qLztcbiAgICBjb25zdCByZTIgPSAvW146XSokLztcbiAgICBjb25zdCByZTMgPSAvXFwsLztcbiAgICBjb25zdCByZTQgPSAvXFw+LztcbiAgICBjb25zdCByZTUgPSAvXFwtLztcbiAgICBjb25zdCByZTYgPSAvW14tXSovO1xuICAgIGNvbnN0IG5hbWUgPSByZTFbU3ltYm9sLm1hdGNoXSh0YWxlbnROYW1lKVswXS50cmltKCk7XG4gICAgbGV0IHJlc29sdXRpb25zID0gcmUyW1N5bWJvbC5tYXRjaF0odGFsZW50TmFtZSlbMF0udHJpbSgpO1xuXG4gICAgcmVzb2x1dGlvbnMgPSByZTNbU3ltYm9sLnNwbGl0XShyZXNvbHV0aW9ucykubWFwKG1hdGNoID0+IG1hdGNoLnRyaW0oKSk7XG5cbiAgICBjb25zdCBhbGlhc2VzID0gcmVzb2x1dGlvbnMucmVkdWNlKChhY2N1LCByZXNvbHV0aW9uKSA9PiB7XG5cbiAgICAgIGlmIChyZTQudGVzdChyZXNvbHV0aW9uKSkge1xuXG4gICAgICAgIGFjY3UucHVzaChyZTRbU3ltYm9sLnNwbGl0XShyZXNvbHV0aW9uKS5tYXAobWF0Y2ggPT4gbWF0Y2gudHJpbSgpKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY2N1O1xuICAgIH0sIFtdKTtcbiAgICBjb25zdCBleGNsdWRlcyA9IHJlc29sdXRpb25zLnJlZHVjZSgoYWNjdSwgcmVzb2x1dGlvbikgPT4ge1xuXG4gICAgICBpZiAocmU1LnRlc3QocmVzb2x1dGlvbikpIHtcblxuICAgICAgICBhY2N1LnB1c2gocmU2W1N5bWJvbC5tYXRjaF0ocmVzb2x1dGlvbikubWFwKG1hdGNoID0+IG1hdGNoLnRyaW0oKSkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWNjdTtcbiAgICB9LCBbXSk7XG5cbiAgICByZXR1cm4ge25hbWUsIGFsaWFzZXMsIGV4Y2x1ZGVzfTtcbiAgfVxuXG4gIGNvbXBvc2VfKHZlcnRleERhdGEsIGluc3RhbmNlKSB7XG5cbiAgICBpZiAoIXZlcnRleERhdGEudmVydGV4LiRjb21wb3NlKSB7XG4gICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfVxuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHZlcnRleERhdGEudmVydGV4LiRjb21wb3NlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIFxcXCIkY29tcG9zZVxcXCIgbGlzdCBzaG91bGQgYmUgYW4gYXJyYXkgb2Ygc3RyaW5nc1wiKTtcbiAgICB9XG5cbiAgICBjb25zdCB0YWxlbnRzID0gdmVydGV4RGF0YS52ZXJ0ZXguJGNvbXBvc2UubWFwKHRhbGVudE5hbWUgPT4ge1xuXG4gICAgICBpZiAodHlwZW9mIHRhbGVudE5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIFxcXCIkY29tcG9zZVxcXCIgbGlzdCBzaG91bGQgYmUgYW4gYXJyYXkgb2Ygc3RyaW5nc1wiKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qge25hbWUsIGFsaWFzZXMsIGV4Y2x1ZGVzfSA9IHRoaXMucGFyc2VUYWxlbnROYW1lXyh0YWxlbnROYW1lKTtcblxuICAgICAgY29uc3QgdGFsZW50RGF0YSA9IHRoaXMuZ3JhcGhfLmdldFZlcnRleERhdGEobmFtZSk7XG5cbiAgICAgIGlmICghdGFsZW50RGF0YSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSB0YWxlbnQgXCIke3RhbGVudE5hbWV9XCIgaXMgbm90IHJlZ2lzdGVyZWRgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRhbGVudERhdGEudHlwZSAhPT0gXCJwYXNzVGhyb3VnaFwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIHRhbGVudCBcIiR7dGFsZW50TmFtZX1cIiBoYXMgdG8gYmUgYSB0YWxlbnQgY3JlYXRlZCBieSB0aGUgXCIjY3JlYXRlVGFsZW50XCIgbWV0aG9kYCk7XG4gICAgICB9XG5cbiAgICAgIGxldCByZXQgPSB0YWxlbnREYXRhLnZlcnRleDtcblxuICAgICAgaWYgKGFsaWFzZXMubGVuZ3RoKSB7XG5cbiAgICAgICAgZm9yIChjb25zdCBhbGlhcyBvZiBhbGlhc2VzKSB7XG5cbiAgICAgICAgICByZXQgPSBDb21wb3Nlci5hbGlhcyhyZXQsIGFsaWFzWzBdLCBhbGlhc1sxXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGV4Y2x1ZGVzLmxlbmd0aCkge1xuXG4gICAgICAgIGZvciAoY29uc3QgZXhjbHVkZSBvZiBleGNsdWRlcykge1xuXG4gICAgICAgICAgcmV0ID0gQ29tcG9zZXIuZXhjbHVkZShyZXQsIGV4Y2x1ZGVbMF0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gQ29tcG9zZXIuY29tcG9zZVdpdGhUYWxlbnRzKGluc3RhbmNlLCAuLi50YWxlbnRzKTtcbiAgfVxuXG4gIGNyZWF0ZUluamVjdGlvbkZvckNsYXNzXyh2ZXJ0ZXhEYXRhLCBhcmdzLCBjdXJyZW50LCBwZXJSZXF1ZXN0Q2FjaGUpIHtcblxuICAgIHN3aXRjaCAodmVydGV4RGF0YS5saWZlQ3ljbGUpIHtcbiAgICAgIGNhc2UgXCJ1bmlxdWVcIjpcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcG9zZV8odmVydGV4RGF0YSwgUmVmbGVjdC5jb25zdHJ1Y3QodmVydGV4RGF0YS52ZXJ0ZXgsIGFyZ3MpKTtcbiAgICAgIGNhc2UgXCJzaW5nbGV0b25cIjpcblxuICAgICAgICBpZiAodGhpcy5zaW5nbGV0b25DYWNoZV8uaGFzKGN1cnJlbnQpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2luZ2xldG9uQ2FjaGVfLmdldChjdXJyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNpbmdsZXRvbkluc3RhbmNlID0gdGhpcy5jb21wb3NlXyh2ZXJ0ZXhEYXRhLCBSZWZsZWN0LmNvbnN0cnVjdCh2ZXJ0ZXhEYXRhLnZlcnRleCwgYXJncykpO1xuXG4gICAgICAgIHRoaXMuc2luZ2xldG9uQ2FjaGVfLnNldChjdXJyZW50LCBzaW5nbGV0b25JbnN0YW5jZSk7XG4gICAgICAgIHJldHVybiBzaW5nbGV0b25JbnN0YW5jZTtcbiAgICAgIGRlZmF1bHQ6XG5cbiAgICAgICAgaWYgKHBlclJlcXVlc3RDYWNoZS5oYXMoY3VycmVudCkpIHtcbiAgICAgICAgICByZXR1cm4gcGVyUmVxdWVzdENhY2hlLmdldChjdXJyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBlclJlcXVlc3RJbnN0YW5jZSA9IHRoaXMuY29tcG9zZV8odmVydGV4RGF0YSwgUmVmbGVjdC5jb25zdHJ1Y3QodmVydGV4RGF0YS52ZXJ0ZXgsIGFyZ3MpKTtcblxuICAgICAgICBwZXJSZXF1ZXN0Q2FjaGUuc2V0KGN1cnJlbnQsIHBlclJlcXVlc3RJbnN0YW5jZSk7XG4gICAgICAgIHJldHVybiBwZXJSZXF1ZXN0SW5zdGFuY2U7XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlSW5qZWN0aW9uXyhjdXJyZW50LCBkZXBlbmRlbmNpZXMsIHBlclJlcXVlc3RDYWNoZSwgLi4uZXh0cmFQYXJhbXMpIHtcblxuICAgIGNvbnN0IHZlcnRleERhdGEgPSB0aGlzLmdldFRhbXBlcmVkVmVydGV4RGF0YV8oY3VycmVudCk7XG4gICAgY29uc3QgYXJncyA9IFsuLi5kZXBlbmRlbmNpZXMsIC4uLmV4dHJhUGFyYW1zXTtcblxuICAgIGlmICghdmVydGV4RGF0YSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2N1cnJlbnR9IGhhc24ndCBiZWVuIHJlZ2lzdGVyZWRgKTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHZlcnRleERhdGEudHlwZSkge1xuICAgICAgY2FzZSBcIm9wdGlvbmFsXCI6XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgY2FzZSBcImZhY3RvcnlcIjpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBnZXQoLi4uZmFjdG9yeVBhcmFtcykge1xuICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KHZlcnRleERhdGEudmVydGV4LCBbLi4uYXJncywgLi4uZmFjdG9yeVBhcmFtc10pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIGNhc2UgXCJjbGFzc1wiOlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVJbmplY3Rpb25Gb3JDbGFzc18odmVydGV4RGF0YSwgYXJncywgY3VycmVudCwgcGVyUmVxdWVzdENhY2hlKTtcbiAgICAgIGNhc2UgXCJmdW5jdGlvblwiOlxuICAgICAgICByZXR1cm4gUmVmbGVjdC5hcHBseSh2ZXJ0ZXhEYXRhLnZlcnRleCwgbnVsbCwgYXJncyk7XG4gICAgICBjYXNlIFwicGFzc1Rocm91Z2hcIjpcbiAgICAgICAgcmV0dXJuIHZlcnRleERhdGEudmVydGV4O1xuICAgIH1cbiAgfVxuXG4gIGRmc18oY3VycmVudCwgZXhwbG9yaW5nLCBwZXJSZXF1ZXN0Q2FjaGUsIC4uLmV4dHJhUGFyYW1zKSB7XG5cbiAgICBleHBsb3JpbmcucHVzaChjdXJyZW50KTtcblxuICAgIGNvbnN0IGNoaWxkVmVydGV4ZXMgPSB0aGlzLmdyYXBoXy5nZXRBZGphY2VudFZlcnRleGVzKGN1cnJlbnQpO1xuICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IEFycmF5LmZyb20oY2hpbGRWZXJ0ZXhlcykubWFwKGNoaWxkVmVydGV4ID0+IHtcblxuICAgICAgaWYgKGV4cGxvcmluZy5pbmNsdWRlcyhjaGlsZFZlcnRleCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQSBjeWNsZSBoYXMgYmVlbiBkZXRlY3RlZFwiKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZGZzXyhjaGlsZFZlcnRleCwgZXhwbG9yaW5nLCBwZXJSZXF1ZXN0Q2FjaGUpO1xuICAgIH0pO1xuXG4gICAgZXhwbG9yaW5nLnBvcCgpO1xuXG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlSW5qZWN0aW9uXyhjdXJyZW50LCBkZXBlbmRlbmNpZXMsIHBlclJlcXVlc3RDYWNoZSwgLi4uZXh0cmFQYXJhbXMpO1xuICB9XG5cbiAgZ2V0KG5hbWUsIC4uLmV4dHJhUGFyYW1zKSB7XG5cbiAgICBjb25zdCB2ZXJ0ZXhEYXRhID0gdGhpcy5ncmFwaF8uZ2V0VmVydGV4RGF0YSh0aGlzLm1vZGlmaWVyc18uZmFjdG9yeS5jaG9wKG5hbWUpKTtcblxuICAgIGlmICghdmVydGV4RGF0YSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25hbWV9IGhhc24ndCBiZWVuIHJlZ2lzdGVyZWRgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5kZnNfKG5hbWUsIFtdLCBuZXcgTWFwKCksIC4uLmV4dHJhUGFyYW1zKTtcbiAgfVxuXG4gIHJlZ2lzdGVyKG5hbWUsIHZlcnRleCwgbGlmZUN5Y2xlKSB7XG5cbiAgICB0aGlzLmdyYXBoXy5hZGRWZXJ0ZXgobmFtZSwgdmVydGV4LCBsaWZlQ3ljbGUpO1xuXG4gICAgaWYgKCF2ZXJ0ZXguJGluamVjdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghQXJyYXkuaXNBcnJheSh2ZXJ0ZXguJGluamVjdCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBcXFwiJGluamVjdFxcXCIgbGlzdCBzaG91bGQgYmUgYW4gYXJyYXkgb2Ygc3RyaW5nc1wiKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGluamVjdCBvZiB2ZXJ0ZXguJGluamVjdCkge1xuXG4gICAgICBpZiAodHlwZW9mIGluamVjdCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgXFxcIiRpbmplY3RcXFwiIGxpc3Qgc2hvdWxkIGJlIGFuIGFycmF5IG9mIHN0cmluZ3NcIik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZ3JhcGhfLmFkZEVkZ2UoW25hbWUsIGluamVjdF0pO1xuICAgIH1cbiAgfVxufTtcbiJdfQ==
