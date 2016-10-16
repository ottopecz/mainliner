const {expect} = require("chai");
const Waddle = require("../lib/index");
const Container = require("../lib/Container");

describe("The index", () => {

  it("should export \"Waddle\"", () => {
    expect(Waddle).be.an.object;
  });
});

describe("The create method of the Waddle", () => {

  describe("when it's executed", () => {

    const container = Waddle.create();

    it("should return a container", () => {
      expect(container).to.be.an.instanceOf(Container);
    });
  });
});
