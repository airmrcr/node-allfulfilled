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
import { aggregate, first, last } from "../src/reason.js";

describe("aggregate", () => {
  it("should return an AggregateError with the given reasons", () => {
    const reasons = [new Error("foo"), new Error("bar")];
    const mapper = aggregate();
    const result = mapper(reasons);

    assert.ok(result instanceof AggregateError);
    assert.deepStrictEqual(result.errors, reasons);
    assert.strictEqual(result.message, "");
  });

  it("should return an AggregateError with the given reasons and message", () => {
    const reasons = [new Error("foo"), new Error("bar")];
    const message = "Something went wrong";
    const mapper = aggregate(message);
    const result = mapper(reasons);

    assert.ok(result instanceof AggregateError);
    assert.deepStrictEqual(result.errors, reasons);
    assert.strictEqual(result.message, message);
  });
});

describe("first", () => {
  it("should return the first reason if it is an Error", () => {
    const reasons = [new Error("foo"), new Error("bar")];
    const mapper = first();
    const result = mapper(reasons);

    assert.strictEqual(result, reasons[0]);
  });

  it("should return the first reason if it is not an Error and no mapper is provided", () => {
    const reasons = ["foo", "bar"];
    const mapper = first();
    const result = mapper(reasons);

    assert.strictEqual(result, reasons[0]);
  });

  it("should map the first reason if it is not an Error and a mapper is provided", () => {
    const reasons = ["foo", "bar"];
    const toError = (reason: any) =>
      new Error("Something went wrong", { cause: reason });
    const mapper = first(toError);
    const result = mapper(reasons);

    assert.ok(result instanceof Error);
    assert.strictEqual(result.cause, reasons[0]);
    assert.strictEqual(result.message, "Something went wrong");
  });

  it("should not map the first reason if it is an Error even if a mapper is provided", () => {
    const reasons = [new Error("foo"), "bar"];
    const toError = (reason: any) =>
      new Error("Something went wrong", { cause: reason });
    const mapper = first(toError);
    const result = mapper(reasons);

    assert.strictEqual(result, reasons[0]);
  });
});

describe("last", () => {
  it("should return the last reason if it is an Error", () => {
    const reasons = [new Error("foo"), new Error("bar")];
    const mapper = last();
    const result = mapper(reasons);

    assert.strictEqual(result, reasons[1]);
  });

  it("should return the last reason if it is not an Error and no mapper is provided", () => {
    const reasons = ["foo", "bar"];
    const mapper = last();
    const result = mapper(reasons);

    assert.strictEqual(result, reasons[1]);
  });

  it("should map the last reason if it is not an Error and a mapper is provided", () => {
    const reasons = ["foo", "bar"];
    const toError = (reason: any) =>
      new Error("Something went wrong", { cause: reason });
    const mapper = last(toError);
    const result = mapper(reasons);

    assert.ok(result instanceof Error);
    assert.strictEqual(result.cause, reasons[1]);
    assert.strictEqual(result.message, "Something went wrong");
  });

  it("should not map the last reason if it is an Error even if a mapper is provided", () => {
    const reasons = ["foo", new Error("bar")];
    const toError = (reason: any) =>
      new Error("Something went wrong", { cause: reason });
    const mapper = last(toError);
    const result = mapper(reasons);

    assert.strictEqual(result, reasons[1]);
  });
});
