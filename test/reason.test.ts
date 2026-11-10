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
import { describe, it, mock } from "node:test";
import {
  type Reason,
  type ReasonMapper,
  aggregate,
  aggregateError,
  any,
  castError,
  countError,
  first,
  firstError,
  last,
  lastError,
  preferError,
  unknownError,
} from "../src/reason.js";

const assertAggregateError = (actual: unknown, expect: AggregateError) => {
  assert.ok(actual instanceof AggregateError);
  assert.deepStrictEqual(actual.errors, expect.errors);
  assert.strictEqual(actual.message, expect.message);
};

const toAggregateError = (
  reasons: [Reason, ...Reason[]],
  message?: string,
): AggregateError => new AggregateError(toErrors(reasons), message);

const toErrors = (reasons: [Reason, ...Reason[]]) =>
  reasons.map(({ error }) => error) as [Error, ...Error[]];

const testMapper: ReasonMapper = (reason) =>
  new Error("Something went wrong", { cause: reason });

const toReason = (
  original: any,
  index: number,
  mapper: ReasonMapper = testMapper,
): Reason => {
  const isOriginalError = original instanceof Error;
  return {
    error: isOriginalError ? original : mapper(original, index),
    isOriginalError,
    original,
  };
};

const toReasons = (originals: [any, ...any[]], mapper?: ReasonMapper) =>
  originals.map((original, index) => toReason(original, index, mapper)) as [
    Reason,
    ...Reason[],
  ];

describe("aggregate", () => {
  it("should return an AggregateError with the given reasons mapped to an Error when not originally an Error", () => {
    const reasons = toReasons([new Error("foo"), "bar"]);
    const reducer = aggregate();
    const result = reducer(reasons);

    assertAggregateError(result, toAggregateError(reasons));
  });

  it("should return an AggregateError with the given message and reasons mapped to an Error when not originally an Error", () => {
    const reasons = toReasons([new Error("foo"), "bar"]);
    const message = "Something really went wrong";
    const reducer = aggregate(message);
    const result = reducer(reasons);

    assertAggregateError(result, toAggregateError(reasons, message));
  });
});

describe("aggregateError", () => {
  it("should return an AggregateError with the given reasons mapped to an Error when not originally an Error", () => {
    const reasons = toReasons([new Error("foo"), "bar"]);
    const reducer = aggregateError();
    const result = reducer(reasons);

    assertAggregateError(result, toAggregateError(reasons));
  });

  it("should return an AggregateError with the given message and reasons mapped to an Error when not originally an Error", () => {
    const reasons = toReasons([new Error("foo"), "bar"]);
    const message = "Something really went wrong";
    const reducer = aggregateError(message);
    const result = reducer(reasons);

    assertAggregateError(result, toAggregateError(reasons, message));
  });
});

describe("any", () => {
  it("should return any reason as-is that was originally an Error", () => {
    const reasons = toReasons(["foo", new Error("bar")]);
    const reducer = any();
    const result = reducer(reasons);

    assert.strictEqual(result, reasons[1]!.original);
    assert.strictEqual(result, reasons[1]!.error);
  });

  it("should return the first reason mapped to an Error when none were originally an Error", () => {
    const reasons = toReasons(["foo", "bar"]);
    const reducer = any();
    const result = reducer(reasons);

    assert.strictEqual(result, reasons[0].error);
    assert.notStrictEqual(result, reasons[0].original);
  });

  describe("when an override mapper is provided", () => {
    it("should return any reason as-is that was originally an Error", () => {
      const reasons = toReasons(["foo", new Error("bar")]);
      const mapper = mock.fn(
        (reason: any) => new Error("Oops", { cause: reason }),
      );
      const reducer = any(mapper);
      const result = reducer(reasons);

      assert.strictEqual(mapper.mock.callCount(), 0);
      assert.strictEqual(result, reasons[1]!.original);
      assert.strictEqual(result, reasons[1]!.error);
    });

    it("should map the first reason mapped to an Error using the override mapper when none were originally an Error", () => {
      const reasons = toReasons(["foo", "bar"]);
      const mapper = mock.fn(
        (reason: any) => new Error("Oops", { cause: reason }),
      );
      const reducer = any(mapper);
      const result = reducer(reasons);

      assert.strictEqual(mapper.mock.callCount(), 1);
      assert.deepStrictEqual(mapper.mock.calls[0]!.arguments, [
        reasons[0].original,
      ]);
      assert.strictEqual(result, mapper.mock.calls[0]!.result);
    });
  });
});

describe("castError", () => {
  it("should return the given reason cast as an Error", () => {
    const mapper = castError();

    for (const [index, reason] of ["foo", new Error("bar")].entries()) {
      const result = mapper(reason, index);

      assert.strictEqual(result, reason);
    }
  });
});

describe("countError", () => {
  it("should use the first reducer if only a single reason given", () => {
    const reasons = toReasons(["foo"]);
    const reducer = countError(firstError(), aggregateError());
    const result = reducer(reasons);

    assert.strictEqual(result, reasons[0].error);
    assert.notStrictEqual(result, reasons[0].original);
  });

  it("should use the second reducer if multiple reasons given", () => {
    const reasons = toReasons([new Error("foo"), "bar"]);
    const reducer = countError(firstError(), aggregateError());
    const result = reducer(reasons);

    assertAggregateError(result, toAggregateError(reasons));
  });
});

