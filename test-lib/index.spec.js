const Composer = require("talentcomposer");
const {expect} = require("code");
const Lab = require("lab");
const mainliner = require("../lib/index");
const Container = require("../lib/Container");

const {describe, it} = exports.lab = Lab.script();

describe("The index", () => {

  it("should export \"mainliner\"", done => {

    expect(mainliner).be.an.object();
    done();
  });
});

describe("The create method of the mainliner", () => {

  describe("when it's executed", () => {

    const container = mainliner.create();

    it("should return a container", done => {

      expect(container).to.be.an.instanceOf(Container);
      done();
    });
  });
});

describe("The \"createTalent\" method", () => {

  it("should be a delegation of \"Composer.createTalent\"", done => {

    const talent = mainliner.createTalent({
      method() {}
    });

    expect(talent).to.be.an.object();
    expect(talent).to.include("method");
    expect(talent.method).to.equal(talent.method);
    done();
  });
});

describe("The \"required\" property", () => {

  it("should be a delegation of \"Composer.required\"", done => {

    expect(mainliner.required).to.be.equal(Composer.required);
    done();
  });
});
