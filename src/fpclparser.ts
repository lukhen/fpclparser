import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as A from "fp-ts/lib/Array";
import * as R from "fp-ts/lib/Record";
import { sequenceT } from "fp-ts/lib/Apply";
import { Applicative2 } from "fp-ts/lib/Applicative";


export function parseArgv<A>(comms: CommandConstructor<any>[]): (argv: Array<string>) => OptionEither<A> {
    return argv => pipe(
        comms,
        A.map(comm => comm({ name: argv[0], args: getArgs(argv), opts: getOptionDict(getAllOptionList(argv)) })),
        x => A.filter(O.isSome)(x),
        x => A.isEmpty(x) ? O.none : x[0]
    );
}

/**
   Produce [name, args, opts] from argv.
**/
export function parseArgv2(argv: string[]): [string, string[], CommandOptionDict] {
    return ["", [], {}]
}


export function getAllOptionList(argv: string[]): CommandOption[] {
    return pipe(
        argv,
        A.reduce(
            [],
            (soFar: CommandOption[], nextEl) => pipe(
                nextEl,
                E.fromPredicate(isOption, el => el),
                E.fold(
                    el => pipe(
                        soFar,
                        explodeTailTip,
                        ({ body, tailTip }) => O.fold(
                            () => [...body],
                            (co: CommandOption) => [
                                ...body,
                                { ...co, values: A.append(el)(co.values) }
                            ]
                        )(tailTip)
                    ),
                    el => [...soFar, { name: el.slice(2), values: [] }]
                )

            )
        )
    );
}
/**
Separate the last element of the list, unless it's empty.
**/
export function explodeTailTip<A>(arr: Array<A>): { body: Array<A>; tailTip: O.Option<A>; } {
    return { body: arr.slice(0, arr.length - 1), tailTip: O.fromNullable(arr[arr.length - 1]) };
}
/**
   Produce O.some if argv contains optName option, otherwise produce Option.none
**/
export function getOpt(argv: string[]): (optName: string) => O.Option<Array<string>> {
    return optName => O.fromNullable(getOptionDict(getAllOptionList(argv))[optName]);
}
export function getOptionDict(cos: CommandOption[]): CommandOptionDict {
    return R.fromFoldableMap(
        { concat: (x: string[], y: string[]) => [...x, ...y] },
        A.Foldable
    )(cos, co => [co.name, co.values]);
}

export function getArgs(argv: string[]): string[] {

    function sliceToTheFirstOption(ss: string[]): string[] {
        return pipe(
            ss,
            O.fromPredicate(() => ss.length > 0),
            O.fold(
                () => [],
                ss => isOption(ss[0])
                    ? sliceToTheFirstOption([])
                    : [ss[0]].concat(sliceToTheFirstOption(ss.slice(1)))
            )
        );
    }

    return pipe(
        argv,
        O.fromPredicate(() => argv.length > 1),
        O.fold(
            () => [],
            argv => sliceToTheFirstOption(argv.slice(1))
        )
    );
}

function isOption(s: string) {
    return s.startsWith("--");
}

export interface CommandMeta<A> {
    tagOfA: string,
    argCount: number,
    reqOpts: string[],
    innerConstructor: InnerConstructor<A>
}

export type InnerConstructor<A> = (d: [string[], CommandOptionDict]) => E.Either<string[], A>

export type OptionEither<A> = O.Option<E.Either<string[], A>>;

/**
   Produce a function that produces a CommandAbs from CommandData
**/
export function getConstructor<A>(commandMeta: CommandMeta<A>): CommandConstructor<A> {
    return ({ name, args, opts }) =>
        name != commandMeta.tagOfA ?
            O.none
            : O.some(pipe(
                [args, opts] as [string[], CommandOptionDict],
                ([args, opts]) => [
                    ensureSize(commandMeta.argCount)(args),
                    ensureOpts(commandMeta.reqOpts)(opts)
                ] as [
                        E.Either<string[], string[]>,
                        E.Either<string[], CommandOptionDict>
                    ],
                (x) => sequenceT(e)(...x),
                E.chain(commandMeta.innerConstructor)
            ));

}
/**
   Data provided by the user in argv to produce a Command.
**/
export interface CommandData {
    name: string,
    args: string[],
    opts: CommandOptionDict
}

/**
   Type of a function that produces CommandAbs from CommandData.
**/
export type CommandConstructor<A> = (commandData: CommandData) => OptionEither<A>;

/**
A single command option in argv, name is option's name, and values is option's value.
 - if values length is > 1: option has multiple values
 - if values length is = 1: option has a single value
 - if values length is = 0: option is a flag

Examples:
const o1: CommandOption = {name: "o1", values: ['val1', 'val2']} // multiple values
const o2: CommandOption = {name: "o2", values: ['val3']}         // single value 
const o3: CommandOption = {name: "o3", values: []}               // flag
**/
export type CommandOption = { name: string, values: string[] }


/**
Hash map of all options in argv, where the key is an option's name, and the value is an option's value:
 - if array's length is > 1: option has multiple values
 - if array's length is = 1: option has a single value
 - if array's length is = 0: option is a flag

Example: 
For argv = ["--o1", "val1", "val2", "--o2", "val3", "--o3"]
CommandOptionDict should look like this:
const optDict: CommandOptionDict = {
    o1: ['val1', 'val2'], //multiple
    o2: ['val3'],         // single
    o3: []                // flag
}
**/
export type CommandOptionDict = Record<string, string[]>

