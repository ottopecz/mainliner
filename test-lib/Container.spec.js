const {expect} = require("chai");
const lifeCycles = require("../lib/lifeCycles");
const modifiers = require("../lib/modifiers");
const Graph = require("../lib/Graph");
const Container = require("../lib/Container");

describe("The \"container\" instance", () => {

  describe("when it gets created", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should be an instance of the Container class", () => {
      expect(container).to.be.an.instanceOf(Container);
    });
  });
});

describe("The \"register\" method of the container instance", () => {

  describe("when it's executed", () => {

    const vertexes = new Map();
    const container = new Container(new Graph(lifeCycles, modifiers, vertexes), modifiers);

    it("should register a new vertex", () => {

      class Foo {
        static get $inject() {
          return ["bar"];
        }
      }

      container.register("foo", Foo);

      expect(vertexes.has("foo")).to.be.true;
    });
  });

  describe("when it's executed but the \"inject\" definition is not an array", () => {

    const vertexes = new Map();
    const container = new Container(new Graph(lifeCycles, modifiers, vertexes), modifiers);

    it("should throw an error", () => {

      class Foo {
        static get $inject() {
          return {"foo": "foo"};
        }
      }

      expect(() => container.register("foo", Foo))
        .to.throw(Error, "The \"$inject\" list should be an array of strings");
    });
  });

  describe("when it's executed but the \"inject\" definition is not an array of strings", () => {

    const vertexes = new Map();
    const container = new Container(new Graph(lifeCycles, modifiers, vertexes), modifiers);

    it("should throw an error", () => {

      class Bar {
        static get $inject() {
          return [{"bar": "bar"}];
        }
      }

      expect(() => container.register("bar", Bar))
        .to.throw(Error, "The \"$inject\" list should be an array of strings");
    });
  });

  describe("when it's executed but the \"inject\"is not defined", () => {

    const vertexes = new Map();
    const edges = new Set();
    const container = new Container(new Graph(lifeCycles, modifiers, vertexes, edges), modifiers);

    it("should not register any the new edges", () => {

      class Foo {}

      container.register("foo", Foo);

      expect(edges).to.deep.equal(new Set());
    });
  });

  describe("when it's executed and the \"inject\" definition is an array of strings", () => {

    const vertexes = new Map();
    const edges = new Set();
    const container = new Container(new Graph(lifeCycles, modifiers, vertexes, edges), modifiers);

    it("should register the new edges", () => {

      class Foo {
        static get $inject() {
          return ["bar", "rab"];
        }
      }

      container.register("foo", Foo);

      expect(edges).to.deep.equal(new Set([["foo", "bar"], ["foo", "rab"]]));
    });
  });
});

