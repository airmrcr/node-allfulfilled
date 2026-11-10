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

import { deprecate } from "node:util";

/**
 * Represents a reason that a {@link Promise} was rejected with.
 */
export interface Reason {
  /**
   * A reference to {@link #original} if it's already an instance of {@link Error}; otherwise the {@link Error} returned
   * by the {@link ReasonMapper}.
   */
  readonly error: Error;
  /**
   * Whether {@link #original} is an instance of {@link Error}.
   */
  readonly isOriginalError: boolean;
  /**
   * The original rejection reason as returned by {@link Promise.allSettled}.
   *
   * This may or may not be an instance of {@link Error}.
   */
  readonly original: any;
}

/**
 * Maps a reason that a {@link Promise} was rejected with to an instance of {@link Error}.
 *
 * A `ReasonErrorMapper` is only called with a reason that is **not** an {@link Error}.
 *
 * @see {@link ReasonMapper}
 * @deprecated Since 0.3.0. Use {@link ReasonMapper} instead.
 */
export interface ReasonErrorMapper {
  /**
   * Returns an {@link Error} mapped from the specified `reason` that a {@link Promise} was rejected with.
   *
   * The `reason` provided is never an {@link Error}.
   *
   * @param reason The reason to be mapped to an instance of {@link Error}.
   * @return The mapped {@link Error} instance.
   * @see {@link ReasonMapper}
   * @deprecated Since 0.3.0. Use {@link ReasonMapper} instead.
   */
  (reason: any): Error;
}

/**
 * A listener that is invoked with each reason that any {@link Promise} is rejected with before they are reduced.
 *
 * A `ReasonListener` is only called with a {@link Reason} and its index in the array of settled results.
 */
export interface ReasonListener {
  /**
   * Receives the reason a {@link Promise} was rejected.
   *
   * @param reason A {@link Reason} responsible for a {@link Promise} being rejected.
   * @param index The index of the reason in the array of settled results.
   */
  (reason: Reason, index: number): void;
}

/**
 * Maps a reason that a {@link Promise} was rejected with to an instance of {@link Error}.
 *
 * A `ReasonMapper` is only called with a reason that is **not** an {@link Error}, as well as its index in the array of
 * settled results.
 */
export interface ReasonMapper {
  /**
   * Returns an {@link Error} mapped from the specified `reason` that a {@link Promise} was rejected with.
   *
   * The `reason` provided is never an {@link Error}.
   *
   * @param reason The reason to be mapped to an instance of {@link Error}.
   * @param index The index of the reason in the array of settled results.
   * @return The mapped {@link Error} instance.
   */
  (reason: any, index: number): Error;
}

/**
 * Reduces all reasons that any {@link Promise} was rejected with to a single {@link Error}.
 *
 * A `ReasonReducer` is only called with a non-empty array of reasons.
 */
export interface ReasonReducer {
  /**
   * Returns a single {@link Error} reduced from the specified `reasons` that any {@link Promise} was rejected with.
   *
   * The `reasons` array provided is never empty.
   *
   * @param reasons The reasons to be reduced to a single {@link Error}.
   * @return The reduced {@link Error}.
   */
  (reasons: [Reason, ...Reason[]]): Error;
}

/**
 * Reduces all reasons that any {@link Promise} was rejected with to a single {@link Error}.
 *
 * A `ReasonsErrorReducer` is only called with a non-empty array of reasons.
 *
 * @see {@link ReasonReducer}
 * @deprecated Since 0.3.0. Use {@link ReasonReducer} instead.
 */
export type ReasonsErrorReducer = ReasonReducer;

/**
 * Returns a {@link ReasonReducer} that reduces all the reasons a {@link Promise} was rejected with into an
 * {@link AggregateError}.
 *
 * @param message An optional message to be used to create the {@link AggregateError}.
 * @return A {@link ReasonReducer} that reduces the reasons into an {@link AggregateError}.
 * @see {@link aggregateError}
 * @deprecated Since 0.3.0. Use {@link aggregateError} instead.
 */
export const aggregate = deprecate(
  (message?: string) => aggregateError(message),
  "aggregate() is deprecated. Use aggregateError() instead.",
);

/**
 * Returns a {@link ReasonReducer} that reduces all the reasons a {@link Promise} was rejected with into an
 * {@link AggregateError}.
 *
 * @example Reduce reasons into an `AggregateError`
 *     import { aggregateError, allFulfilled } from "allfulfilled";
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject(new Error("Oops")),
 *       Promise.reject(new Error("Something went wrong")),
 *     ], aggregateError());
 *     //=> AggregateError([ Error("Oops"), Error("Something went wrong") ])
 * @param message An optional message to be used to create the {@link AggregateError}.
 * @return A {@link ReasonReducer} that reduces the reasons into an {@link AggregateError}.
 */
