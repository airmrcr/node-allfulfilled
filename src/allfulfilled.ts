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

import {
  type Reason,
  type ReasonListener,
  type ReasonMapper,
  type ReasonReducer,
  aggregateError,
  unknownError,
} from "./reason.js";

/**
 * The options that can be used with {@link allFulfilled}.
 */
export interface AllFulfilledOptions {
  /**
   * An optional {@link ReasonListener} to be called for every rejection reason before they are reduced into a single
   * {@link Error}.
   *
   * @example Log each reason individually
   *     import { allFulfilled } from "allfulfilled";
   *
   *     const listener = (reason, _index) => console.error(reason.error);
   *
   *     await allFulfilled([
   *       Promise.resolve(1),
   *       Promise.reject(new Error("Oops")),
   *       Promise.reject(new Error("Something went wrong")),
   *     ], { listener });
   *     // "Error: Oops\n..."
   *     // "Error: Something went wrong\n..."
   *     //=> AggregateError([ Error("Oops"), Error("Something went wrong") ])
   */
  listener?: ReasonListener;
  /**
   * An optional {@link ReasonMapper} to be used to map any reason to an instance of {@link Error}, if it is not already
   * an {@link Error}.
   *
   * @example Map non-Error reasons to a custom `Error`
   *     import { allFulfilled } from "allfulfilled";
   *     import { CustomError } from "./path/to/custom-error";
   *
   *     const mapper = (reason, _index) => new CustomError("Unknown", { cause: reason });
   *
   *     await allFulfilled([
   *       Promise.resolve(1),
   *       Promise.reject("Oops"),
   *       Promise.reject(new Error("Something went wrong")),
   *     ], { mapper });
   *     //=> AggregateError([ CustomError("Unknown", { cause: "Oops" }), Error("Something went wrong") ])
   * @default {@link unknownError}
   */
  mapper?: ReasonMapper;
  /**
   * An optional {@link ReasonReducer} to reduce all rejection reasons to a single {@link Error}.
   *
   * @example Prefer a reason that is already an instance of `Error`
   *     import { allFulfilled, preferError } from "allfulfilled";
   *
   *     await allFulfilled([
   *       Promise.resolve(1),
   *       Promise.reject("Oops"),
   *       Promise.reject(new Error("Something went wrong")),
   *     ], { reducer: preferError() });
   *     //=> Error("Something went wrong")
   * @default {@link aggregateError}
   */
  reducer?: ReasonReducer;
}

/**
 * An {@link allFulfilled} function whose options have been bound to values already.
 */
export interface BoundAllFulfilled {
  /**
   * Returns a new {@link Promise} that is fulfilled with an array of fulfillment values when all the specified
   * `promises` are fulfilled, or rejected with an {@link Error} if any of `promises` are rejected.
   *
   * This function behaves similarly to {@link Promise.all} but uses {@link Promise.allSettled} internally to collect
   * all rejection reasons before rejecting with a single {@link Error}.
   *
   * @param promises An array containing each {@link Promise} to be settled.
   * @return A {@link Promise} that is fulfilled with an array of fulfillment values or rejected with an {@link Error}.
   */
  <T extends readonly unknown[] | []>(
    promises: T,
  ): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }>;
}

const getOptions = (
  possibleOptions?: AllFulfilledOptions | ReasonReducer,
): AllFulfilledOptions => {
  if (possibleOptions == null) {
    return {};
  }
  if (typeof possibleOptions === "function") {
    return { reducer: possibleOptions };
  }
  return possibleOptions;
};

/**
 * Returns a new {@link Promise} that is fulfilled with an array of fulfillment values when all the specified `promises`
 * are fulfilled, or rejected with an {@link Error} if any of `promises` are rejected.
 *
 * This function behaves similarly to {@link Promise.all} but uses {@link Promise.allSettled} internally to collect
 * all rejection reasons before rejecting with a single {@link Error}.
 *
 * Any rejection reasons that are not an {@link Error} will be mapped to an instance of {@link Error} using
 * {@link unknownError}, and all rejection reason errors will then be reduced into an {@link AggregateError} using
 * {@link aggregateError}.
 *
 * @example Await multiple promises using `Promise.all` syntax but with `Promise.allSettled` semantics
 *     import { allFulfilled } from "allfulfilled";
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.resolve("2"),
 *       Promise.resolve(3),
 *     ]);
 *     //=> [1, "2", 3]
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject(new Error("Oops")),
 *       Promise.resolve(3),
 *     ]);
 *     //=> AggregateError([ Error("Oops") ])
 * @param promises An array containing each {@link Promise} to be settled.
 * @return A {@link Promise} that is fulfilled with an array of fulfillment values or rejected with an {@link Error}.
 */
