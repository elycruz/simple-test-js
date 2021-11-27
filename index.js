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
    DATA = Symbol('data'),

    defineTestSuite = (name, fn, onSuiteComplete, onCaseComplete) => {
        _ensureArgsFormat(name, fn);
        fn.testName = name;
        fn.parent = this;
        this[DATA].testsList.push(fn);
        return this;
    },

    testSuiteRun = () => null,

    testCaseDefine = () => null,

    testCaseRun = () => null,

    onTestSuiteComplete = suite => null,

    onTestCaseComplete = suite => null,

    offsetRunCount = (offset = 0, ctx = {}) => {
        ctx[DATA].runCount += offset;
    }
;

export {jsonClone, assert, log, warn, error};

class TestSuite {
    [DATA] = {
        runCount: 0,
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
        Object.assign(this, {
            name: '',
            idx: 0,
            value: noop,
            onComplete: noop,
            showTestCaseTimeElapsed: false,
            showTimeElapsed: true,
        }, props);
        Object.defineProperties(this, {
            it: {value: this[TEST_CASE_DEFINE].bind(this), configurable: false},
            test: {value: this[TEST_CASE_DEFINE].bind(this), configurable: false},
            name: {value: this.name, configurable: false},
            idx: {value: this.idx, configurable: false},
            value: {value: this.value, configurable: false},
        });
    }

    valueOf() {
        return this.value;
    }

    offsetRunCount(offset = 0) {
        const rslt =
            this[DATA].runCount += offset;
        if (rslt === this[DATA].testsList.length) {
            this.onComplete(this);
        }
    }

    [TEST_CASE_DEFINE](name, fn) {
        _ensureArgsFormat(name, fn);
        fn.testName = name;
        this[DATA].testsList.push(fn);
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
                        this.offsetRunCount(1,);
                        data.tests.passed += 1;
                    })
                    .catch(err => {
                        error(`"${name}" ${err};  Errored out after ${Math.round((performance.now() - t0) * 1000)}ms`);
                        this[DATA].tests.failed += 1;
                        this.offsetRunCount(1);
                        return err;
                    });
            } else {
                this[DATA].tests.passed += 1;
                this.offsetRunCount(1);
                log(successMsg, name, Math.round((performance.now() - t0) * 1000));
            }
        } catch (e) {
            this.offsetRunCount(1);
            this[DATA].tests.failed += 1;
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

    offsetRunCount(offset = 0) {
        const rslt = this[DATA].suites.runCount += offset;
        if (rslt === this[DATA].suitesList.length) {
            log('Suites completed:', this);
            this.onSuiteComplete(this);
        }
    }

    onSuiteComplete(suite) {
        log(`Suite ${suite.name} completed`, suite);
    }

    [TEST_CASE_DEFINE]() {
        return this;
    }

    [TEST_SUITE_DEFINE](name, fn, idx = 0) {
        _ensureArgsFormat(name, fn);
        const s = new TestSuite({
            name,
            value: fn,
            idx,
            onComplete: this.onSuiteComplete.bind(this)
        });
        s.value(s);
        this[DATA].suitesList.push(s);
        return this;
    }

    async [TEST_SUITE_RUN](suite) {
        const {name, value: fn} = suite;

        _ensureArgsFormat(name, fn);

        const t0 = performance.now();

        try {
            const rslt = suite[TEST_SUITE_RUN]();
            if (rslt && rslt instanceof Promise) {
                rslt
                    .then(() => {
                        log(`"${name}" completed after ${Math.round((performance.now() - t0) * 1000)}ms.`);
                        this[DATA].suites.passed += 1;
                        this.offsetRunCount(1);
                    })
                    .catch(err => {
                        error(`${name} \`${err}\`, errored out after ${Math.round((performance.now() - t0) * 1000)}ms.`);
                        this.offsetRunCount(1);
                        this[DATA].suites.failed += 1;
                    })
                    .finally(() => {
                        // console.groupEnd();
                    });
            } else {
                log(`"${name}" completed after ${Math.round((performance.now() - t0) * 1000)}ms.`);
                this.offsetRunCount(1);
                this[DATA].suites.passed += 1;
                // console.groupEnd();
            }
        } catch (err) {
            error(`"${name}" \`${err}\`, errored out after  ${Math.round((performance.now() - t0) * 1000)}ms.`);
            this.offsetRunCount(1);
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
