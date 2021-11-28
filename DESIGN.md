# Design

## Example use case:

```javascript
const {describe, assert, run: runTestSuites} = new TestSuites();

// Add one, or more, test suites
describe('Test Suite', ({it}) => {
    // ...
    it('should have more tests', () => {
        const value = false;
        assert(value, `Expected \`true\`;  Received \`${value}\``);
    });

    // Async test case
    it('should have more tests', async () => {
        const value = false;
        assert(value, `Expected \`true\`;  Received \`${value}\``);
    });

    // Async, nested, test suite
    describe('Test Suite', async ({it}) => {
        // ...
    });
});

// Other test suite
describe('Test Suite 2', ({it}) => { 
    // ...
});

// Log results
console.log(runTestSuites());

// Log results as tabular data (@see mdn `console.table` API (https://developer.mozilla.org/en-US/docs/Web/API/console/table)).
console.table(runTestSuites());
```

## Approach
Test Suites keep a map of functions to testcase objects.
Test Suite Collections keeps a map of suite functions to suite objects.

When test suite collection runs `run` is called for each test suite.

When run is called for a test suite each testcase callback is called. 
