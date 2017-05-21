const {expect} = require("code");
const Lab = require("lab");
const modifiers = require("../lib/modifiers");

const {describe, it} = exports.lab = Lab.script();

describe("The \"modifiers\" object", () => {

  describe("The \"factory\" property", () => {

    describe("\"isFactory\" method", () => {

      it("should return \"true\" if the string has the \"Factory\" suffix", done => {

        expect(modifiers.factory.isFactory("someFactory")).to.be.true();
        done();
      });

      it("should return \"false\" if the string doesn't have the \"Factory\" suffix", done => {

        expect(modifiers.factory.isFactory("something")).to.be.false();
        done();
      });
    });

    describe("\"chop\" method", () => {

      it("should chop the \"Factory\" suffix of the string and return the rest of it", done => {

        expect(modifiers.factory.chop("someFactory")).to.equal("some");
        done();
      });

      it("should return the whole string if the string is suffixed with \"Factory\"", done => {

        expect(modifiers.factory.chop("something")).to.equal("something");
        done();
      });
    });
  });

  describe("The \"optional\" property", () => {

    describe("\"isOptional\" method", () => {

      it("should return \"true\" if the string has the \"?\" suffix", done => {

        expect(modifiers.optional.isOptional("something?")).to.be.true();
        done();
      });

      it("should return \"false\" if the string doesn't have the \"?\" suffix", done => {

        expect(modifiers.optional.isOptional("something")).to.be.false();
        done();
      });
    });

    describe("\"chop\" method", () => {

      it("should chop the \"?\" suffix of the string and return the rest of it", done => {

        expect(modifiers.optional.chop("something?")).to.equal("something");
        done();
      });

      it("should return the whole string if the string is suffixed with \"?\"", done => {

        expect(modifiers.optional.chop("something")).to.equal("something");
        done();
      });
    });
  });
});
