const Composer = require("talentcomposer");
const {expect} = require("chai");
const mainliner = require("../lib/index");
const Container = require("../lib/Container");

describe("The index", () => {

  it("should export \"mainliner\"", () => {
    expect(mainliner).be.an.object;
  });
});

describe("The create method of the mainliner", () => {

  describe("when it's executed", () => {

    const container = mainliner.create();

    it("should return a container", () => {
      expect(container).to.be.an.instanceOf(Container);
    });
  });
});

describe("The \"createTalent\" method", () => {

  it("should be a delegation of \"Composer.createTalent\"", () => {

    const talent = mainliner.createTalent({
      method() {}
    });

    expect(talent).to.be.an("object");
    expect(talent).to.have.a.property("method");
    expect(talent.method).to.deep.equal(talent.method);
  });
});

describe("The \"required\" property", () => {

  it("should be a delegation of \"Composer.required\"", () => {

    expect(mainliner.required).to.be.deep.equal(Composer.required);
  });
});
