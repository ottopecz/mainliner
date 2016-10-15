const {expect} = require("chai");
const app = require("../lib/index");

describe("index", () => {
  it("should export \"bar\" as \"foo\"", () => {
    expect(app).to.have.property("foo", "bar");
  });
});
