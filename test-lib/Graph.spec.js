const {expect} = require("chai");
const Graph = require("../lib/Graph");

describe("The \"graph\" instance", () => {

  describe("when it gets created", () => {

    const graph = new Graph(["lifeCycleMock"]);

    it("should be an instance of the Graph class", () => {
      expect(graph).to.be.an.instanceOf(Graph);
    });
  });

  describe("when it gets created with none array lifecycle container", () => {

    it("should throw a type error", () => {
      expect(() => new Graph({})).to.throw(TypeError, "The lifeCycles parameter should be an array");
    });
  });

  describe("when it gets created with none string lifecycle parameters", () => {

    it("should throw a type error", () => {
      expect(() => new Graph([true])).to.throw(TypeError, "A lifeCycle should be a string");
    });
  });

  describe("when it gets created with none Map vertexes parameter", () => {

    it("should throw a type error", () => {
      expect(() => new Graph(["lifeCycleMock"], "noneMap"))
        .to.throw(TypeError, "The vertexes parameter has to be a Map");
    });
  });

  describe("when it gets created with a none Set edges parameter", () => {

    it("should throw a type error", () => {
      expect(() => new Graph(["lifeCycleMock"], new Map(), "noneSet"))
        .to.throw(TypeError, "The edges parameter has to be a Set");
    });
  });
});

describe("The \"addVertex\" method of the \"graph\" instance", () => {

  describe("when it's executed with a vertex which has already been registered", () => {

    const vertexes = new Map();
    const graph = new Graph(["lifeCycleMock"], vertexes);

    class classVertex {}

    graph.addVertex("foo", classVertex, "lifeCycleMock");

    it("should throw an error", () => {
      expect(() => graph.addVertex("foo", classVertex, "lifeCycleMock"))
        .to.throw(Error, "foo has already been registered");
    });
  });

  describe("when it's executed with a class vertex and a \"known\" life cycle", () => {

    const vertexes = new Map();
    const graph = new Graph(["lifeCycleMock"], vertexes);

    class classVertex {}

    it("should add a new class vertex", () => {

      graph.addVertex("foo", classVertex, "lifeCycleMock");

      expect(vertexes.get("foo")).to.deep.equal({
        "vertex": classVertex,
        "lifeCycle": "lifeCycleMock",
        "type": "class"
      });
    });
  });

  describe("when it's executed with a class vertex and an unknown life cycle", () => {

    const graph = new Graph(["lifeCycleMock"]);

    function funcVertex() {}

    it("should add a new function vertex", () => {

      expect(() => graph.addVertex("foo", funcVertex, "unknown")).to.throw(RangeError, "Unknown lifecycle");
    });
  });

  describe("when it's executed with a function vertex and a \"known\" life cycle", () => {

    const vertexes = new Map();
    const graph = new Graph(["lifeCycleMock"], vertexes);

    function funcVertex() {}

    it("should add a new function vertex", () => {

      graph.addVertex("foo", funcVertex, "lifeCycleMock");

      expect(vertexes.get("foo")).to.deep.equal({
        "vertex": funcVertex,
        "lifeCycle": "lifeCycleMock",
        "type": "function"
      });
    });
  });

  describe("when it's executed with a function vertex and an unknown life cycle", () => {

    const graph = new Graph(["lifeCycleMock"]);

    function funcVertex() {}

    it("should throw a range error", () => {

      expect(() => graph.addVertex("foo", funcVertex, "unknown")).to.throw(RangeError, "Unknown lifecycle");
    });
  });

  describe("when it's executed with a function vertex and a \"known\" life cycle", () => {

    const vertexes = new Map();
    const graph = new Graph(["lifeCycleMock"], vertexes);

    function funcVertex() {}

    it("should add a new function vertex", () => {

      graph.addVertex("foo", funcVertex, "lifeCycleMock");

      expect(vertexes.get("foo")).to.deep.equal({
        "vertex": funcVertex,
        "lifeCycle": "lifeCycleMock",
        "type": "function"
      });
    });
  });

  describe("when it's executed with a function vertex and an unknown life cycle", () => {

    const graph = new Graph(["lifeCycleMock"]);

    function funcVertex() {}

    it("should throw a range error", () => {

      expect(() => graph.addVertex("foo", funcVertex, "unknown")).to.throw(RangeError, "Unknown lifecycle");
    });
  });

  describe("The \"getVertexData\" method of the \"graph\" instance", () => {

    describe("when it's executed and the vertex which data is being requested has not been registered", () => {

      const graph = new Graph(["lifeCycleMock"]);

      it("should return undefined", () => {
        expect(graph.getVertexData("foo")).to.be.undefined;
      });
    });

    describe("when it's executed and the vertex which data is being requested has already been registered", () => {

      class FooVertex {}
      class BarVertex {}

      const graph = new Graph(["lifeCycleMock"], new Map([["foo", {
        "vertex": FooVertex,
        "lifeCycle": "lifeCycleMock",
        "type": "class"
      }], ["bar", {
        "vertex": BarVertex,
        "lifeCycle": "lifeCycleMock",
        "type": "class"
      }]]));

      it("should return the meta data of the specified vertex", () => {

        const data = graph.getVertexData("bar");

        expect(data).to.deep.equal({
          "vertex": BarVertex,
          "lifeCycle": "lifeCycleMock",
          "type": "class"
        });
      });
    });
  });

  describe("The \"addEdge\" method of the \"graph\" instance", () => {

    describe("when it's executed", () => {

      const edges = new Set([]);
      const newEdge = ["foo", "bar"];
      const graph = new Graph(["lifeCycleMock"], new Map(), edges);

      it("should return the meta data of the specified vertex", () => {

        graph.addEdge(newEdge);

        expect(edges.size).to.equal(1);
        expect(edges.values().next().value).to.be.equal(newEdge);
      });
    });

    describe("when it's executed but the edge was already added", () => {

      const edges = new Set([["foo", "bar"]]);
      const newEdge = ["foo", "bar"];
      const graph = new Graph(["lifeCycleMock"], new Map(), edges);

      it("should throw a \"Duplicated edge\" error", () => {
        expect(() => graph.addEdge(newEdge)).to.throw(Error, "Duplicated edge");
      });
    });
  });

  describe("The \"getAdjacentVertexes\" method of the \"graph\" instance", () => {

    describe("when it's executed", () => {

      class RootA {}
      class LeafB {}
      class LeafC {}

      const vertexes = new Map([
        ["a", {
          "vertex": RootA,
          "lifeCycle": "lifeCycleMock",
          "type": "class"
        }],
        ["b", {
          "vertex": LeafB,
          "lifeCycle": "lifeCycleMock",
          "type": "class"
        }],
        ["c", {
          "vertex": LeafC,
          "lifeCycle": "lifeCycleMock",
          "type": "class"
        }]
      ]);
      const edges = new Set([["a", "b"], ["a", "c"]]);
      const graph = new Graph(["lifeCycleMock"], vertexes, edges);

      it("should return the adjacent vertexes of the given vertex as a Map", () => {

        const adjacentVertexes = graph.getAdjacentVertexes("a");

        expect(adjacentVertexes).to.deep.equal(new Set(["b", "c"]));
      });
    });
  });
});