export async function allFulfilled<T extends readonly unknown[] | []>(
  promises: T,
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }>;
/**
 * Returns a new {@link Promise} that is fulfilled with an array of fulfillment values when all the specified `promises`
 * are fulfilled, or rejected with an {@link Error} if any of `promises` are rejected.
 *
 * This function behaves similarly to {@link Promise.all} but uses {@link Promise.allSettled} internally to collect
 * all rejection reasons before rejecting with a single {@link Error}.
 *
 * By default, any rejection reasons that are not an {@link Error} will be mapped to an instance of {@link Error} using
 * {@link unknownError}, and all rejection reason errors will then be reduced into an {@link AggregateError} using
 * {@link aggregateError}. However, this can be controlled by specifying the relevant `options`.
 *
 * @example Log each reason individually
 *     import { allFulfilled } from "allfulfilled";
 *
 *     const listener = (reason, _index) => console.error(reason.error);
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject(new Error("Oops")),
 *       Promise.reject(new Error("Something went wrong")),
 *     ], { listener });
 *     // "Error: Oops\n..."
 *     // "Error: Something went wrong\n..."
 *     //=> AggregateError([ Error("Oops"), Error("Something went wrong") ])
 * @example Map non-Error reasons to a custom `Error`
 *     import { allFulfilled } from "allfulfilled";
 *     import { CustomError } from "./path/to/custom-error";
 *
 *     const mapper = (reason, _index) => new CustomError("Unknown", { cause: reason });
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject("Oops"),
 *       Promise.reject(new Error("Something went wrong")),
 *     ], { mapper });
 *     //=> AggregateError([ CustomError("Unknown", { cause: "Oops" }), Error("Something went wrong") ])
 * @example Control how rejection reasons are reduced depending on their numbers
 *     import { aggregateError, allFulfilled, countError, firstError } from "allfulfilled";
 *
 *     const reducer = countError(firstError(), aggregateError());
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject(new Error("Oops")),
 *       Promise.resolve(3),
 *     ], { reducer });
 *     //=> Error("Oops")
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject(new Error("Oops")),
 *       Promise.reject(new Error("Something went wrong")),
 *     ], { reducer });
 *     //=> AggregateError([ Error("Oops"), Error("Something went wrong") ])
 * @param promises An array containing each {@link Promise} to be settled.
 * @param options The options to be used.
 * @return A {@link Promise} that is fulfilled with an array of fulfillment values or rejected with an {@link Error}.
 */
export async function allFulfilled<T extends readonly unknown[] | []>(
  promises: T,
  options: AllFulfilledOptions,
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }>;
/**
 * Returns a new {@link Promise} that is fulfilled with an array of fulfillment values when all the specified `promises`
 * are fulfilled, or rejected with an {@link Error} if any of `promises` are rejected.
 *
 * This function behaves similarly to {@link Promise.all} but uses {@link Promise.allSettled} internally to collect
 * all rejection reasons before rejecting with a single {@link Error}.
 *
 * Any rejection reasons that are not an {@link Error} will be mapped to an instance of {@link Error} using
 * {@link unknownError}.
 *
 * @example Control how rejection reasons are reduced depending on their numbers
 *     import { aggregateError, allFulfilled, countError, firstError } from "allfulfilled";
 *
 *     const reducer = countError(firstError(), aggregateError());
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject(new Error("Oops")),
 *       Promise.resolve(3),
 *     ], reducer);
 *     //=> Error("Oops")
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject(new Error("Oops")),
 *       Promise.reject(new Error("Something went wrong")),
 *     ], reducer);
 *     //=> AggregateError([ Error("Oops"), Error("Something went wrong") ])
 * @param promises An array containing each {@link Promise} to be settled.
 * @param reducer A {@link ReasonReducer} to reduce all rejection reasons to a single {@link Error}.
 * @return A {@link Promise} that is fulfilled with an array of fulfillment values or rejected with an {@link Error}.
 */
