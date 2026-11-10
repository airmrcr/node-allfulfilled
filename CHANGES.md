## Version 0.3.0, 2026.11.10

* **Breaking Change:** Map rejection reasons that are not an instance of `Error` to an `Error` by default
* Allow options to be passed to `allFulfilled` instead of just the `reducer`
* Add `listener` option to specify a callback function that is called with each rejection reason
* Add `mapper` option to control how rejection reasons that are not an instance of `Error` are mapped to an `Error`
* Add `bindAllFulfilled` function that returns an `allFulfilled` function bound to use either the given options or reducer
* Add the following built-in reducer providers:
  * `aggregateError` (**default**): Reduces multiple rejection reasons into a single `AggregateError`
  * `countError`: Allows control over which reducer is used based on whether one or more rejection reasons are present
  * `firstError`: Reduces to the first reason
  * `lastError`: Reduces to the last reason
  * `preferError`: Reduces to the first reason that is an instance of `Error` and falls back to the first reason if none
* Add the following built-in mapper providers:
  * `castError`: Casts the reason to an `Error`
  * `unknownError` (**default**): Wraps the reason in a new `Error` instance and captures it as the cause
* Deprecate the following reducer providers in favor of their new replacements:
  * `aggregate` → `aggregateError`
  * `any` → `preferError`
  * `first` → `firstError`
  * `last` → `lastError`
* Deprecate the following types in favor of their new replacements:
  * `ReasonErrorMapper` → `ReasonMapper`
  * `ReasonsErrorReducer` → `ReasonReducer`
* Improve TSDocs further (incl. examples)
* Upgrade TypeScript to v6
* Bump all dependencies
* Transfer ownership to `github.com/airmrcr`

## Version 0.2.0, 2026.02.23

* **Breaking Change:** Rename `ReasonsErrorMapper` type to `ReasonsErrorReducer`
* Add `any` function to provide an `ReasonsErrorReducer` that will map any rejection reason to an `Error`
* Change typings to allow promises with different resolved types to be passed together

## Version 0.1.0, 2026.01.15

* Initial release