export const aggregateError =
  (message?: string): ReasonReducer =>
  (reasons) => {
    const errors = reasons.map(({ error }) => error);
    return new AggregateError(errors, message);
  };

/**
 * Returns a {@link ReasonReducer} that returns any reason a {@link Promise} was rejected with as an {@link Error}, with
 * a preference of using the first reason that was originally an instance of {@link Error}, where possible.
 *
 * If `mapper` is specified and every reason was **not** originally an instance of {@link Error}, `mapper` will be used
 * to map the first reason to an {@link Error}. Otherwise, the {@link Error} mapped from the {@link ReasonErrorMapper}
 * used by {@link allFulfilled} will be returned.
 *
 * @param mapper An optional {@link ReasonErrorMapper} to be used to map any reason to an instance of {@link Error}, if
 * it is not already an {@link Error}.
 * @return A {@link ReasonReducer} that returns any reason as an {@link Error}.
 * @see {@link preferError}
 * @deprecated Since 0.3.0. Use {@link preferError} instead.
 */
export const any = deprecate(
  (mapper?: ReasonErrorMapper): ReasonReducer =>
    (reasons) => {
      for (const reason of reasons) {
        if (reason.isOriginalError) {
          return reason.error;
        }
      }

      return mapper ? mapper(reasons[0].original) : reasons[0].error;
    },
  "any() is deprecated. Use preferError() instead.",
);

/**
 * Returns a {@link ReasonMapper} that returns the reason a {@link Promise} was rejected cast as an {@link Error}.
 *
 * **Warning:** This mapper intentionally breaks the type contract and so should be used with caution.
 *
 * @example Cast non-Error reasons to an Error
 *     import { allFulfilled, castError } from "allfulfilled";
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject("Oops"),
 *       Promise.reject(new Error("Something went wrong")),
 *     ], { mapper: castError() });
 *     //=> AggregateError([ "Oops", Error("Something went wrong") ])
 * @return A {@link ReasonMapper} that returns the reason cast as an {@link Error}.
 */
export const castError = (): ReasonMapper => (reason) => reason as Error;

/**
 * Returns a {@link ReasonReducer} that uses the appropriate error reducer based on the number of reasons a
 * {@link Promise} was rejected with.
 *
 * @example Take first reason when there's only one
 *     import { aggregateError, allFulfilled, countError, firstError } from "allfulfilled";
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject(new Error("Oops")),
 *       Promise.resolve(3),
 *     ], countError(firstError(), aggregateError()));
 *     //=> Error("Oops")
 * @example Reduce reasons into an `AggregateError` when there's more than one
 *     import { aggregateError, allFulfilled, countError, firstError } from "allfulfilled";
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject(new Error("Oops")),
 *       Promise.reject(new Error("Something went wrong")),
 *     ], countError(firstError(), aggregateError()));
 *     //=> AggregateError([ Error("Oops"), Error("Something went wrong") ])
 * @param reduceOneError The {@link ReasonReducer} to be used if a {@link Promise} was rejected with only a single
 * reason.
 * @param reduceManyErrors The {@link ReasonReducer} to be used if a {@link Promise} was rejected with multiple reasons.
 * @return A {@link ReasonReducer} that uses either {@link ReasonReducer} based on the number of reasons.
 */
export const countError =
  (
    reduceOneError: ReasonReducer,
    reduceManyErrors: ReasonReducer,
  ): ReasonReducer =>
  (reasons) =>
    reasons.length === 1 ? reduceOneError(reasons) : reduceManyErrors(reasons);

/**
 * Returns a {@link ReasonReducer} that returns the first reason a {@link Promise} was rejected with as an
 * {@link Error}.
 *
 * If `mapper` is specified and the first reason was **not** originally an instance of {@link Error}, `mapper` will be
 * used to map the first reason to an {@link Error}. Otherwise, the {@link Error} mapped from the
 * {@link ReasonErrorMapper} used by {@link allFulfilled} will be returned.
 *
 * @param mapper An optional {@link ReasonErrorMapper} to be used to map the first reason to an instance of
 * {@link Error}, if it is not already an {@link Error}.
 * @return A {@link ReasonReducer} that returns the first reason as an {@link Error}.
 * @see {@link firstError}
 * @deprecated Since 0.3.0. Use {@link firstError} instead.
 */
export const first = deprecate(
  (mapper?: ReasonErrorMapper): ReasonReducer =>
    (reasons) => {
      const reason = reasons[0];
      return mapper && !reason.isOriginalError
        ? mapper(reason.original)
        : reason.error;
    },
  "first() is deprecated. Use firstError() instead.",
);

