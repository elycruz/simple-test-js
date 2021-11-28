# simple-test-js (work-in-progress)

A "**no tooling required**", "bare minimum", javascript testing library.

## Spec

### A Test Suite should
- capture elapsed time.
- call it's `onComplete` handler (whether default or not).
- Capture number of tests run.

### A Test Case should
- Capture it's elapsed time.
- call it's `onComplete` handler.

### A "Test Suites" should:
- capture elapsed time.
- call it's `onComplete` handler.
- Capture number of suites, and tests, run.

## Usage

@todo

## API

@todo

- `(describe | testSuite)(string, ((TestSuites?) => any) | ((TestSuites?) => Promise<any>)): TestSuites`
- `(it | test)(string, ((TestSuite?) => any) | ((TestSuite?) => Promise<any>)): TestSuite`

## Todos:
- [ ] tests - Should be able to run in browser and/or node (etc.).

## License
GPL + Apache 2.0
