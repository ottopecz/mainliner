const {expect} = require("chai");
const Graph = require("../lib/Graph");
const Container = require("../lib/Container");

describe("The \"container\" instance", () => {

  describe("when it gets created", () => {

    const container = new Container(new Graph(["lifeCycleMock"]));

    it("should be an instance of the Container class", () => {
      expect(container).to.be.an.instanceOf(Container);
    });
  });
});

describe("The \"register\" method of the container instance", () => {

  describe("when it gets executed", () => {

    const vertexes = new Map();
    const container = new Container(new Graph(["perRequest"], vertexes));

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

  describe("when it gets executed but the \"inject\" definition is not an array", () => {

    const vertexes = new Map();
    const container = new Container(new Graph(["perRequest"], vertexes));

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

  describe("when it gets executed but the \"inject\" definition is not an array of strings", () => {

    const vertexes = new Map();
    const container = new Container(new Graph(["perRequest"], vertexes));

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
    const container = new Container(new Graph(["perRequest"], vertexes, edges));

    it("should not register any the new edges", () => {

      class Foo {}

      container.register("foo", Foo);

      expect(edges).to.deep.equal(new Set());
    });
  });

  describe("when it's executed and the \"inject\" definition is an array of strings", () => {

    const vertexes = new Map();
    const edges = new Set();
    const container = new Container(new Graph(["perRequest"], vertexes, edges));

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

  describe("when it gets executed but the vertex hasn't been registered", () => {

    const container = new Container(new Graph(["perRequest"]));

    it("should throw an error", () => {
      expect(() => container.get("foo")).to.throw(Error, "foo hasn't been registered");
    });
  });

  describe("when it gets executed a \"straight\" dependency graph", () => {

    const container = new Container(new Graph(["perRequest"]));

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

  describe("when it gets executed a \"short tree\" dependency graph", () => {

    const container = new Container(new Graph(["perRequest"]));

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

  describe("when it gets executed one kind of \"tall tree\" dependency graph", () => {

    const container = new Container(new Graph(["perRequest"]));

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

  describe("when it gets executed an other kind of \"tall tree\" dependency graph", () => {

    const container = new Container(new Graph(["perRequest"]));

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

  describe("when it gets executed an other kind of \"diamond\" dependency graph", () => {

    const container = new Container(new Graph(["perRequest"]));

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

  describe("when it gets executed \"cycled\" dependency graph", () => {

    const container = new Container(new Graph(["perRequest"]));

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
});