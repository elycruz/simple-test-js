import {noop, jsonClone, log, error, info} from "./utils.mjs";

import {
  DATA, SUITES,
  TEST_CASE_COMPLETE,
  TEST_CASE_DEFINE,
  TEST_CASE_RUN, TEST_SUITE_COMPLETE,
  TEST_SUITE_DEFINE,
  TEST_SUITE_RUN, TESTS
} from "./constants.mjs";

const successMsg = `"%s" completed after %sms`,
  errorMsg = '%o errored out after %sms',

  _ensureArgsFormat = (name, fn) => {
    if (typeof name != 'string' || typeof fn != 'function') {
      throw new Error(`\`${fn.name}\` arg types are incorrect`);
    }
  },

  defaultSuiteReporter = suite => {
    console.info(`${suite.name} completed after ${suite.timeElapsed * 1000}ms`);
  },

  defaultSuitesReporter = report => {
    console.info(`Tests completed after ${report.timeElapsed * 1000}ms`);
    console.table(report);
  }
;

const TestUnitSate = {
  Pending: 'pending',
  Running: 'running',
  Completed: 'completed',
  Failed: 'failed'
}

class TestSuiteData {
  testsCount = 0;
  testsRunCount = 0;
  testsFailedCount = 0;
  suitesCount = 0;
  suitesRunCount = 0;
  suitesFailedCount = 0;
  timeCountStart = 0;
  timeElapsed = 0;
  timeCountEnd = 0;
}

export class TestUnit {
  idx = 0;
  name = '';
  onComplete = defaultSuiteReporter;
  runDefinition = noop;
  state = TestUnitSate.Pending;

  constructor(props = {}) {
    Object.assign(this, props || {});

    Object.defineProperties(this, {
      name: {
        value: this.name,
        enumerable: true
      },
      definition: {
        value: this.runDefinition,
      },
      onComplete: {
        value: this.onComplete
      }
    });
  }
}

export class TestSuite extends TestUnit {
  it = this[TEST_CASE_DEFINE].bind(this);
  test = this.it;

  [DATA] = new TestSuiteData();
  [TESTS] = [];

  constructor(props = {}) {
    super(props);
    Object.defineProperties(this, {
      it: {value: this.it},
      test: {value: this.it},
    });
  }

  [TEST_CASE_DEFINE](name, fn) {
    _ensureArgsFormat(name, fn);
    this[TESTS].push(fn);
    return this;
  }

  [TEST_CASE_RUN](name, fn) {
    _ensureArgsFormat(name, fn);

    const t0 = performance.now(),
      {[DATA]: data} = this;

    console.count(`"${this.name}" test`);

    try {
      const rslt = fn();
      if (rslt && rslt instanceof Promise) {
        return rslt
          .then(() => {
            log(successMsg, name, (performance.now() - t0) * 1000);
            data.testsRunCount += 1;
          })
          .catch(err => {
            error(`"${name}" ${err};  Errored out after ${Math.round((performance.now() - t0) * 1000)}ms`);
            this[DATA].testsFailedCount += 1;
            data.testsRunCount += 1;
            return err;
          });
      } else {
        data.testsRunCount += 1;
        log(successMsg, name, Math.round((performance.now() - t0) * 1000));
      }
    } catch (e) {
      data.testsFailedCount += 1;
      data.testsRunCount += 1;
      error(errorMsg, e, Math.round((performance.now() - t0) * 1000));
    }
  }

  [TEST_SUITE_RUN]() {
    const {[TESTS]: tests, [DATA]: data} = this,
      onComplete = () => {
        data.timeElapsed =
          data.timeCountEnd = (performance.now() - data.timeCountStart) * 1000;
        log(jsonClone(data));
        this.state = TestUnitSate.Completed;
        this.onComplete(this);
      };
    this.state = TestUnitSate.Running;
    data.timeCountStart = performance.now();
    return Promise.all(tests.map(f => this[TEST_CASE_RUN](f.name, f)))
      .then(onComplete, onComplete);
  }
}

export class TestSuites extends TestSuite {
  static name = 'TestSuites';

  onComplete = defaultSuitesReporter;

  // beforeAll = noop;
  // beforeEach = noop;
  // afterAll = noop;
  // afterEach = noop;

  [DATA] = new TestSuiteData();
  [SUITES] = [];

  constructor(props = {}) {
    super(props);
    Object.defineProperties(this, {
      describe: {value: this[TEST_SUITE_DEFINE].bind(this)},
    });
  }

  [TEST_CASE_COMPLETE]() {
    throw new Error('Should not be called.');
  }

  [TEST_SUITE_COMPLETE](suite) {
    // @aggregate suite report into own data
    const {[DATA]: data} = this,
      suiteData = suite[DATA];

    data.testsCount += suiteData.testsCount;
    data.testsRunCount += suiteData.testsRunCount;
    data.testsFailedCount += suiteData.testsFailedCount;
    data.timeElapsed += suiteData.timeElapsed;

    info(`Suite ${suite.name} completed`, suiteData);
  }

  [TEST_SUITE_DEFINE](name, fn, idx = 0) {
    _ensureArgsFormat(name, fn);
    const testSuite = new TestSuite({
      name,
      definition: fn,
      idx,
      onComplete: this[TEST_SUITE_COMPLETE].bind(this)
    });
    testSuite.runDefinition(testSuite);
    this[SUITES].push(testSuite);
    return this;
  }

  async [TEST_SUITE_RUN](suite) {
    const {name} = suite;
    const t0 = performance.now();
    const {[DATA]: data} = this;

    try {
      const rslt = suite[TEST_SUITE_RUN]();
      if (rslt && rslt instanceof Promise) {
        rslt
          .then(() => {
            log(`"${name}" completed after ${Math.round((performance.now() - t0) * 1000)}ms.`);
            this[TEST_SUITE_COMPLETE](suite);
          })
          .catch(err => {
            error(`${name} \`${err}\`, errored out after ${Math.round((performance.now() - t0) * 1000)}ms.`);
            this[TEST_SUITE_COMPLETE](suite);
            data.suitesFailedCount += 1;
          });
      } else {
        log(`"${name}" completed after ${Math.round((performance.now() - t0) * 1000)}ms.`);
        this[TEST_SUITE_COMPLETE](suite);
      }
    } catch (err) {
      error(`"${name}" \`${err}\`, errored out after  ${Math.round((performance.now() - t0) * 1000)}ms.`);
      this[TEST_SUITE_COMPLETE](suite);
      data.suitesFailedCount += 1;
    }
  }

  run = async () => {
    const {[SUITES]: suites} = this;
    return Promise.all(suites.map(s => this[TEST_SUITE_RUN](s))).then(() => {
      log('print report');
      this.onComplete(this[DATA]);
    });
  }
}
