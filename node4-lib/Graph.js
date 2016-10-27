"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

module.exports = class Graph {

  constructor(lifeCycles, modifiers, vertexes, edges) {

    if (!lifeCycles) {
      throw new Error("The life cycles must be a parameter of the constructor");
    }

    if (!modifiers) {
      throw new Error("The modifiers must be a parameter of the constructor");
    }

    if (vertexes && !(vertexes instanceof Map)) {
      throw new TypeError("The vertexes parameter has to be a Map");
    }

    if (edges && !(edges instanceof Set)) {
      throw new TypeError("The edges parameter has to be a Set");
    }

    this.lifeCycles_ = lifeCycles;
    this.modifiers_ = modifiers;
    this.vertexes_ = vertexes || new Map();
    this.edges_ = edges || new Set();
  }

  addVertex(name, vertex, lifeCycle) {

    if (this.vertexes_.has(name)) {
      throw new Error(`${ name } has already been registered`);
    }

    if (lifeCycle && !this.lifeCycles_.contains(lifeCycle)) {
      throw new RangeError("Unknown lifecycle");
    }

    if (typeof vertex === "function") {
      if (vertex.toString().includes("class")) {
        this.vertexes_.set(name, {
          vertex: vertex,
          "lifeCycle": lifeCycle || this.lifeCycles_.getDefault(),
          "type": "class"
        });
      } else {
        this.vertexes_.set(name, { vertex: vertex, "type": "function" });
      }
    } else {
      this.vertexes_.set(name, { vertex: vertex, "type": "passThrough" });
    }
  }

  getVertexData(name) {

    for (const _ref of this.vertexes_) {
      var _ref2 = _slicedToArray(_ref, 2);

      const key = _ref2[0];
      const value = _ref2[1];

      if (key === name) {

        const copy = {};

        for (const ownKey of Reflect.ownKeys(value)) {

          const desc = Reflect.getOwnPropertyDescriptor(value, ownKey);

          Reflect.defineProperty(copy, ownKey, desc);
        }
        return copy;
      }
    }
  }

  addEdge(edge) {

    for (const storedEdge of this.edges_) {
      if (edge[0] === storedEdge[0] && edge[1] === storedEdge[1]) {
        throw new Error("Duplicated edge");
      }
    }

    this.edges_.add(edge);
  }

  getAdjacentVertexes(vertexName) {

    const chopped = this.modifiers_.factory.chop(this.modifiers_.optional.chop(vertexName));
    const ret = new Set();

    for (const edge of this.edges_) {
      if (edge[0] === chopped) {
        ret.add(edge[1]);
      }
    }

    return ret;
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9HcmFwaC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwiR3JhcGgiLCJjb25zdHJ1Y3RvciIsImxpZmVDeWNsZXMiLCJtb2RpZmllcnMiLCJ2ZXJ0ZXhlcyIsImVkZ2VzIiwiRXJyb3IiLCJNYXAiLCJUeXBlRXJyb3IiLCJTZXQiLCJsaWZlQ3ljbGVzXyIsIm1vZGlmaWVyc18iLCJ2ZXJ0ZXhlc18iLCJlZGdlc18iLCJhZGRWZXJ0ZXgiLCJuYW1lIiwidmVydGV4IiwibGlmZUN5Y2xlIiwiaGFzIiwiY29udGFpbnMiLCJSYW5nZUVycm9yIiwidG9TdHJpbmciLCJpbmNsdWRlcyIsInNldCIsImdldERlZmF1bHQiLCJnZXRWZXJ0ZXhEYXRhIiwia2V5IiwidmFsdWUiLCJjb3B5Iiwib3duS2V5IiwiUmVmbGVjdCIsIm93bktleXMiLCJkZXNjIiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiZGVmaW5lUHJvcGVydHkiLCJhZGRFZGdlIiwiZWRnZSIsInN0b3JlZEVkZ2UiLCJhZGQiLCJnZXRBZGphY2VudFZlcnRleGVzIiwidmVydGV4TmFtZSIsImNob3BwZWQiLCJmYWN0b3J5IiwiY2hvcCIsIm9wdGlvbmFsIiwicmV0Il0sIm1hcHBpbmdzIjoiOzs7O0FBQUFBLE9BQU9DLE9BQVAsR0FBaUIsTUFBTUMsS0FBTixDQUFZOztBQUUzQkMsY0FBWUMsVUFBWixFQUF3QkMsU0FBeEIsRUFBbUNDLFFBQW5DLEVBQTZDQyxLQUE3QyxFQUFvRDs7QUFFbEQsUUFBSSxDQUFDSCxVQUFMLEVBQWlCO0FBQ2YsWUFBTSxJQUFJSSxLQUFKLENBQVUsd0RBQVYsQ0FBTjtBQUNEOztBQUVELFFBQUksQ0FBQ0gsU0FBTCxFQUFnQjtBQUNkLFlBQU0sSUFBSUcsS0FBSixDQUFVLHNEQUFWLENBQU47QUFDRDs7QUFFRCxRQUFJRixZQUFZLEVBQUVBLG9CQUFvQkcsR0FBdEIsQ0FBaEIsRUFBNEM7QUFDMUMsWUFBTSxJQUFJQyxTQUFKLENBQWMsd0NB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LElBQVgsSUFBb0IsS0FBS3ZCLE1BQXpCLEVBQWtDO0FBQ2hDLFVBQUl1QixLQUFLLENBQUwsTUFBWUssT0FBaEIsRUFBeUI7QUFDdkJJLFlBQUlQLEdBQUosQ0FBUUYsS0FBSyxDQUFMLENBQVI7QUFDRDtBQUNGOztBQUVELFdBQU9TLEdBQVA7QUFDRDtBQTVGMEIsQ0FBN0IiLCJmaWxlIjoiR3JhcGguanMiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEdyYXBoIHtcblxuICBjb25zdHJ1Y3RvcihsaWZlQ3ljbGVzLCBtb2RpZmllcnMsIHZlcnRleGVzLCBlZGdlcykge1xuXG4gICAgaWYgKCFsaWZlQ3ljbGVzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgbGlmZSBjeWNsZXMgbXVzdCBiZSBhIHBhcmFtZXRlciBvZiB0aGUgY29uc3RydWN0b3JcIik7XG4gICAgfVxuXG4gICAgaWYgKCFtb2RpZmllcnMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBtb2RpZmllcnMgbXVzdCBiZSBhIHBhcmFtZXRlciBvZiB0aGUgY29uc3RydWN0b3JcIik7XG4gICAgfVxuXG4gICAgaWYgKHZlcnRleGVzICYmICEodmVydGV4ZXMgaW5zdGFuY2VvZiBNYXApKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhlIHZlcnRleGVzIHBhcmFtZXRlciBoYXMgdG8gYmUgYSBNYXBcIik7XG4gICAgfVxuXG4gICAgaWYgKGVkZ2VzICYmICEoZWRnZXMgaW5zdGFuY2VvZiBTZXQpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhlIGVkZ2VzIHBhcmFtZXRlciBoYXMgdG8gYmUgYSBTZXRcIik7XG4gICAgfVxuXG4gICAgdGhpcy5saWZlQ3ljbGVzXyA9IGxpZmVDeWNsZXM7XG4gICAgdGhpcy5tb2RpZmllcnNfID0gbW9kaWZpZXJzO1xuICAgIHRoaXMudmVydGV4ZXNfID0gdmVydGV4ZXMgfHwgbmV3IE1hcCgpO1xuICAgIHRoaXMuZWRnZXNfID0gZWRnZXMgfHwgbmV3IFNldCgpO1xuICB9XG5cbiAgYWRkVmVydGV4KG5hbWUsIHZlcnRleCwgbGlmZUN5Y2xlKSB7XG5cbiAgICBpZiAodGhpcy52ZXJ0ZXhlc18uaGFzKG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bmFtZX0gaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkYCk7XG4gICAgfVxuXG4gICAgaWYgKGxpZmVDeWNsZSAmJiAhdGhpcy5saWZlQ3ljbGVzXy5jb250YWlucyhsaWZlQ3ljbGUpKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIlVua25vd24gbGlmZWN5Y2xlXCIpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdmVydGV4ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGlmICh2ZXJ0ZXgudG9TdHJpbmcoKS5pbmNsdWRlcyhcImNsYXNzXCIpKSB7XG4gICAgICAgIHRoaXMudmVydGV4ZXNfLnNldChuYW1lLCB7XG4gICAgICAgICAgdmVydGV4LFxuICAgICAgICAgIFwibGlmZUN5Y2xlXCI6IGxpZmVDeWNsZSB8fCB0aGlzLmxpZmVDeWNsZXNfLmdldERlZmF1bHQoKSxcbiAgICAgICAgICBcInR5cGVcIjogXCJjbGFzc1wiXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy52ZXJ0ZXhlc18uc2V0KG5hbWUsIHt2ZXJ0ZXgsIFwidHlwZVwiOiBcImZ1bmN0aW9uXCJ9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy52ZXJ0ZXhlc18uc2V0KG5hbWUsIHt2ZXJ0ZXgsIFwidHlwZVwiOiBcInBhc3NUaHJvdWdoXCJ9KTtcbiAgICB9XG4gIH1cblxuICBnZXRWZXJ0ZXhEYXRhKG5hbWUpIHtcblxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIHRoaXMudmVydGV4ZXNfKSB7XG4gICAgICBpZiAoa2V5ID09PSBuYW1lKSB7XG5cbiAgICAgICAgY29uc3QgY29weSA9IHt9O1xuXG4gICAgICAgIGZvciAoY29uc3Qgb3duS2V5IG9mIFJlZmxlY3Qub3duS2V5cyh2YWx1ZSkpIHtcblxuICAgICAgICAgIGNvbnN0IGRlc2MgPSBSZWZsZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwgb3duS2V5KTtcblxuICAgICAgICAgIFJlZmxlY3QuZGVmaW5lUHJvcGVydHkoY29weSwgb3duS2V5LCBkZXNjKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29weTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhZGRFZGdlKGVkZ2UpIHtcblxuICAgIGZvciAoY29uc3Qgc3RvcmVkRWRnZSBvZiB0aGlzLmVkZ2VzXykge1xuICAgICAgaWYgKChlZGdlWzBdID09PSBzdG9yZWRFZGdlWzBdKSAmJiAoZWRnZVsxXSA9PT0gc3RvcmVkRWRnZVsxXSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRHVwbGljYXRlZCBlZGdlXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZWRnZXNfLmFkZChlZGdlKTtcbiAgfVxuXG4gIGdldEFkamFjZW50VmVydGV4ZXModmVydGV4TmFtZSkge1xuXG4gICAgY29uc3QgY2hvcHBlZCA9IHRoaXMubW9kaWZpZXJzXy5mYWN0b3J5LmNob3AodGhpcy5tb2RpZmllcnNfLm9wdGlvbmFsLmNob3AodmVydGV4TmFtZSkpO1xuICAgIGNvbnN0IHJldCA9IG5ldyBTZXQoKTtcblxuICAgIGZvciAoY29uc3QgZWRnZSBvZiAodGhpcy5lZGdlc18pKSB7XG4gICAgICBpZiAoZWRnZVswXSA9PT0gY2hvcHBlZCkge1xuICAgICAgICByZXQuYWRkKGVkZ2VbMV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG4gIH1cbn07XG4iXX0=
