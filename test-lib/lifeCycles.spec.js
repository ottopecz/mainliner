const {expect} = require("code");
const Lab = require("lab");
const lifeCycles = require("../lib/lifeCycles");

const {describe, it} = exports.lab = Lab.script();

describe("The \"lifeCycles\" object", () => {

  describe("\"contains\" method", () => {

    it("should return \"true\" if the parameter is \"perRequest\"", done => {

      expect(lifeCycles.contains("perRequest")).to.be.true();
      done();
    });

    it("should return \"true\" if the parameter is \"singleton\"", done => {

      expect(lifeCycles.contains("singleton")).to.be.true();
      done();
    });

    it("should return \"true\" if the parameter is \"unique\"", done => {

      expect(lifeCycles.contains("unique")).to.be.true();
      done();
    });

    it("should return \"false\" if the parameter is anything else", done => {

      expect(lifeCycles.contains("whatever")).to.be.false();
      done();
    });
  });

  describe("\"getDefault\" method", () => {

    it("should return \"perRequest\"", done => {

      expect(lifeCycles.getDefault()).to.equal("perRequest");
      done();
    });
  });
});