/**
 * Returns a {@link ReasonReducer} that returns the first reason a {@link Promise} was rejected with as an
 * {@link Error}.
 *
 * @example Take first reason as-is if already an instance of `Error`
 *     import { allFulfilled, firstError } from "allfulfilled";
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject(new Error("Oops")),
 *       Promise.reject(new Error("Something went wrong")),
 *     ], firstError());
 *     //=> Error("Oops")
 * @example Take first reason mapped to an `Error`
 *     import { allFulfilled, firstError } from "allfulfilled";
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject("Oops"),
 *       Promise.reject(new Error("Something went wrong")),
 *     ], firstError());
 *     //=> Error("", { cause: "Oops" })
 * @return A {@link ReasonReducer} that returns the first reason as an {@link Error}.
 */
export const firstError = (): ReasonReducer => (reasons) => reasons[0].error;

/**
 * Returns a {@link ReasonReducer} that returns the last reason a {@link Promise} was rejected with as an {@link Error}.
 *
 * If `mapper` is specified and the last reason was **not** originally an instance of {@link Error}, `mapper` will be
 * used to map the last reason to an {@link Error}. Otherwise, the {@link Error} mapped from the
 * {@link ReasonErrorMapper} used by {@link allFulfilled} will be returned.
 *
 * @param mapper An optional {@link ReasonErrorMapper} to be used to map the last reason to an instance of
 * {@link Error}, if it is not already an {@link Error}.
 * @return A {@link ReasonReducer} that returns the last reason as an {@link Error}.
 * @see {@link lastError}
 * @deprecated Since 0.3.0. Use {@link lastError} instead.
 */
export const last = deprecate(
  (mapper?: ReasonErrorMapper): ReasonReducer =>
    (reasons) => {
      const reason = reasons[reasons.length - 1]!;
      return mapper && !reason.isOriginalError
        ? mapper(reason.original)
        : reason.error;
    },
  "last() is deprecated. Use lastError() instead.",
);

/**
 * Returns a {@link ReasonReducer} that returns the last reason a {@link Promise} was rejected with as an {@link Error}.
 *
 * @example Take last reason as-is if already an instance of `Error`
 *     import { allFulfilled, lastError } from "allfulfilled";
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject(new Error("Oops")),
 *       Promise.reject(new Error("Something went wrong")),
 *     ], lastError());
 *     //=> Error("Something went wrong")
 * @example Take last reason mapped to an `Error`
 *     import { allFulfilled, lastError } from "allfulfilled";
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject(new Error("Oops")),
 *       Promise.reject("Something went wrong"),
 *     ], lastError());
 *     //=> Error("", { cause: "Something went wrong" })
 * @return A {@link ReasonReducer} that returns the last reason as an {@link Error}.
 */
export const lastError = (): ReasonReducer => (reasons) =>
  reasons[reasons.length - 1]!.error;

/**
 * Returns a {@link ReasonReducer} that returns any reason a {@link Promise} was rejected with as an {@link Error}, with
 * a preference of using the first reason that was originally an instance of {@link Error}, where possible.
 *
 * @example Prefer a reason that is already an instance of `Error`
 *     import { allFulfilled, preferError } from "allfulfilled";
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject("Oops"),
 *       Promise.reject(new Error("Something went wrong")),
 *     ], preferError());
 *     //=> Error("Something went wrong")
 * @example Fallback to the first reason mapped to an `Error`
 *     import { allFulfilled, preferError } from "allfulfilled";
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject("Oops"),
 *       Promise.reject("Something went wrong"),
 *     ], preferError());
 *     //=> Error("", { cause: "Oops" })
 * @return A {@link ReasonReducer} that returns any reason as an {@link Error}.
 */
export const preferError = (): ReasonReducer => (reasons) => {
  for (const reason of reasons) {
    if (reason.isOriginalError) {
      return reason.error;
    }
  }

  return reasons[0].error;
};

/**
 * Returns a {@link ReasonMapper} that returns an {@link Error} instance with the reason a {@link Promise} was rejected
 * captured as its `cause`.
 *
 * @example Wrap non-Error reasons in a new Error instance and capture as the cause
 *     import { allFulfilled, unknownError } from "allfulfilled";
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject("Oops"),
 *       Promise.reject(new Error("Something went wrong")),
 *     ], { mapper: unknownError() });
 *     //=> AggregateError([ Error("", { cause: "Oops" }), Error("Something went wrong") ])
 * @example Specify a custom message for created Error instances
 *     import { allFulfilled, unknownError } from "allfulfilled";
 *
 *     await allFulfilled([
 *       Promise.resolve(1),
 *       Promise.reject("Oops"),
 *       Promise.reject(new Error("Something went wrong")),
 *     ], { mapper: unknownError("Unknown error") });
 *     //=> AggregateError([ Error("Unknown error", { cause: "Oops" }), Error("Something went wrong") ])
 * @param message An optional message to be used to create the {@link Error}.
 * @return A {@link ReasonMapper} that returns an {@link Error} with the reason captured as its `cause`.
 */
export const unknownError =
  (message?: string): ReasonMapper =>
  (reason) =>
    new Error(message, { cause: reason });
