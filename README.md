# allfulfilled

[![Build Status](https://img.shields.io/github/actions/workflow/status/neocotic/node-allfulfilled/ci.yml?event=push&style=for-the-badge)](https://github.com/neocotic/node-allfulfilled/actions/workflows/ci.yml)
[![Downloads](https://img.shields.io/npm/dw/allfulfilled?style=for-the-badge)](https://github.com/neocotic/node-allfulfilled)
[![Release](https://img.shields.io/npm/v/allfulfilled?style=for-the-badge)](https://github.com/neocotic/node-allfulfilled)
[![License](https://img.shields.io/github/license/neocotic/node-allfulfilled?style=for-the-badge)](https://github.com/neocotic/node-allfulfilled/blob/main/LICENSE.md)

[allfulfilled](https://github.com/neocotic/node-allfulfilled) is a [Node.js](https://nodejs.org) package for using
[Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
like [Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).

## Install

Install using [npm](https://npmjs.com):

``` sh
npm install --save allfulfilled
```

## Usage

### `allFulfilled(promises[, toError])`

Returns a new `Promise` that is fulfilled with an array of fulfillment values when all the specified `promises` are
fulfilled, or rejected with an `Error` if any of `promises` are rejected.

This function behaves similarly to `Promise.all` but uses `Promise.allSettled` internally to collect all rejection
reasons before rejecting with a single `Error`.

Optionally, `toError` can be specified to reduce all rejection reasons to a single `Error`. Defaults to `aggregate`,
which reduces all rejection reasons into an `AggregateError`.

#### Examples

``` javascript
import { allFulfilled, first } from "allfulfilled";

await allFulfilled([Promise.resolve(1), Promise.resolve("2"), Promise.resolve(3)]);
//=> [1, "2", 3]
await allFulfilled([Promise.resolve(1), Promise.reject(new Error("Oops")), Promise.resolve(3)]);
//=> AggregateError
await allFulfilled([Promise.resolve(1), Promise.reject(new Error("Oops")), Promise.resolve(3)], first());
//=> Error
```

### `ReasonsErrorReducer(reasons)`

Reduces all reasons that any `Promise` was rejected with to a single `Error`.

A `ReasonsErrorReducer` is only called with a non-empty array of reasons.

There are a several `ReasonsErrorReducer` function providers built-in.

#### `aggregate([message])`

Returns a `ReasonsErrorReducer` that reduces all the reasons a `Promise` was rejected with into an `AggregateError`.

Optionally, `message` can be specified for the `AggregateError`.

#### `any([toError])`

Returns a `ReasonsErrorReducer` that returns any reason a `Promise` was rejected with as an `Error`, with a preference
of using the first reason that is an `Error` to avoid calling `toError`, if specified.

If `toError` is specified and the every reason is **not** an `Error`, `toError` will be used to map the first reason to
an `Error`.

#### `first([toError])`

Returns a `ReasonsErrorReducer` that returns the first reason a `Promise` was rejected with as an `Error`.

If `toError` is specified and the first reason is **not** an `Error`, `toError` will be used to map the first reason to
an `Error`.

#### `last([toError])`

Returns a `ReasonsErrorReducer` that returns the last reason a `Promise` was rejected with as an `Error`.

If `toError` is specified and the last reason is **not** an `Error`, `toError` will be used to map the last reason to an
`Error`.

## Bugs

If you have any problems with this package or would like to see changes currently in development, you can do so
[here](https://github.com/neocotic/node-allfulfilled/issues).

## Contributors

If you want to contribute, you're a legend! Information on how you can do so can be found in
[CONTRIBUTING.md](https://github.com/neocotic/node-allfulfilled/blob/main/CONTRIBUTING.md). We want your suggestions and
pull requests!

A list of all contributors can be found in
[AUTHORS.md](https://github.com/neocotic/node-allfulfilled/blob/main/AUTHORS.md).

## License

Copyright © 2026 neocotic

See [LICENSE.md](https://github.com/neocotic/node-allfulfilled/raw/main/LICENSE.md) for more information on our MIT
license.
