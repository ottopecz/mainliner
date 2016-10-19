const {expect} = require("chai");
const modifiers = require("../lib/modifiers");

describe("The \"modifiers\" object", () => {

  describe("The \"factory\" property", () => {

    describe("\"isFactory\" method", () => {

      it("should return \"true\" if the string has the \"Factory\" suffix", () => {
        expect(modifiers.factory.isFactory("someFactory")).to.be.true;
      });

      it("should return \"false\" if the string doesn't have the \"Factory\" suffix", () => {
        expect(modifiers.factory.isFactory("something")).to.be.false;
      });
    });

    describe("\"chop\" method", () => {

      it("should chop the \"Factory\" suffix of the string and return the rest of it", () => {
        expect(modifiers.factory.chop("someFactory")).to.equal("some");
      });

      it("should return the whole string if the string is suffixed with \"Factory\"", () => {
        expect(modifiers.factory.chop("something")).to.equal("something");
      });
    });
  });

  describe("The \"optional\" property", () => {

    describe("\"isOptional\" method", () => {

      it("should return \"true\" if the string has the \"?\" suffix", () => {
        expect(modifiers.optional.isOptional("something?")).to.be.true;
      });

      it("should return \"false\" if the string doesn't have the \"?\" suffix", () => {
        expect(modifiers.optional.isOptional("something")).to.be.false;
      });
    });

    describe("\"chop\" method", () => {

      it("should chop the \"?\" suffix of the string and return the rest of it", () => {
        expect(modifiers.optional.chop("something?")).to.equal("something");
      });

      it("should return the whole string if the string is suffixed with \"?\"", () => {
        expect(modifiers.optional.chop("something")).to.equal("something");
      });
    });
  });
});
