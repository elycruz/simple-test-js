const {log, warn, error} = console,

    jsonClone = x => JSON.parse(JSON.stringify(x)),

    successMsg = `SUCCESS: "%s" completed after %sms`,
    errorMsg = '%o errored out after %sms',

    assert = (arg, ...args) => {
        console.assert(arg, ...args);
        if (!arg) {
            throw new Error(...args);
        }
    },

    _ensureArgsFormat = (name, fn) => {
        if (typeof name != 'string' || typeof fn != 'function') {
            throw new Error(`\`${fn.name}\` arg types are incorrect`);
        }
    };

export {jsonClone, assert, log, warn, error};

export class TestSuite {

    constructor(data = {}) {
        Object.defineProperties(this, {
            numSuitesPassed: {
                get() {
                    return this.suites.numPassed;
                },
                enumerable: true
            },

            numSuitesFailed: {
                get() {
                    return this.suites.count - this.numSuitesPassed;
                },
                enumerable: true
            }
        });

        Object.assign(this, {
            timeElapsed: 0,
            tests: {
                count: 0,
                numFailed: 0,
                numPassed: 0,
            },
            suites: {
                count: 0,
                numFailed: 0,
                numPassed: 0,
            },
        }, data);
    }

    async #_describe(name, fn) {
        _ensureArgsFormat(name, fn);

        this.suites.count += 1;

        console.group(name);
        console.count('Suites');
        const t0 = performance.now();
        try {
            const rslt = fn();
            if (rslt && rslt instanceof Promise) {
                rslt
                    .then(() => {
                        const t1 = performance.now();
                        log(`SUITE SUCCESS:  "${name}" completed successfully after ${Math.round((t1 - t0) * 1000)}ms.`);
                    })
                    .catch(err => {
                        const t1 = performance.now();
                        log(`SUITE ERROR: \`${err}\`, errored out after  ${Math.round((t1 - t0) * 1000)}ms.`);
                        this.suites.numFailed += 1;
                    })
                    .finally(() => {
                        console.groupEnd();
                    });
            } else {

                console.groupEnd();
            }
        } catch (err) {
            const t1 = performance.now();
            log(`SUITE ERROR: \`${err}\`, errored out after  ${Math.round((t1 - t0) * 1000)}ms.`);
            console.groupEnd();
        }
        log(jsonClone(this));
    }

    describe = this.#_describe.bind(this);

    async #_it(name, fn) {

        _ensureArgsFormat(name, fn);

        this.tests.count += 1;

        console.count('Test');
        console.group(name);

        const t0 = performance.now();

        try {
            const rslt = fn();
            if (rslt && rslt instanceof Promise) {
                return rslt
                    .then(() => {
                        const t1 = performance.now();
                        log(successMsg, name, (t1 - t0) * 1000);
                        this.tests.numPassed += 1;
                    })
                    .catch(err => {
                        const t1 = performance.now();
                        log(`${err};  Errored out after ${Math.round((t1 - t0) * 1000)}ms`);
                        this.tests.numFailed += 1;
                        return err;
                    })
                    .finally(() => console.groupEnd());
            } else {
                this.tests.numPassed += 1;
                const t1 = performance.now();
                log(successMsg, name, Math.round((t1 - t0) * 1000));
                console.groupEnd();
            }
        } catch (e) {
            this.tests.numFailed += 1;
            const t1 = performance.now();
            log(errorMsg, e, Math.round((t1 - t0) * 1000));
            console.groupEnd();
        }
    }

    it = this.#_it.bind(this);

    async run() {

    }
}
