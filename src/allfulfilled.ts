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

import { type ReasonsErrorReducer, aggregate } from "./reason.js";

/**
 * Returns a new {@link Promise} that is fulfilled with an array of fulfillment values when all the specified `promises`
 * are fulfilled, or rejected with an {@link Error} if any of `promises` are rejected.
 *
 * This function behaves similarly to {@link Promise.all} but uses {@link Promise.allSettled} internally to collect
 * all rejection reasons before rejecting with a single {@link Error}.
 *
 * @param promises An array containing each {@link Promise} to be settled.
 * @param toError An optional {@link ReasonsErrorReducer} to reduce all rejection reasons to a single {@link Error}.
 * Defaults to {@link aggregate}, which reduces all rejection reasons into an {@link AggregateError}.
 * @return A {@link Promise} that is fulfilled with an array of fulfillment values or rejected with an {@link Error}.
 */
export const allFulfilled = async <T extends readonly unknown[] | []>(
  promises: T,
  toError: ReasonsErrorReducer = aggregate(),
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> => {
  const results = await Promise.allSettled(promises);
  const { reasons, values } = results.reduce(
    (acc, result) => {
      if (result.status === "rejected") {
        acc.reasons.push(result.reason);
      } else {
        acc.values.push(result.value);
      }
      return acc;
    },
    {
      reasons: [] as any[],
      values: [] as any[],
    },
  );
  if (reasons.length > 0) {
    throw toError(reasons);
  }
  return values as { -readonly [P in keyof T]: Awaited<T[P]> };
};
