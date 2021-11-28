import {jsonClone, TestSuites, TestSuite} from "./index.mjs";

const {assert, log, error, warn} = console;

// Constructors
log(`#${TestSuite.name}`);

assert(TestSuite instanceof Function, `${TestSuite.name} constructor should be an \`instanceof Function\``);
assert(TestSuites instanceof Function, `${TestSuites.name} constructor should be an \`instanceof Function\``);

// "On construction ..."
const testSuites = new TestSuites();
['describe', 'it', 'test'].forEach(k => {
  assert(Object.prototype.hasOwnProperty.call(testSuites, k),
    `${testSuites.constructor.name} should have own property "${k}".`);
});
