import {jsonClone, TestSuites, TestSuite} from "./index.mjs";

const {assert, log, error, warn, group: testGroup, groupEnd: testGroupEnd} = console,

  hasOwnProperty = (str, x) => Object.prototype.hasOwnProperty.call(x, str),

  assertHasOwnProperties = (strList = [], xTypeStr = '', x = null) => strList.forEach(k => {
    assert(hasOwnProperty(k, x),
      `${xTypeStr} should have own property "${k}".`)
  }),

  expectedTestSuitePropNames = ['idx', 'init', 'it', 'name', 'onComplete', 'test'],
  expectedTestSuitesPropNames = ['describe'].concat(expectedTestSuitePropNames),
  _syncSuite = (name, testSuite) => {
    testGroup(name);
    testSuite();
    testGroupEnd();
  };

log(`Running test suites (if no errors all tests passed)...`);

_syncSuite('#TestSuite', () => {
  // Constructor
  // ----
  assert(TestSuite instanceof Function, `${TestSuite.name} constructor should be an \`instanceof Function\``);

  // Properties
  // ----
  const testSuite = new TestSuite();
  assertHasOwnProperties(expectedTestSuitePropNames, testSuite.constructor.name, testSuite);
});

_syncSuite('#TestSuites', () => {
  // Constructor
  // ----
  _syncSuite('Constructor', () => {
    assert(TestSuites instanceof Function, `${TestSuites.name} constructor should be an \`instanceof Function\``);
    assert((new TestSuites()) instanceof TestSuite, `\`#${TestSuites.name}\` should be instanceof \`${TestSuite.name}\``);
  });

  // Properties
  // ----
  _syncSuite('Properties', () => {
    // ----
    _syncSuite('Own Properties', () => {
      const testSuites = new TestSuites();
      assertHasOwnProperties(expectedTestSuitesPropNames, testSuites.constructor.name, testSuites);
    });

    // Enumerable props
    // ----
    _syncSuite('Enumerable Properties (should show via `toJSON()` etc.)', () => {
      const testSuites2 = new TestSuites(),
        asData = jsonClone(testSuites2);
      assertHasOwnProperties(expectedTestSuitesPropNames, testSuites2.constructor.name, asData);
    });
  });

});
