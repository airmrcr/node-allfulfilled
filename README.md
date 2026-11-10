# allfulfilled

[![Build Status](https://img.shields.io/github/actions/workflow/status/airmrcr/node-allfulfilled/ci.yml?event=push&style=for-the-badge)](https://github.com/airmrcr/node-allfulfilled/actions/workflows/ci.yml)
[![Downloads](https://img.shields.io/npm/dw/allfulfilled?style=for-the-badge)](https://github.com/airmrcr/node-allfulfilled)
[![Release](https://img.shields.io/npm/v/allfulfilled?style=for-the-badge)](https://github.com/airmrcr/node-allfulfilled)
[![License](https://img.shields.io/github/license/airmrcr/node-allfulfilled?style=for-the-badge)](https://github.com/airmrcr/node-allfulfilled/blob/main/LICENSE.md)

[allfulfilled](https://github.com/airmrcr/node-allfulfilled) is a [Node.js](https://nodejs.org) package for using
[Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
like [Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).

## Install

Install using [npm](https://npmjs.com):

``` sh
npm install --save allfulfilled
```

## Usage

### `allFulfilled(promises[, options|reducer])`

Returns a new `Promise` that is fulfilled with an array of fulfillment values when all the specified `promises` are
fulfilled, or rejected with an `Error` if any of `promises` are rejected.

This function behaves similarly to `Promise.all` but uses `Promise.allSettled` internally to collect all rejection
reasons before rejecting with a single `Error`.

By default, any rejection reasons that are not an `Error` will be mapped to an instance of `Error` using
[unknownError](#unknownerrormessage), and all rejection reason errors will then be reduced into an `AggregateError`
using [aggregateError](#aggregateerrormessage). The latter can be controlled by passing a `reducer` as the second
argument, or more granular control is possible by passing `options` as the second argument instead.  

#### Examples

``` javascript
import { allFulfilled, firstError, preferError } from "allfulfilled";

await allFulfilled([
  Promise.resolve(1),
  Promise.resolve("2"),
  Promise.resolve(3),
]);
//=> [1, "2", 3]
await allFulfilled([
  Promise.resolve(1),
  Promise.reject(new Error("Oops")),
  Promise.resolve(3),
]);
//=> AggregateError([ Error("Oops") ])
await allFulfilled([
  Promise.resolve(1),
  Promise.reject(new Error("Oops")),
  Promise.resolve(3),
], preferError());
//=> Error("Oops")
await allFulfilled([
  Promise.resolve(1),
  Promise.reject("Oops"),
  Promise.resolve(3),
], {
  mapper: (reason) => new Error(`${reason}`),
  reducer: firstError(),
});
//=> Error("Oops")
```

### `bindAllFulfilled(options|reducer)`

Returns a `allFulfilled` function bound to use either the `options` or `reducer` provided, leaving only the `promises`
argument to be specified.

This can be useful to avoid duplication when many use cases have the same options.

#### Examples

``` javascript
import { aggregateError, bindAllFulfilled, countError, firstError } from "allfulfilled";
import { CustomError } from "./path/to/custom-error";

const allFulfilled = bindAllFulfilled({
  listener: (reason, _index) => console.error(reason.error),
  mapper: (reason, _index) => new CustomError("Unknown", { cause: reason }),
  reducer: countError(firstError(), aggregateError()),
});

await allFulfilled([
  Promise.resolve(1),
  Promise.reject("Oops"),
  Promise.resolve(3),
]);
// "CustomError: Unknown\n..."
//=> CustomError("Unknown", { cause: "Oops" })
await allFulfilled([
  Promise.resolve(1),
  Promise.reject("Oops"),
  Promise.reject(new Error("Something went wrong")),
]);
// "CustomError: Unknown\n..."
// "Error: Something went wrong\n..."
//=> AggregateError([ CustomError("Unknown", { cause: "Oops" }), Error("Something went wrong") ])
```

### `ReasonReducer(reasons)`

Reduces all reasons that any `Promise` was rejected with to a single `Error`.

A `ReasonReducer` is only called with a non-empty array of reasons.

There are a several `ReasonReducer` function providers built-in.

#### `aggregateError([message])`

Returns a `ReasonReducer` that reduces all the reasons a `Promise` was rejected with into an `AggregateError`.

Optionally, `message` can be specified for use when creating the `AggregateError`.

Form example;

``` javascript
import { aggregateError, allFulfilled } from "allfulfilled"; 

await allFulfilled([
  Promise.resolve(1),
  Promise.reject(new Error("Oops")),
  Promise.reject(new Error("Something went wrong")),
], aggregateError());
//=> AggregateError([ Error("Oops"), Error("Something went wrong") ])
```

#### `countError(reduceOneError, reduceManyErrors)`

Returns a `ReasonReducer` that uses the appropriate error reducer based on the number of reasons a `Promise` was
rejected with.

For example;

``` javascript
import { aggregateError, allFulfilled, countError, firstError } from "allfulfilled";

const reducer = countError(firstError(), aggregateError()); 

await allFulfilled([
  Promise.resolve(1),
  Promise.reject(new Error("Oops")),
  Promise.resolve(3),
], reducer);
//=> Error("Oops")
await allFulfilled([
  Promise.resolve(1),
  Promise.reject(new Error("Oops")),
  Promise.reject(new Error("Something went wrong")),
], reducer);
//=> AggregateError([ Error("Oops"), Error("Something went wrong") ])
```

#### `firstError()`

Returns a `ReasonReducer` that returns the first reason a `Promise` was rejected with as an `Error`.

For example;

``` javascript
import { allFulfilled, firstError } from "allfulfilled";

await allFulfilled([
  Promise.resolve(1),
  Promise.reject(new Error("Oops")),
  Promise.reject(new Error("Something went wrong")),
], firstError());
//=> Error("Oops")
await allFulfilled([
  Promise.resolve(1),
  Promise.reject("Oops"),
  Promise.reject(new Error("Something went wrong")),
], firstError());
//=> Error("", { cause: "Oops" })
```

#### `lastError()`

Returns a `ReasonReducer` that returns the last reason a `Promise` was rejected with as an `Error`.

For example;

``` javascript
import { allFulfilled, lastError } from "allfulfilled";

await allFulfilled([
  Promise.resolve(1),
  Promise.reject(new Error("Oops")),
  Promise.reject(new Error("Something went wrong")),
], lastError());
//=> Error("Something went wrong")
await allFulfilled([
  Promise.resolve(1),
  Promise.reject(new Error("Oops")),
  Promise.reject("Something went wrong"),
], lastError());
//=> Error("", { cause: "Something went wrong" })
```

#### `preferError()`

Returns a `ReasonReducer` that returns any reason a `Promise` was rejected with as an `Error`, with a preference of
using the first reason that was originally an instance of `Error`, where possible.

For example;

``` javascript
import { allFulfilled, preferError } from "allfulfilled";

await allFulfilled([
  Promise.resolve(1),
  Promise.reject("Oops"),
  Promise.reject(new Error("Something went wrong")),
], preferError());
//=> Error("Something went wrong")
await allFulfilled([
  Promise.resolve(1),
  Promise.reject("Oops"),
  Promise.reject("Something went wrong"),
], preferError());
//=> Error("", { cause: "Oops" })
```

### `ReasonMapper(reason)`

Maps a reason that a `Promise` was rejected with to an instance of `Error`.

A `ReasonMapper` is only called with a reason that is **not** an `Error`, as well as its index in the array of settled
results.

There are a some `ReasonMapper` function providers built-in.

#### `castError()`

Returns a `ReasonMapper` that returns the reason a `Promise` was rejected cast as an `Error`.

**Warning:** This mapper intentionally breaks the type contract and so should be used with caution.

For example;

``` javascript
import { allFulfilled, castError } from "allfulfilled";

await allFulfilled([
  Promise.resolve(1),
  Promise.reject("Oops"),
  Promise.reject(new Error("Something went wrong")),
], { mapper: castError() });
//=> AggregateError([ "Oops", Error("Something went wrong") ])
```

#### `unknownError([message])`

Returns a `ReasonMapper` that returns an `Error` instance with the reason a `Promise` was rejected captured as it
`cause`.

Optionally, `message` can be specified for use when creating the `Error`.

For example;

``` javascript
import { allFulfilled, unknownError } from "allfulfilled";

await allFulfilled([
  Promise.resolve(1),
  Promise.reject("Oops"),
  Promise.reject(new Error("Something went wrong")),
], { mapper: unknownError() });
//=> AggregateError([ Error("", { cause: "Oops" }), Error("Something went wrong") ])
await allFulfilled([
  Promise.resolve(1),
  Promise.reject("Oops"),
  Promise.reject(new Error("Something went wrong")),
], { mapper: unknownError("Unknown error") });
//=> AggregateError([ Error("Unknown error", { cause: "Oops" }), Error("Something went wrong") ])
```

### `ReasonListener(reason)`

A listener that is invoked with each reason that any `Promise` is rejected with before they are reduced.

A `ReasonListener` is only called with a `Reason` and its index in the array of settled results.

There are no built-in `ReasonListener` function providers, however, an example could be to log each reason individually;

``` javascript
import { allFulfilled } from "allfulfilled";

const listener = (reason, _index) => console.error(reason.error);

await allFulfilled([
  Promise.resolve(1),
  Promise.reject(new Error("Oops")),
  Promise.reject(new Error("Something went wrong")),
], { listener });
// "Error: Oops\n..."
// "Error: Something went wrong\n..."
//=> AggregateError([ Error("Oops"), Error("Something went wrong") ])
```

## Bugs

If you have any problems with this package or would like to see changes currently in development, you can do so
[here](https://github.com/airmrcr/node-allfulfilled/issues).

## Contributors

If you want to contribute, you're a legend! Information on how you can do so can be found in
[CONTRIBUTING.md](https://github.com/airmrcr/node-allfulfilled/blob/main/CONTRIBUTING.md). We want your suggestions and
pull requests!

A list of all contributors can be found in
[AUTHORS.md](https://github.com/airmrcr/node-allfulfilled/blob/main/AUTHORS.md).

## License

Copyright © 2026 airmrcr

See [LICENSE.md](https://github.com/airmrcr/node-allfulfilled/raw/main/LICENSE.md) for more information on our MIT
license.