describe("first", () => {
  it("should return the first reason as-is when originally an Error", () => {
    const reasons = toReasons([new Error("foo"), new Error("bar")]);
    const reducer = first();
    const result = reducer(reasons);

    assert.strictEqual(result, reasons[0].original);
    assert.strictEqual(result, reasons[0].error);
  });

  it("should return the first reason mapped to an Error when not originally an Error", () => {
    const reasons = toReasons(["foo", "bar"]);
    const reducer = first();
    const result = reducer(reasons);

    assert.strictEqual(result, reasons[0].error);
    assert.notStrictEqual(result, reasons[0].original);
  });

  describe("when an override mapper is provided", () => {
    it("should return the first reason as-is when originally an Error", () => {
      const reasons = toReasons([new Error("foo"), "bar"]);
      const mapper = mock.fn(
        (reason: any) => new Error("Oops", { cause: reason }),
      );
      const reducer = first(mapper);
      const result = reducer(reasons);

      assert.strictEqual(mapper.mock.callCount(), 0);
      assert.strictEqual(result, reasons[0].error);
      assert.strictEqual(result, reasons[0].original);
    });

    it("should return the first reason mapped to an Error using the override mapper when not originally an Error", () => {
      const reasons = toReasons(["foo", "bar"]);
      const mapper = mock.fn(
        (reason: any) => new Error("Oops", { cause: reason }),
      );
      const reducer = first(mapper);
      const result = reducer(reasons);

      assert.strictEqual(mapper.mock.callCount(), 1);
      assert.deepStrictEqual(mapper.mock.calls[0]!.arguments, [
        reasons[0].original,
      ]);
      assert.strictEqual(result, mapper.mock.calls[0]!.result);
    });
  });
});

describe("firstError", () => {
  it("should return the first reason as-is when originally an Error", () => {
    const reasons = toReasons([new Error("foo"), new Error("bar")]);
    const reducer = firstError();
    const result = reducer(reasons);

    assert.strictEqual(result, reasons[0].original);
    assert.strictEqual(result, reasons[0].error);
  });

  it("should return the first reason mapped to an Error when not originally an Error", () => {
    const reasons = toReasons(["foo", "bar"]);
    const reducer = firstError();
    const result = reducer(reasons);

    assert.strictEqual(result, reasons[0].error);
    assert.notStrictEqual(result, reasons[0].original);
  });
});

describe("last", () => {
  it("should return the last reason as-is when originally an Error", () => {
    const reasons = toReasons([new Error("foo"), new Error("bar")]);
    const reducer = last();
    const result = reducer(reasons);

    assert.strictEqual(result, reasons[1]!.original);
    assert.strictEqual(result, reasons[1]!.error);
  });

  it("should return the last reason mapped to an Error when not originally an Error", () => {
    const reasons = toReasons(["foo", "bar"]);
    const reducer = last();
    const result = reducer(reasons);

    assert.strictEqual(result, reasons[1]!.error);
    assert.notStrictEqual(result, reasons[1]!.original);
  });

  describe("when an override mapper is provided", () => {
    it("should return the last reason as-is when originally an Error", () => {
      const reasons = toReasons(["foo", new Error("bar")]);
      const mapper = mock.fn(
        (reason: any) => new Error("Oops", { cause: reason }),
      );
      const reducer = last(mapper);
      const result = reducer(reasons);

      assert.strictEqual(mapper.mock.callCount(), 0);
      assert.strictEqual(result, reasons[1]!.error);
      assert.strictEqual(result, reasons[1]!.original);
    });

    it("should return the last reason mapped to an Error using the override mapper when not originally an Error", () => {
      const reasons = toReasons(["foo", "bar"]);
      const mapper = mock.fn(
        (reason: any) => new Error("Oops", { cause: reason }),
      );
      const reducer = last(mapper);
      const result = reducer(reasons);

      assert.strictEqual(mapper.mock.callCount(), 1);
      assert.deepStrictEqual(mapper.mock.calls[0]!.arguments, [
        reasons[1]!.original,
      ]);
      assert.strictEqual(result, mapper.mock.calls[0]!.result);
    });
  });
});

describe("lastError", () => {
  it("should return the last reason as-is when originally an Error", () => {
    const reasons = toReasons([new Error("foo"), new Error("bar")]);
    const reducer = lastError();
    const result = reducer(reasons);

    assert.strictEqual(result, reasons[1]!.original);
    assert.strictEqual(result, reasons[1]!.error);
  });

  it("should return the last reason mapped to an Error when not originally an Error", () => {
    const reasons = toReasons(["foo", "bar"]);
    const reducer = lastError();
    const result = reducer(reasons);

    assert.strictEqual(result, reasons[1]!.error);
    assert.notStrictEqual(result, reasons[1]!.original);
  });
});

describe("preferError", () => {
  it("should return any reason as-is that was originally an Error", () => {
    const reasons = toReasons(["foo", new Error("bar")]);
    const reducer = preferError();
    const result = reducer(reasons);

    assert.strictEqual(result, reasons[1]!.original);
    assert.strictEqual(result, reasons[1]!.error);
  });

  it("should return the first reason mapped to an Error when none were originally an Error", () => {
    const reasons = toReasons(["foo", "bar"]);
    const reducer = preferError();
    const result = reducer(reasons);

    assert.strictEqual(result, reasons[0].error);
    assert.notStrictEqual(result, reasons[0].original);
  });
});

describe("unknownError", () => {
  it("should return an Error with the given reason set as the cause", () => {
    const reason = "foo";
    const mapper = unknownError();
    const result = mapper(reason, 0);

    assert.ok(result instanceof Error);
    assert.strictEqual(result.cause, reason);
    assert.strictEqual(result.message, "");
  });

  it("should return an Error with the given message and reason set as the cause", () => {
    const reason = "foo";
    const message = "Oops";
    const mapper = unknownError(message);
    const result = mapper(reason, 0);

    assert.ok(result instanceof Error);
    assert.strictEqual(result.cause, reason);
    assert.strictEqual(result.message, message);
  });
});
