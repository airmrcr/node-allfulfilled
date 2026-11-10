/*
 * Copyright (C) 2026 airmrcr
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
import { type Mock, describe, it, mock } from "node:test";
import { allFulfilled, bindAllFulfilled } from "../src/allfulfilled.js";
import {
  type ReasonListener,
  type ReasonMapper,
  preferError,
} from "../src/index.js";

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
    it("should reduce rejection reasons to a single error using aggregateError by default", async () => {
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

    it("should map rejection reasons that are not an Error to an Error with the reason as the cause using unknownError by default", async () => {
      const error1 = new Error("error 1");
      const error2 = "error 2";
      const promises = [
        Promise.resolve(1),
        Promise.reject(error1),
        Promise.resolve(2),
        Promise.reject(error2),
      ];

      await assert.rejects(allFulfilled(promises), (err) => {
        assert.ok(err instanceof AggregateError);
        assert.strictEqual(err.errors.length, 2);

        const [actualError1, actualError2] = err.errors;

        assert.strictEqual(actualError1, error1);

        assert.ok(actualError2 instanceof Error);
        assert.strictEqual(actualError2.cause, error2);
        assert.strictEqual(actualError2.message, "");
        return true;
      });
    });

    it("should reduce rejection reasons to a single error using reducer when provided as function", async () => {
      const error1 = new Error("error 1");
      const error2 = new Error("error 2");
      const promises = [
        Promise.resolve(1),
        Promise.reject(error1),
        Promise.resolve(2),
        Promise.reject(error2),
      ];

      await assert.rejects(allFulfilled(promises, preferError()), (err) => {
        assert.strictEqual(err, error1);
        return true;
      });
    });

    it("should reduce rejection reasons to a single error using reducer when provided as an option", async () => {
      const error1 = new Error("error 1");
      const error2 = new Error("error 2");
      const promises = [
        Promise.resolve(1),
        Promise.reject(error1),
        Promise.resolve(2),
        Promise.reject(error2),
      ];
      const reducer = preferError();

      await assert.rejects(allFulfilled(promises, { reducer }), (err) => {
        assert.strictEqual(err, error1);
        return true;
      });
    });

    it("should map rejection reasons that are not an Error using mapper when provided as an option", async () => {
      const error1 = new Error("error 1");
      const error2 = "error 2";
      const promises = [
        Promise.resolve(1),
        Promise.reject(error1),
        Promise.resolve(2),
        Promise.reject(error2),
      ];
      const mapper: Mock<ReasonMapper> = mock.fn(
        (reason) => new Error(`${reason}`),
      );

      await assert.rejects(allFulfilled(promises, { mapper }), (err) => {
        assert.ok(err instanceof AggregateError);
        assert.strictEqual(err.errors.length, 2);
        assert.strictEqual(mapper.mock.callCount(), 1);
        assert.deepStrictEqual(mapper.mock.calls[0]!.arguments, [error2, 3]);

        const [actualError1, actualError2] = err.errors;

        assert.strictEqual(actualError1, error1);

        assert.ok(actualError2 instanceof Error);
        assert.strictEqual(actualError2.message, error2);
        return true;
      });
    });

    it("should invoke listener with reason when provided as an option", async () => {
      const error1 = new Error("error 1");
      const error2 = "error 2";
      const promises = [
        Promise.resolve(1),
        Promise.reject(error1),
        Promise.resolve(2),
        Promise.reject(error2),
      ];
      const listener: Mock<ReasonListener> = mock.fn();

      await assert.rejects(allFulfilled(promises, { listener }), (err) => {
        assert.ok(err instanceof AggregateError);
        assert.strictEqual(listener.mock.callCount(), 2);

        assert.deepStrictEqual(listener.mock.calls[0]!.arguments, [
          {
            error: error1,
            isOriginalError: true,
            original: error1,
          },
          1,
        ]);

        assert.partialDeepStrictEqual(listener.mock.calls[1]!.arguments, [
          {
            isOriginalError: false,
            original: error2,
          },
          3,
        ]);
        assert.ok(listener.mock.calls[1]!.arguments[0].error instanceof Error);
        assert.strictEqual(
          listener.mock.calls[1]!.arguments[0].error.cause,
          error2,
        );
        assert.strictEqual(
          listener.mock.calls[1]!.arguments[0].error.message,
          "",
        );
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

describe("bindAllFulfilled", () => {
  describe("should return a function that", () => {
    it("should reduce rejection reasons to a single error using reducer when provided as function", async () => {
      const error1 = new Error("error 1");
      const error2 = new Error("error 2");
      const promises = [
        Promise.resolve(1),
        Promise.reject(error1),
        Promise.resolve(2),
        Promise.reject(error2),
      ];
      const boundAllFulfilled = bindAllFulfilled(preferError());

      await assert.rejects(boundAllFulfilled(promises), (err) => {
        assert.strictEqual(err, error1);
        return true;
      });
    });

    it("should reduce rejection reasons to a single error using reducer when provided as an option", async () => {
      const error1 = new Error("error 1");
      const error2 = new Error("error 2");
      const promises = [
        Promise.resolve(1),
        Promise.reject(error1),
        Promise.resolve(2),
        Promise.reject(error2),
      ];
      const reducer = preferError();
      const boundAllFulfilled = bindAllFulfilled({ reducer });

      await assert.rejects(boundAllFulfilled(promises), (err) => {
        assert.strictEqual(err, error1);
        return true;
      });
    });

    it("should map rejection reasons that are not an Error using mapper when provided as an option", async () => {
      const error1 = new Error("error 1");
      const error2 = "error 2";
      const promises = [
        Promise.resolve(1),
        Promise.reject(error1),
        Promise.resolve(2),
        Promise.reject(error2),
      ];
      const mapper: Mock<ReasonMapper> = mock.fn(
        (reason) => new Error(`${reason}`),
      );
      const boundAllFulfilled = bindAllFulfilled({ mapper });

      await assert.rejects(boundAllFulfilled(promises), (err) => {
        assert.ok(err instanceof AggregateError);
        assert.strictEqual(err.errors.length, 2);
        assert.strictEqual(mapper.mock.callCount(), 1);
        assert.deepStrictEqual(mapper.mock.calls[0]!.arguments, [error2, 3]);

        const [actualError1, actualError2] = err.errors;

        assert.strictEqual(actualError1, error1);

        assert.ok(actualError2 instanceof Error);
        assert.strictEqual(actualError2.message, error2);
        return true;
      });
    });

    it("should invoke listener with reason when provided as an option", async () => {
      const error1 = new Error("error 1");
      const error2 = "error 2";
      const promises = [
        Promise.resolve(1),
        Promise.reject(error1),
        Promise.resolve(2),
        Promise.reject(error2),
      ];
      const listener: Mock<ReasonListener> = mock.fn();
      const boundAllFulfilled = bindAllFulfilled({ listener });

      await assert.rejects(boundAllFulfilled(promises), (err) => {
        assert.ok(err instanceof AggregateError);
        assert.strictEqual(listener.mock.callCount(), 2);

        assert.deepStrictEqual(listener.mock.calls[0]!.arguments, [
          {
            error: error1,
            isOriginalError: true,
            original: error1,
          },
          1,
        ]);

        assert.partialDeepStrictEqual(listener.mock.calls[1]!.arguments, [
          {
            isOriginalError: false,
            original: error2,
          },
          3,
        ]);
        assert.ok(listener.mock.calls[1]!.arguments[0].error instanceof Error);
        assert.strictEqual(
          listener.mock.calls[1]!.arguments[0].error.cause,
          error2,
        );
        assert.strictEqual(
          listener.mock.calls[1]!.arguments[0].error.message,
          "",
        );
        return true;
      });
    });
  });
});
