# simple-test-js (work-in-progress)

A "no dependency" javascript testing library.

The project is targeted at projects that don't require/contain any javascript tooling but "do" require javascript testing - Can be used in modern javascript projects also.

## Ideas' Spec
- Library should be a factory method that can accept options and returns an object that contains `describe`, `it`, `test`, and other, methods.

## Usage

The library consist of functions that run and keep their own state and functions that are fashioned after 'mochajs', 'jasmine' and/or 'jest' (provides describe, it, and test etc. methods).

The other main difference is we expect the user to bring their own assertion libraries to the party (or better yet, use \`console\`'s \`assert\` (and other built-in methods) to acheive their testing requirements (examples to come later).

@todo

## API

@todo

- `(describe | testSuite)(string, (() => any) | (() => Promise<any>)): Promise<any>`
- `(it | test)(string, (() => any) | (() => Promise<any>)): Promise<any>`

## License
GPL

