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

/**
 * Maps a reason that a {@link Promise} was rejected with to an {@link Error}.
 *
 * A `ReasonErrorMapper` is only called with a reason that is **not** an {@link Error}.
 */
export interface ReasonErrorMapper {
  /**
   * Returns an {@link Error} mapped from the specified `reason` that a {@link Promise} was rejected with.
   *
   * The `reason` provided is never an {@link Error}.
   *
   * @param reason The reason to be mapped to an {@link Error}.
   * @return The mapped {@link Error}.
   */
  (reason: any): Error;
}

/**
 * Reduces all reasons that any {@link Promise} was rejected with to a single {@link Error}.
 *
 * A `ReasonsErrorReducer` is only called with a non-empty array of reasons.
 */
export interface ReasonsErrorReducer {
  /**
   * Returns a single {@link Error} reduced from the specified `reasons` that any {@link Promise} was rejected with.
   *
   * The `reasons` provided is never empty.
   *
   * @param reasons The reasons to be reduced to a single {@link Error}.
   * @return The reduced {@link Error}.
   */
  (reasons: any[]): Error;
}

const atIndex =
  (index: number) =>
  (toError?: ReasonErrorMapper): ReasonsErrorReducer =>
  (reasons) => {
    const reason = reasons[index >= 0 ? index : reasons.length + index];
    if (!toError) {
      return reason as Error;
    }
    return reason instanceof Error ? reason : toError(reason);
  };

/**
 * Returns a {@link ReasonsErrorReducer} that reduces all the reasons a {@link Promise} was rejected with into an
 * {@link AggregateError}.
 *
 * @param message An optional message to be used for the {@link AggregateError}.
 * @return A {@link ReasonsErrorReducer} that reduces the reasons into an {@link AggregateError}.
 */
export const aggregate =
  (message?: string): ReasonsErrorReducer =>
  (reasons) =>
    new AggregateError(reasons, message);

/**
 * Returns a {@link ReasonsErrorReducer} that returns any reason a {@link Promise} was rejected with as an
 * {@link Error}, with a preference of using the first reason that is an {@link Error} to avoid calling `toError`, if
 * specified.
 *
 * If `toError` is specified and the every reason is **not** an {@link Error}, `toError` will be used to map the first
 * reason to an {@link Error}.
 *
 * @param toError An optional {@link ReasonErrorMapper} to be used to map any reason to an {@link Error}, if it is not
 * already an {@link Error}.
 * @return A {@link ReasonsErrorReducer} that returns any reason as an {@link Error}.
 */
export const any =
  (toError?: ReasonErrorMapper): ReasonsErrorReducer =>
  (reasons) => {
    for (const reason of reasons) {
      if (reason instanceof Error) {
        return reason;
      }
    }

    return toError ? toError(reasons[0]) : (reasons[0] as Error);
  };

/**
 * Returns a {@link ReasonsErrorReducer} that returns the first reason a {@link Promise} was rejected with as an
 * {@link Error}.
 *
 * If `toError` is specified and the first reason is **not** an {@link Error}, `toError` will be used to map the first
 * reason to an {@link Error}.
 *
 * @param toError An optional {@link ReasonErrorMapper} to be used to map the first reason to an {@link Error}, if it is
 * not already an {@link Error}.
 * @return A {@link ReasonsErrorReducer} that returns the first reason as an {@link Error}.
 */
export const first = atIndex(0);

/**
 * Returns a {@link ReasonsErrorReducer} that returns the last reason a {@link Promise} was rejected with as an
 * {@link Error}.
 *
 * If `toError` is specified and the last reason is **not** an {@link Error}, `toError` will be used to map the last
 * reason to an {@link Error}.
 *
 * @param toError An optional {@link ReasonErrorMapper} to be used to map the last reason to an {@link Error}, if it is
 * not already an {@link Error}.
 * @return A {@link ReasonsErrorReducer} that returns the last reason as an {@link Error}.
 */
export const last = atIndex(-1);
