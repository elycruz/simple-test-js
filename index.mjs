const {log, warn, assert, error} = console,

  jsonClone = x => JSON.parse(JSON.stringify(x)),
  noop = () => undefined,

  successMsg = `"%s" completed after %sms`,
  errorMsg = '%o errored out after %sms',

  _ensureArgsFormat = (name, fn) => {
    if (typeof name != 'string' || typeof fn != 'function') {
      throw new Error(`\`${fn.name}\` arg types are incorrect`);
    }
  },

  // Symbols
  // ----
  AFTER_ALL_METHOD = Symbol('afterAll'),
  AFTER_EACH_METHOD = Symbol('afterEach'),
  BEFORE_ALL_METHOD = Symbol('beforeAll'),
  BEFORE_EACH_METHOD = Symbol('beforeEach'),
  TEST_SUITE_DEFINE = Symbol('testSuiteDefine'),
  TEST_SUITE_RUN = Symbol('testSuiteRun'),
  TEST_CASE_DEFINE = Symbol('testCaseDefine'),
  TEST_CASE_RUN = Symbol('testCaseRun'),
  TEST_SUITE_COMPLETE = Symbol('testSuiteComplete'),
  TEST_CASE_COMPLETE = Symbol('testCaseComplete'),
  DATA = Symbol('data'),

  defaultOnTestCaseComplete = suite => null,

  defaultOnTestSuiteComplete = suite => null
;

export {jsonClone, assert, log, warn, error};

function Nameable(name = '') {
  Object.defineProperty(this, 'name', {
    value: name,
    configurable: false,
    enumerable: true
  });
}

function Indexable(idx = 0) {
  Object.defineProperty(this, 'idx', {
    value: idx,
    configurable: false,
    enumerable: true
  });
}

export class TestCase {
  constructor(props = {}) {
    Object.assign(this, {
      idx: 0,
      name: '',
      run: noop
    }, props || {});
    Nameable.call(this, this.name);
    Indexable.call(this, this.idx);
  }
}

export class TestSuite {

  // showTestCaseTimeElapsed = false;
  // showTimeElapsed = true;

  [DATA] = {
    testsList: [],
    testsMap: new Map(),
    tests: {
      runCount: 0,
      failed: 0,
      passed: 0,
    },
    timeElapsed: 0,
  };

  constructor(props = {}) {
    const it = this[TEST_CASE_DEFINE].bind(this);
    Object.assign(this, {
      idx: 0,
      init: noop,
      it,
      name: '',
      test: it,
      onComplete: noop
    }, props);
    Object.defineProperties(this, {
      idx: {value: this.idx, configurable: false},
      it: {value: this.it, configurable: false},
      init: {value: this.init, configurable: false},
      name: {value: this.name, configurable: false},
      test: {value: this.it, configurable: false},
      run: {value: this[TEST_SUITE_RUN].bind(this), configurable: false}
    });
  }

  [TEST_CASE_COMPLETE]() {
    const rslt =
      this[DATA].tests.runCount += 1;
    if (rslt === this[DATA].testsMap.size) {
      this.onComplete(this);
    }
  }

  [TEST_CASE_DEFINE](name, fn) {
    _ensureArgsFormat(name, fn);
    fn.testName = name;
    this[DATA].testsList.push(fn);
    this[DATA].testsMap.set(fn, name);
    return this;
  }

