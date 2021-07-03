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

export const comm1: CommandConstructor = getConstructor<Command1>(
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

export type CommandConstructor = (name: string, args: string[], opts: CommandOptionDict) => Command;
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


export const comm3: CommandConstructor = getConstructor<Command3>(
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

export const comm4: CommandConstructor = getConstructor<Command4>(
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

export const comm2: CommandConstructor = getConstructor<Command2>(
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

export function fold<X>(handlers: {
    onNone: () => X,
    onError: (e: Error) => X,
    onCommand1: (c1: Command1) => X,
    onCommand2: (c2: Command2) => X,
    onCommand3: (c3: Command3) => X,
    onCommand4: (c4: Command4) => X
}): (c: Command) => X {
    return c => pipe(
        c,
        O.fold(
            handlers.onNone,
            E.fold(
                handlers.onError,
                c => c._tag == "comm1"
                    ? handlers.onCommand1(c)
                    : c._tag == "comm2"
                        ? handlers.onCommand2(c) :
                        c._tag == "comm3"
                            ? handlers.onCommand3(c) :
                            handlers.onCommand4(c)
            )
        )
    )

}
