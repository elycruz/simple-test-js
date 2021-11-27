# Design

## Example use case:

```javascript
const {describe, it, assert, run: runTestSuites} = new TestSuites();

// Add one, or more, test suites
describe('Test Suite', () => {
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
    describe('Test Suite', async () => {
        // ...
    });
});

// Other test suite
describe('Test Suite 2', () => { 
    // ...
});

// Log results
console.log(runTestSuites());

// Log results as tabular data (@see mdn `console.table` API (https://developer.mozilla.org/en-US/docs/Web/API/console/table)).
console.table(runTestSuites());
```

Test Suite: `describe('Test Suite', () => {})`
Test Case: `it('should ...', () => {})`
