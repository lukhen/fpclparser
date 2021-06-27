import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import { sequenceT } from "fp-ts/lib/Apply";
import * as A from "fp-ts/lib/Array"
import { Applicative2 } from "fp-ts/lib/Applicative";
import { CommMultipleArgs } from "./fpclparser"

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
export interface CommandWithMultipleArgs {
    _tag: "commwithmultipleargs";
    arg1: string;
    arg2: string;
    opt1: string;
    opt2: string;
}

export type CommandX = O.Option<E.Either<Error, CommandWithMultipleArgs>>;
export type Command = O.Option<E.Either<Error, Command1 | Command2 | Command3>>
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


export function comm3(name: string, arg: string, opts: CommandOptionDict): O.Option<E.Either<Error, Command3>> {
    return name != "comm3" ?
        O.none
        : O.some(pipe(
            opts,
            ensureOpts(["req"]),
            E.map(
                a => ({
                    _tag: "comm3",
                    arg: arg,
                    req: a["req"][0],
                    opt: pipe(
                        O.fromNullable(a["opt"]),
                        O.map(opt => opt[0])
                    )
                })
            )
        ))
}

export const commWithMultipleArgs: CommMultipleArgs = (name, args, opts) => {
    return name != "commwithmultipleargs" ?
        O.none
        : O.some(pipe(
            [args, opts] as [string[], CommandOptionDict],
            ([args, opts]) => [
                ensureSize(2)(args),
                ensureOpts(["opt1", "opt2"])(opts)
            ] as [
                    E.Either<Error, string[]>,
                    E.Either<Error, CommandOptionDict>
                ],
            (x) => sequenceT(e)(...x),
            E.map(
                ([args, opts]: [any, any]) => ({
                    _tag: "commwithmultipleargs",
                    arg1: args[0],
                    arg2: args[1],
                    opt1: opts["opt1"][0],
                    opt2: opts["opt2"][0]
                })
            )
        ));
};


export function comm1(name: string, arg: string, opts: CommandOptionDict): O.Option<E.Either<Error, Command1>> {
    return name != "comm1" ?
        O.none
        : O.some(pipe(
            opts,
            ensureOpts(["o1", "o2"]),
            E.map(
                a => ({
                    _tag: "comm1",
                    arg: arg,
                    o1: a["o1"][0],
                    o2: a["o2"][0]
                })
            )
        ))
}

export function comm2(name: string, arg: string, opts: CommandOptionDict): O.Option<E.Either<Error, Command2>> {
    return name != "comm2" ?
        O.none
        : O.some(pipe(
            opts,
            ensureOpts(["o3", "o4"]),
            E.map(
                a => ({
                    _tag: "comm2",
                    arg: arg,
                    o3: a["o3"][0],
                    o4: a["o4"][0]
                })
            )
        ))
}

export const comms = [comm1, comm2, comm3]

export function fold<X>(handlers: {
    onNone: () => X,
    onError: (e: Error) => X,
    onCommand1: (c1: Command1) => X,
    onCommand2: (c2: Command2) => X,
    onCommand3: (c3: Command3) => X
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
                            handlers.onCommand3(c)
            )
        )
    )

}