export async function allFulfilled<T extends readonly unknown[] | []>(
  promises: T,
  reducer: ReasonReducer,
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }>;
export async function allFulfilled<T extends readonly unknown[] | []>(
  promises: T,
  possibleOptions?: AllFulfilledOptions | ReasonReducer,
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
  const {
    listener,
    mapper = unknownError(),
    reducer = aggregateError(),
  } = getOptions(possibleOptions);
  const results = await Promise.allSettled(promises);
  const { reasons, values } = results.reduce(
    (acc, result, index) => {
      if (result.status === "rejected") {
        const original = result.reason;
        const isOriginalError = original instanceof Error;
        const error = !isOriginalError
          ? mapper(original, index)
          : (original as Error);
        const reason: Reason = {
          error,
          isOriginalError,
          original,
        };

        acc.reasons.push(reason);
        listener?.(reason, index);
      } else {
        acc.values.push(result.value);
      }
      return acc;
    },
    {
      reasons: [] as Reason[],
      values: [] as any[],
    },
  );
  if (reasons.length > 0) {
    throw reducer(reasons as [Reason, ...Reason[]]);
  }

  return values as { -readonly [P in keyof T]: Awaited<T[P]> };
}

/**
 * Returns an {@link allFulfilled} function bound to use the `options` provided, leaving only the `promises` argument to
 * be specified.
 *
 * This can be useful to avoid duplication when many use cases have the same options.
 *
 * By default, any rejection reasons that are not an {@link Error} will be mapped to an instance of {@link Error} using
 * {@link unknownError}, and all rejection reason errors will then be reduced into an {@link AggregateError} using
 * {@link aggregateError}. However, this can be controlled by specifying the relevant `options`.
 *
 * @example Bind `allFulfilled` with various options for a reusable experience
 *     import { aggregateError, bindAllFulfilled, countError, firstError } from "allfulfilled";
 *     import { CustomError } from "./path/to/custom-error";
 *
 *     const allFulfilled = bindAllFulfilled({
 *       listener: (reason, _index) => console.error(reason.error),
 *       mapper: (reason, _index) => new CustomError("Unknown", { cause: reason }),
 *       reducer: countError(firstError(), aggregateError()),
 *     });
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject("Oops"),
 *       Promise.resolve(3),
 *     ]);
 *     // "CustomError: Unknown\n..."
 *     //=> CustomError("Unknown", { cause: "Oops" })
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject("Oops"),
 *       Promise.reject(new Error("Something went wrong")),
 *     ]);
 *     // "CustomError: Unknown\n..."
 *     // "Error: Something went wrong\n..."
 *     //=> AggregateError([ CustomError("Unknown", { cause: "Oops" }), Error("Something went wrong") ])
 * @param options The options to be used.
 * @return A {@link BoundAllFulfilled} that only accepts a list of `promises` when called.
 */
export function bindAllFulfilled(
  options: AllFulfilledOptions,
): BoundAllFulfilled;
/**
 * Returns an {@link allFulfilled} function bound to use the `reducer` provided, leaving only the `promises` argument to
 * be specified.
 *
 * This can be useful to avoid duplication when many use cases have the same {@link ReasonReducer}.
 *
 * Any rejection reasons that are not an {@link Error} will be mapped to an instance of {@link Error} using
 * {@link unknownError}.
 *
 * @example Bind `allFulfilled` with a reducer for a reusable experience
 *     import { aggregateError, bindAllFulfilled, countError, firstError } from "allfulfilled";
 *
 *     const allFulfilled = bindAllFulfilled(countError(firstError(), aggregateError()));
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject(new Error("Oops")),
 *       Promise.resolve(3),
 *     ]);
 *     //=> Error("Oops")
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject(new Error("Oops")),
 *       Promise.reject(new Error("Something went wrong")),
 *     ]);
 *     //=> AggregateError([ Error("Oops"), Error("Something went wrong") ])
 * @param reducer A {@link ReasonReducer} to reduce all rejection reasons to a single {@link Error}.
 * @return A {@link BoundAllFulfilled} that only accepts a list of `promises` when called.
 */
export function bindAllFulfilled(reducer: ReasonReducer): BoundAllFulfilled;
export function bindAllFulfilled(
  possibleOptions?: AllFulfilledOptions | ReasonReducer,
): BoundAllFulfilled {
  const options = getOptions(possibleOptions);
  return (promises) => allFulfilled(promises, options);
}