export const e: Applicative2<E.URI> = {
    URI: E.URI,
    ap: (fab, fa) => E.ap(fa)(fab),
    map: (fa, f) => E.map(f)(fa),
    of: E.of
}

/**
   Produce Either.right if d contains optNames, otherwise produce Either.left
**/
export function ensureOpts(optNames: string[]): (d: CommandOptionDict) => E.Either<string[], CommandOptionDict> {
    return d => pipe(
        optNames,
        A.map(optName => [optName, d[optName]] as [string, string[] | undefined]),
        A.map(([optName, opt]) => E.fromNullable([`Option ${optName} is missing`])(opt)),
        A.sequence(e),
        E.map(_ => d)
    );
}

/**
   Produce Either.right is ss length is n, otherwise produce Either.left
**/
function ensureSize(n: number): (ss: string[]) => E.Either<string[], string[]> {
    return ss => pipe(
        ss,
        E.fromPredicate(
            (x) => x.length == n,
            () => ["Invalid number of args"]
        )
    );
}

export function map<X, A>(f: ((c1: A) => X)): (xe: OptionEither<A>) => OptionEither<X> {
    return xe => O.map((e: E.Either<string[], A>) => E.map((c1: A) => f(c1))(e))(xe)
}

export function fold<X, A>(handlers: {
    onNone: () => X,
    onError: (e: string[]) => X,
    onC1: (c: A) => X
}): (c: OptionEither<A>) => X {
    return c => pipe(
        c,
        O.fold(
            handlers.onNone,
            E.fold(
                handlers.onError,
                c => handlers.onC1(c)
            )
        )
    )
}

export function getOptionEitherFoldable4Instance<A, B, C, D>(preds: {
    isA: (c: A | B | C | D) => c is A,
    isB: (c: A | B | C | D) => c is B,
    isC: (c: A | B | C | D) => c is C
    isD: (c: A | B | C | D) => c is D
}): {
    fold: <X>(handlers: {
        onNone: () => X,
        onError: (e: string[]) => X,
        onA: (c: A) => X,
        onB: (c: B) => X,
        onC: (c: C) => X,
        onD: (c: D) => X
    }) => (c: OptionEither<A | B | C | D>) => X,
    map: <X>(handlers: {
        onA: (c: A) => X,
        onB: (c: B) => X,
        onC: (c: C) => X,
        onD: (c: D) => X
    }) => (xe: OptionEither<A | B | C | D>) => OptionEither<X>
} {
    return {
        fold: handlers => c => pipe(
            c,
            O.fold(
                handlers.onNone,
                E.fold(
                    handlers.onError,
                    c => preds.isA(c)
                        ? handlers.onA(c)
                        : preds.isB(c)
                            ? handlers.onB(c) :
                            preds.isC(c)
                                ? handlers.onC(c) :
                                handlers.onD(c)
                )
            )
        ),
        map: handlers => xe => O.map((e: E.Either<string[], A | B | C | D>) => E.map((c: A | B | C | D) =>
            preds.isA(c) ? handlers.onA(c)
                : preds.isB(c) ? handlers.onB(c) :
                    preds.isC(c) ? handlers.onC(c) :
                        handlers.onD(c))(e))(xe)

    }
}

export function getOptionEitherFoldable3Instance<A, B, C>(preds: {
    isA: (c: A | B | C) => c is A,
    isB: (c: A | B | C) => c is B,
    isC: (c: A | B | C) => c is C
}): {
    fold: <X>(handlers: {
        onNone: () => X,
        onError: (e: string[]) => X,
        onA: (c: A) => X,
        onB: (c: B) => X,
        onC: (c: C) => X,
    }) => (c: OptionEither<A | B | C>) => X,
    map: <X>(handlers: {
        onA: (c: A) => X,
        onB: (c: B) => X,
        onC: (c: C) => X,
    }) => (xe: OptionEither<A | B | C>) => OptionEither<X>

} {
    return {
        fold: handlers => c => pipe(
            c,
            O.fold(
                handlers.onNone,
                E.fold(
                    handlers.onError,
                    c => preds.isA(c)
                        ? handlers.onA(c)
                        : preds.isB(c)
                            ? handlers.onB(c) :
                            handlers.onC(c)
                )
            )
        ),
        map: handlers => xe => O.map((e: E.Either<string[], A | B | C>) => E.map((c: A | B | C) =>
            preds.isA(c) ? handlers.onA(c)
                : preds.isB(c) ? handlers.onB(c) :
                    handlers.onC(c))(e))(xe)
    }
}


export function getOptionEitherFoldable2Instance<A, B>(preds: {
    isA: (c: A | B) => c is A,
    isB: (c: A | B) => c is B,
}): {
    fold: <X>(handlers: {
        onNone: () => X,
        onError: (e: string[]) => X,
        onA: (c: A) => X,
        onB: (c: B) => X,
    }) => (c: OptionEither<A | B>) => X,
    map: <X>(handlers: {
        onA: (c: A) => X,
        onB: (c: B) => X
    }) => (xe: OptionEither<A | B>) => OptionEither<X>
} {
    return {
        fold: handlers => c => pipe(
            c,
            O.fold(
                handlers.onNone,
                E.fold(
                    handlers.onError,
                    c => preds.isA(c)
                        ? handlers.onA(c) :
                        handlers.onB(c)
                )
            )
        ),
        map: handlers => xe => O.map((e: E.Either<string[], A | B>) => E.map((c: A | B) =>
            preds.isA(c) ? handlers.onA(c) : handlers.onB(c))(e))(xe)
    }
}