describe("The \"get\" method of the container instance", () => {

  describe("when it's executed but the vertex hasn't been registered", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should throw an error", () => {
      expect(() => container.get("foo")).to.throw(Error, "foo hasn't been registered");
    });
  });

  describe("when it's executed on a \"straight\" dependency graph", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should instantiate the class and its dependencies", () => {

      class Five {}

      class Four {
        constructor(five) {
          expect(five).to.be.an.instanceOf(Five);
        }
        static get $inject() {
          return ["five"];
        }
      }

      class Three {
        constructor(four) {
          expect(four).to.be.an.instanceOf(Four);
        }
        static get $inject() {
          return ["four"];
        }
      }

      class Two {
        constructor(three) {
          expect(three).to.be.an.instanceOf(Three);
        }
        static get $inject() {
          return ["three"];
        }
      }

      class One {
        constructor(two) {
          expect(two).to.be.an.instanceOf(Two);
        }
        static get $inject() {
          return ["two"];
        }
      }

      container.register("one", One);
      container.register("two", Two);
      container.register("three", Three);
      container.register("four", Four);
      container.register("five", Five);
      expect(container.get("one")).to.be.an.instanceOf(One);
    });
  });

  describe("when it's executed on a \"short tree\" dependency graph", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should instantiate the class and its dependencies", () => {

      class Two {}
      class Three {}
      class Four {}
      class Five {}

      class One {
        constructor(two, three, four, five) {
          expect(two).to.be.an.instanceOf(Two);
          expect(three).to.be.an.instanceOf(Three);
          expect(four).to.be.an.instanceOf(Four);
          expect(five).to.be.an.instanceOf(Five);
        }
        static get $inject() {
          return ["two", "three", "four", "five"];
        }
      }

      container.register("one", One);
      container.register("two", Two);
      container.register("three", Three);
      container.register("four", Four);
      container.register("five", Five);
      expect(container.get("one")).to.be.an.instanceOf(One);
    });
  });

  describe("when it's executed on one kind of \"tall tree\" dependency graph", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should throw an error", () => {

      class Two {}

      class One {
        constructor(two) {
          expect(two).to.be.an.instanceOf(Two);
        }
        static get $inject() {
          return ["two", "three"];
        }
      }

      class Four {}
      class Five {}

      class Three {
        constructor(four, five) {
          expect(four).to.be.an.instanceOf(Four);
          expect(five).to.be.an.instanceOf(Five);
        }
        static get $inject() {
          return ["four", "five"];
        }
      }

      container.register("one", One);
      container.register("two", Two);
      container.register("three", Three);
      container.register("four", Four);
      container.register("five", Five);
      expect(container.get("one")).to.be.an.instanceOf(One);
    });
  });

  describe("when it's executed on an other kind of \"tall tree\" dependency graph", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should throw an error", () => {

      class Four {}
      class Five {}

      class Two {
        constructor(four, five) {
          expect(four).to.be.an.instanceOf(Four);
          expect(five).to.be.an.instanceOf(Five);
        }
        static get $inject() {
          return ["four", "five"];
        }
      }

      class Three {}

      class One {
        constructor(two, three) {
          expect(two).to.be.an.instanceOf(Two);
          expect(three).to.be.an.instanceOf(Three);
        }
        static get $inject() {
          return ["two", "three"];
        }
      }

      container.register("one", One);
      container.register("two", Two);
      container.register("three", Three);
      container.register("four", Four);
      container.register("five", Five);
      expect(container.get("one")).to.be.an.instanceOf(One);
    });
  });

  describe("when it's executed on a \"diamond\" dependency graph", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should not throw an error", () => {

      class Five {}

      class Four {
        constructor(five) {
          expect(five).to.be.an.instanceOf(Five);
        }
        static get $inject() {
          return ["five"];
        }
      }

      class Two {
        constructor(four) {
          expect(four).to.be.an.instanceOf(Four);
        }
        static get $inject() {
          return ["four"];
        }
      }

      class Three {
        constructor(four) {
          expect(four).to.be.an.instanceOf(Four);
        }
        static get $inject() {
          return ["four"];
        }
      }

      class One {
        constructor(two, three) {
          expect(two).to.be.an.instanceOf(Two);
          expect(three).to.be.an.instanceOf(Three);
        }
        static get $inject() {
          return ["two", "three"];
        }
      }

      container.register("one", One);
      container.register("two", Two);
      container.register("three", Three);
      container.register("four", Four);
      container.register("five", Five);
      expect(container.get("one")).to.be.an.instanceOf(One);
    });
  });

  describe("when it's executed on factorized vertex", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should return whatever the function returns", () => {

      class One {}

      container.register("one", One);

      const oneFactory = container.get("oneFactory");

      expect(oneFactory.get()).to.be.an.instanceOf(One);
    });
  });

  describe("when it's executed on factorized vertex", () => {

    const graph = new Graph(lifeCycles, modifiers);
    const container = new Container(graph, modifiers);

    it("should not change the type of the vertex - BUGFIX", () => {

      class One {}

      container.register("one", One);

      const vertexDataBefore = graph.getVertexData("one");

      expect(vertexDataBefore.type).to.equal("class"); // Checking before the act

      container.get("oneFactory");

      const vertexDataAfter = graph.getVertexData("one");

      expect(vertexDataAfter.type).to.equal("class"); // Checking after the act
    });
  });

  describe("when it's executed on function vertex", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should return whatever the function returns", () => {

      function one() {
        return "whatOneReturns";
      }

      container.register("one", one);
      expect(container.get("one")).to.be.equal("whatOneReturns");
    });
  });

  describe("when it's executed on vertex which has a function dependency", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should inject whatever the function dependency return", () => {

      function two() {
        return "whatTwoReturns";
      }

      function one(twoResult) {
        expect(twoResult).to.equal("whatTwoReturns");
        return "whatOneReturns";
      }
      one.$inject = ["two"];

      container.register("one", one);
      container.register("two", two);
      expect(container.get("one")).to.be.equal("whatOneReturns");
    });
  });

  describe("when it's executed on a passThrough vertex", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should return the passThrough dependency", () => {

      const one = {"foo": "bar"};

      container.register("one", one);
      expect(container.get("one")).to.be.equal(one);
    });
  });

  describe("when it's executed on a vertex which has passThrough dependency", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should inject the passThrough dependency", () => {

      const two = {"foo": "bar"};

      function one(twoInject) {
        expect(twoInject).to.equal(two);
        return "whatOneReturns";
      }
      one.$inject = ["two"];

      container.register("one", one);
      container.register("two", two);
      container.get("one");
    });
  });

  describe("when it's executed \"cycled\" dependency graph", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should throw an error", () => {

      /* eslint-disable no-use-before-define */

      class Five {
        constructor(one) {
          expect(one).to.be.an.instanceOf(One);
        }
        static get $inject() {
          return ["one"];
        }
      }

      /* eslint-enable no-use-before-define */

      class Four {
        constructor(five) {
          expect(five).to.be.an.instanceOf(Five);
        }
        static get $inject() {
          return ["five"];
        }
      }

      class Three {
        constructor(four) {
          expect(four).to.be.an.instanceOf(Four);
        }
        static get $inject() {
          return ["four"];
        }
      }

      class Two {
        constructor(three) {
          expect(three).to.be.an.instanceOf(Three);
        }
        static get $inject() {
          return ["three"];
        }
      }

      class One {
        constructor(two) {
          expect(two).to.be.an.instanceOf(Two);
        }
        static get $inject() {
          return ["two"];
        }
      }

      container.register("one", One);
      container.register("two", Two);
      container.register("three", Three);
      container.register("four", Four);
      container.register("five", Five);
      expect(() => container.get("one")).to.throw(Error, "A cycle has been detected");
    });
  });

  describe("when it's executed on a dependency graph which has a \"perRequest\" vertex", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    let four1Instance;
    let four2Instance;

    class Four {
      constructor() {
        this.fourInstance = "fourInstance";
      }
    }

    class Three {
      constructor(four) {
        four1Instance = four;
      }
      static get $inject() {
        return ["four"];
      }
    }

    class Two {
      constructor(four) {
        four2Instance = four;
      }
      static get $inject() {
        return ["four"];
      }
    }

    class One {
      constructor(two, three) {
        this.two = two;
        this.three = three;
      }
      static get $inject() {
        return ["two", "three"];
      }
    }

    container.register("one", One);
    container.register("two", Two);
    container.register("three", Three);
    container.register("four", Four, "perRequest");

    it("should instantiate the \"perRequest\" dependency only once per request", () => {

      container.get("one");

      expect(four1Instance).to.equal(four2Instance);
    });
  });

  describe("when it's executed on \"singleton\" registered vertex", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    class One {
      constructor() {}
    }

    container.register("one", One, "singleton");

    it("should instantiate the vertex only once no matter how many request were made", () => {

      const request1 = container.get("one");
      const request2 = container.get("one");

      expect(request1).to.equal(request2);
    });
  });

  describe("when it's executed on a dependency graph which has a \"unique\" vertex", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    let four1Instance;
    let four2Instance;

    class Four {
      constructor() {
        this.fourInstance = "fourInstance";
      }
    }

    class Three {
      constructor(four) {
        four1Instance = four;
      }
      static get $inject() {
        return ["four"];
      }
    }

    class Two {
      constructor(four) {
        four2Instance = four;
      }
      static get $inject() {
        return ["four"];
      }
    }

    class One {
      constructor(two, three) {
        this.two = two;
        this.three = three;
      }
      static get $inject() {
        return ["two", "three"];
      }
    }

    container.register("one", One);
    container.register("two", Two);
    container.register("three", Three);
    container.register("four", Four, "unique");

    it("should instantiate the \"unique\" dependency every time when it's accessed in one request", () => {

      container.get("one");

      expect(four1Instance).to.not.equal(four2Instance);
      expect(four1Instance).to.deep.equal(four2Instance);
    });
  });

  describe("when it's executed on \"unique\" registered vertex", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    class One {
      constructor() {}
    }

    container.register("one", One, "unique");

    it("should instantiate the vertex only once no matter how many requests were made", () => {

      const request1 = container.get("one");
      const request2 = container.get("one");

      expect(request1).to.not.equal(request2);
      expect(request1).to.deep.equal(request2);
    });
  });

  describe("when it's executed on a vertex which has a factorized class dependency", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should not instantiate the vertex but inject a factory for that", () => {

      class Three {}

      class Two {
        constructor(three, param) {
          this.dependency = three;
          this.factorized = param;
        }
        static get $inject() {
          return ["three"];
        }
      }

      class One {
        constructor(twoFactory) {
          expect(twoFactory).to.be.an.object;
          expect(twoFactory).to.have.property("get").that.is.a.function;

          const twoInstance = twoFactory.get(true);

          expect(twoInstance).to.have.property("dependency").that.is.an.instanceOf(Three);
          expect(twoInstance).to.have.property("factorized", true);
        }
        static get $inject() {
          return ["twoFactory"];
        }
      }

      container.register("one", One);
      container.register("two", Two);
      container.register("three", Three);

      container.get("one");
    });
  });

  describe("when it's executed on a vertex which has a factorized function dependency", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should throw an error", () => {

      function two() {}

      class One {
        constructor() {
        }
        static get $inject() {
          return ["twoFactory"];
        }
      }

      container.register("one", One);
      container.register("two", two);

      expect(() => container.get("one")).to.throw(Error, "Only classes can be factorized");
    });
  });

  describe("when it's executed on a vertex which has a factorized passThrough dependency", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should throw an error", () => {

      const two = {"foo": "bar"};

      class One {
        constructor() {}
        static get $inject() {
          return ["twoFactory"];
        }
      }

      container.register("one", One);
      container.register("two", two);

      expect(() => container.get("one")).to.throw(Error, "Only classes can be factorized");
    });
  });

  describe("when it's executed on a vertex which has a optional dependency which is not registered", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should inject a null value", () => {

      class One {
        constructor(two) {
          expect(two).to.be.null;
        }
        static get $inject() {
          return ["two?"];
        }
      }

      container.register("one", One);

      container.get("one");
    });
  });

  describe("when it's executed on a class vertex with an additional parameter", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should overload the constructor with that parameter", () => {

      const extraParam = {"foo": "bar"};

      class Two {}

      class One {
        constructor(two, overload) {
          expect(overload).to.equal(extraParam);
        }
        static get $inject() {
          return ["two"];
        }
      }

      container.register("one", One);
      container.register("two", Two);

      container.get("one", extraParam);
    });
  });

  describe("when it's executed on a function vertex with an additional parameter", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should overload the function with that parameter", () => {

      const extraParam = {"foo": "bar"};

      class Two {}

      function one(two, overload) {
        expect(overload).to.equal(extraParam);
      }
      one.$inject = ["two"];

      container.register("one", one);
      container.register("two", Two);

      container.get("one", extraParam);
    });
  });
});
