let _suites = 0;

const

{log, warn, error} = console,

successMsg = `SUCCESS: "%s" completed after %sms`,
errorMsg = '%o errored out after %sms',

assert = (arg, ...args) => {
  console.assert(arg, ...args);
  if (!arg) {
      throw new Error(...args);
  }
},

_getSuite = suiteSym => {
    let suite = _suites.get(suiteSym);
    if (!suite) {
        suite = new Map();
    }
    return suite;
},

_ensureArgsFormat = (name, fn) => {
     if (typeof name != 'string' || typeof fn != 'function') {
        throw new Error(`\`${fn.name}\` arg types are incorrect`);
    }
},

before = async fn => fn(),

describe = testSuite = async (name, fn) => {
    _ensureArgsFormat(name, fn);
    _suites++;
    console.group(name);
    console.count('Suites');
    const t0 = performance.now();
    try {
        const rslt = fn();
        if (rslt && rslt instanceof Promise) {
            rslt
              .then(() => {
                log(`SUITE SUCCESS:  "${name}" completed successfully after ${Math.round((t1 - t0) * 1000)}ms.`);
              })
              .catch(err => (log(`SUITE ERROR: \`${err}\`, errored out after  ${Math.round((t1 - t0) * 1000)}ms.`), console.trace(err), err))
              .finally(() => console.groupEnd());
        } else {
            console.groupEnd();    
        }
    } catch (e) {
        console.groupEnd();
    }
},

it = test = async (name, fn) => {
    _ensureArgsFormat(name, fn);

    console.count('Test'); 
    console.group(name); 
    let t0;
    try {
        t0 = performance.now();
        const rslt = fn();
        if (rslt && rslt instanceof Promise) {
            rslt
              .then(() => {
                const t1 = performance.now();
                log(successMsg, name, (t1 - t0) * 1000);
              })
              .catch(err => {
                const t1 = performance.now();
                log(`${err};  Errored out after ${Math.round((t1 - t0) * 1000)}ms`);
                return err;
              })
              .finally(() => console.groupEnd());
        } else {
            const t1 = performance.now();
            log(successMsg, name, Math.round((t1 - t0) * 1000));
            console.groupEnd();    
        }
    }   catch(e) {
        const t1 = performance.now();
        log(errorMsg, e, Math.round((t1 - t0) * 1000));
        console.groupEnd();
    }
};

describe("Example Test Suite", () => {
   it ('Successful test', () => {
       assert(true, 'Expected `true`');
   });
   it ('other test', () => {
       assert(false, 'Expected `true`');
   });
   it ('Tests 3', () => {
       assert(false, 'Expected `true`');
   });
})
  .then(log, error);