  [TEST_CASE_RUN](name, fn) {
    _ensureArgsFormat(name, fn);

    const t0 = performance.now(),
      {[DATA]: data} = this;

    console.count(`"${this.name}" test`)

    try {
      const rslt = fn();
      if (rslt && rslt instanceof Promise) {
        return rslt
          .then(() => {
            log(successMsg, name, (performance.now() - t0) * 1000);
            data.tests.passed += 1;
            this[TEST_CASE_COMPLETE]();
          })
          .catch(err => {
            error(`"${name}" ${err};  Errored out after ${Math.round((performance.now() - t0) * 1000)}ms`);
            this[DATA].tests.failed += 1;
            this[TEST_CASE_COMPLETE]();
            return err;
          });
      } else {
        this[DATA].tests.passed += 1;
        this[TEST_CASE_COMPLETE]();
        log(successMsg, name, Math.round((performance.now() - t0) * 1000));
      }
    } catch (e) {
      this[DATA].tests.failed += 1;
      this[TEST_CASE_COMPLETE]();
      error(errorMsg, e, Math.round((performance.now() - t0) * 1000));
    }
  }

  [TEST_SUITE_RUN]() {
    const {[DATA]: {testsList}} = this;
    return Promise.all(testsList.map(f => this[TEST_CASE_RUN](f.name, f)))
      .then(() => log(jsonClone(this[DATA])));
  }
}

export class TestSuites extends TestSuite {
  static name = 'TestSuites';

  // beforeAll = noop;
  // beforeEach = noop;
  // afterAll = noop;
  // afterEach = noop;
  // describe = noop;
  // it = noop;
  // test = noop;

  [DATA] = {
    suites: {
      runCount: 0,
      failed: 0,
      passed: 0,
    },
    suitesList: [],
    tests: {
      failed: 0,
      passed: 0,
    },
    timeElapsed: 0,
  };

  constructor(props = {}) {
    super(props);
    Object.defineProperties(this, {
      describe: {value: this[TEST_SUITE_DEFINE].bind(this), configurable: false}
    });
  }

  [TEST_CASE_COMPLETE]() {
    const rslt = this[DATA].suites.runCount += 1;
    if (rslt === this[DATA].suitesList.length) {
      log('Suites completed:', this);
      this[TEST_SUITE_COMPLETE](this);
    }
  }

  [TEST_SUITE_COMPLETE](suite) {
    log(`Suite ${suite.name} completed`, suite);
  }

  [TEST_SUITE_DEFINE](name, fn, idx = 0) {
    _ensureArgsFormat(name, fn);
    const testSuite = new TestSuite({
      name,
      init: fn,
      idx,
      onComplete: this[TEST_SUITE_COMPLETE].bind(this)
    });
    testSuite.init(testSuite);
    this[DATA].suitesList.push(testSuite);
    return this;
  }

  async [TEST_SUITE_RUN](suite) {
    const {name, init: fn} = suite;

    _ensureArgsFormat(name, fn);

    const t0 = performance.now();

    try {
      const rslt = suite[TEST_SUITE_RUN]();
      if (rslt && rslt instanceof Promise) {
        rslt
          .then(() => {
            log(`"${name}" completed after ${Math.round((performance.now() - t0) * 1000)}ms.`);
            this[DATA].suites.passed += 1;
            this[TEST_SUITE_COMPLETE](suite);
          })
          .catch(err => {
            error(`${name} \`${err}\`, errored out after ${Math.round((performance.now() - t0) * 1000)}ms.`);
            this[TEST_SUITE_COMPLETE](suite);
            this[DATA].suites.failed += 1;
          })
          .finally(() => {
            // console.groupEnd();
          });
      } else {
        log(`"${name}" completed after ${Math.round((performance.now() - t0) * 1000)}ms.`);
        this[TEST_SUITE_COMPLETE](suite);
        this[DATA].suites.passed += 1;
        // console.groupEnd();
      }
    } catch (err) {
      error(`"${name}" \`${err}\`, errored out after  ${Math.round((performance.now() - t0) * 1000)}ms.`);
      this[TEST_SUITE_COMPLETE](suite);
      this[DATA].suites.failed += 1;
      // console.groupEnd();
    }
  }

  run = async () => {
    const {[DATA]: {suitesList}} = this;
    return Promise.all(suitesList.map(s => this[TEST_SUITE_RUN](s))).then(() => {
      log('print report');
    });
  }
}
