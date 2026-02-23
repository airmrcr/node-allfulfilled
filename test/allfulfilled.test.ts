/*
 * Copyright (C) 2026 neocotic
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as assert from "node:assert";
import { describe, it } from "node:test";
import { allFulfilled } from "../src/allfulfilled.js";

describe("allFulfilled", () => {
  it("should resolve with values when all promises are fulfilled", async () => {
    const promises = [
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3),
    ];
    const result = await allFulfilled(promises);

    assert.deepStrictEqual(result, [1, 2, 3]);
  });

  it("should resolve with values when all promises are fulfilled with mixed types", async () => {
    const promises = [
      Promise.resolve(1),
      Promise.resolve("2"),
      Promise.resolve(new Date(3)),
    ];
    const result = await allFulfilled(promises);

    assert.deepStrictEqual(result, [1, "2", new Date(3)]);
  });

  describe("when any promises are rejected", () => {
    it("should reject with an AggregateError by default", async () => {
      const error1 = new Error("error 1");
      const error2 = new Error("error 2");
      const promises = [
        Promise.resolve(1),
        Promise.reject(error1),
        Promise.resolve(2),
        Promise.reject(error2),
      ];

      await assert.rejects(allFulfilled(promises), (err) => {
        assert.ok(err instanceof AggregateError);
        assert.deepStrictEqual(err.errors, [error1, error2]);
        return true;
      });
    });

    it("should reject with a mapped Error when toError is provided", async () => {
      const error1 = new Error("error 1");
      const error2 = new Error("error 2");
      const promises = [
        Promise.resolve(1),
        Promise.reject(error1),
        Promise.resolve(2),
        Promise.reject(error2),
      ];
      const customError = new Error("custom error");
      const toError = () => customError;

      await assert.rejects(allFulfilled(promises, toError), (err) => {
        assert.strictEqual(err, customError);
        return true;
      });
    });
  });

  describe("when promises is an empty array", () => {
    it("should resolve with an empty array", async () => {
      const result = await allFulfilled([]);

      assert.deepStrictEqual(result, []);
    });
  });
});
