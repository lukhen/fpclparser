import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import { sequenceT } from "fp-ts/lib/Apply";
import * as A from "fp-ts/lib/Array"
import { Applicative2 } from "fp-ts/lib/Applicative";

export interface Command1 {
    _tag: "comm1";
    arg: string;
    o1: string;
    o2: string;
}

export interface Command2 {
    _tag: "comm2";
    arg: string;
    o3: string;
    o4: string;
}
export interface Command3 {
    _tag: "comm3";
    arg: string;
    req: string;
    opt: O.Option<string>;
}
export interface Command4 {
    _tag: "comm4";
    arg1: string;
    arg2: string;
    opt1: string;
    opt2: string;
}

export type Command = O.Option<E.Either<Error, Command4 | Command1 | Command2 | Command3>>;
export type CommandAbs<A> = O.Option<E.Either<Error, A>>;

function getConstructor<A>(
    tag: string,
    argCount: number,
    reqOpts: string[],
    f: (a: [string[], CommandOptionDict]) => A
): (name: string, args: string[], opts: CommandOptionDict) => CommandAbs<A> {
    return (name, args, opts) =>
        name != tag ?
            O.none
            : O.some(pipe(
                [args, opts] as [string[], CommandOptionDict],
                ([args, opts]) => [
                    ensureSize(argCount)(args),
                    ensureOpts(reqOpts)(opts)
                ] as [
                        E.Either<Error, string[]>,
                        E.Either<Error, CommandOptionDict>
                    ],
                (x) => sequenceT(e)(...x),
                E.map(f)
            ));

}

export const comm1: CommandConstructor<Command1> = getConstructor(
    "comm1",
    1,
    ["o1", "o2"],
    ([args, opts]) => ({
        _tag: "comm1",
        arg: args[0],
        o1: opts["o1"][0],
        o2: opts["o2"][0]
    })
)

export type CommandConstructor<A> = (name: string, args: string[], opts: CommandOptionDict) => CommandAbs<A>;
export type CommandOption = { name: string, values: string[] }
export type CommandOptionDict = Record<string, string[]>

const e: Applicative2<E.URI> = {
    URI: E.URI,
    ap: (fab, fa) => E.ap(fa)(fab),
    map: (fa, f) => E.map(f)(fa),
    of: E.of
}

export function ensureOpts(optNames: string[]): (d: CommandOptionDict) => E.Either<Error, CommandOptionDict> {
    return d => pipe(
        optNames,
        A.map(optName => [optName, d[optName]] as [string, string[] | undefined]),
        A.map(([optName, opt]) => E.fromNullable(Error(`Option ${optName} is missing`))(opt)),
        A.sequence(e),
        E.map(_ => d)
    );
}

function ensureSize(n: number): (ss: string[]) => E.Either<Error, string[]> {
    return ss => pipe(
        ss,
        E.fromPredicate(
            (x) => x.length == n,
            () => Error("Invalid number of args")
        )
    );
}


export const comm3: CommandConstructor<Command3> = getConstructor(
    "comm3",
    1,
    ["req"],
    ([args, opts]) => ({
        _tag: "comm3",
        arg: args[0],
        req: opts["req"][0],
        opt: pipe(
            O.fromNullable(opts["opt"]),
            O.map(opt => opt[0])
        )

    })
)

export const comm4: CommandConstructor<Command4> = getConstructor(
    "comm4",
    2,
    ["opt1", "opt2"],
    ([args, opts]) => ({
        _tag: "comm4",
        arg1: args[0],
        arg2: args[1],
        opt1: opts["opt1"][0],
        opt2: opts["opt2"][0]
    })
)

export const comm2: CommandConstructor<Command2> = getConstructor(
    "comm2",
    1,
    ["o3", "o4"],
    ([args, opts]) => ({
        _tag: "comm2",
        arg: args[0],
        o3: opts["o3"][0],
        o4: opts["o4"][0]
    })
)


export const comms = [comm1, comm2, comm3]

export function foldSpecific<X>(handlers: {
    onNone: () => X,
    onError: (e: Error) => X,
    onCommand1: (c1: Command1) => X,
    onCommand2: (c2: Command2) => X,
    onCommand3: (c3: Command3) => X,
    onCommand4: (c4: Command4) => X
}): (c: Command) => X {
    return fold4({ isC1: isCommand1, isC2: isCommand2, isC3: isCommand3, isC4: isCommand4 },
        {
            onNone: handlers.onNone, onError: handlers.onError,
            onC1: handlers.onCommand1, onC2: handlers.onCommand2, onC3: handlers.onCommand3,
            onC4: handlers.onCommand4
        })

}


export function fold4<X, C1, C2, C3, C4>(
    preds: {
        isC1: (c: C1 | C2 | C3 | C4) => c is C1,
        isC2: (c: C1 | C2 | C3 | C4) => c is C2,
        isC3: (c: C1 | C2 | C3 | C4) => c is C3,
        isC4: (c: C1 | C2 | C3 | C4) => c is C4
    },
    handlers: {
        onNone: () => X,
        onError: (e: Error) => X,
        onC1: (c1: C1) => X,
        onC2: (c2: C2) => X,
        onC3: (c3: C3) => X,
        onC4: (c4: C4) => X
    }): (c: O.Option<E.Either<Error, C1 | C2 | C3 | C4>>) => X {
    return c => pipe(
        c,
        O.fold(
            handlers.onNone,
            E.fold(
                handlers.onError,
                c => preds.isC1(c)
                    ? handlers.onC1(c)
                    : preds.isC2(c)
                        ? handlers.onC2(c) :
                        preds.isC3(c)
                            ? handlers.onC3(c) :
                            handlers.onC4(c)
            )
        )
    )

}

export function isCommand1(c: Command1 | Command2 | Command3 | Command4): c is Command1 {
    return c._tag == "comm1"
}
export function isCommand2(c: Command1 | Command2 | Command3 | Command4): c is Command2 {
    return c._tag == "comm2"
}
export function isCommand3(c: Command1 | Command2 | Command3 | Command4): c is Command3 {
    return c._tag == "comm3"
}
export function isCommand4(c: Command1 | Command2 | Command3 | Command4): c is Command4 {
    return c._tag == "comm4"
}
