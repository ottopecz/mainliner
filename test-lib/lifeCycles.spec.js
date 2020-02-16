const {expect} = require("@hapi/code");
const Lab = require("@hapi/lab");
const lifeCycles = require("../lib/lifeCycles");

const {describe, it} = exports.lab = Lab.script();

describe("The \"lifeCycles\" object", () => {

  describe("\"contains\" method", () => {

    it("should return \"true\" if the parameter is \"perRequest\"", () => {

      expect(lifeCycles.contains("perRequest")).to.be.true();
    });

    it("should return \"true\" if the parameter is \"singleton\"", () => {

      expect(lifeCycles.contains("singleton")).to.be.true();
    });

    it("should return \"true\" if the parameter is \"unique\"", () => {

      expect(lifeCycles.contains("unique")).to.be.true();
    });

    it("should return \"false\" if the parameter is anything else", () => {

      expect(lifeCycles.contains("whatever")).to.be.false();
    });
  });

  describe("\"getDefault\" method", () => {

    it("should return \"perRequest\"", () => {

      expect(lifeCycles.getDefault()).to.equal("perRequest");
    });
  });
});
