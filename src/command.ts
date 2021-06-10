import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import { sequenceT } from "fp-ts/lib/Apply";

export interface Command1 {
    _tag: "comm1";
    arg: string;
    o1: string;
    o2: string;
}
// constructor
export function comm1(arg: string, o1: O.Option<Array<string>>, o2: O.Option<Array<string>>): E.Either<Error, Command1> {
    return pipe(
        sequenceT(O.option)(o1, o2),
        O.fold(
            () => E.left(Error("Option missing")),
            (x: Array<Array<string>>) => E.right({
                _tag: "comm1",
                arg,
                o1: x[0][0],
                o2: x[1][0]
            })
        )
    );
}
export interface Command2 {
    _tag: "comm2";
    arg: string;
    o3: string;
    o4: string;
}
// constructor
export function comm2(arg: string, o3: O.Option<Array<string>>, o4: O.Option<Array<string>>): E.Either<Error, Command2> {
    return pipe(
        sequenceT(O.option)(o3, o4),
        O.fold(
            () => E.left(Error("Option missing")),
            (x: Array<Array<string>>) => E.right({
                _tag: "comm2",
                arg,
                o3: x[0][0],
                o4: x[1][0]
            })
        )
    );
}
export interface Command3 {
    _tag: "comm3";
    arg: string;
    req: string;
    opt: O.Option<Array<string>>;
}
// constructor
export function comm3(arg: string, req: O.Option<Array<string>>, opt: O.Option<Array<string>>): E.Either<Error, Command3> {
    return pipe(
        req,
        O.fold(
            () => E.left(Error("Option missing")),
            (value: Array<string>) => E.right({
                _tag: "comm3",
                arg,
                req: value[0],
                opt: opt
            })
        )
    );
}

export type Command = Command1 | Command2 | Command3

export type CommandMetas = {
    [key: string]: {
        constructor: (arg: string, ...opts: Array<O.Option<Array<string>>>) => E.Either<Error, Command1 | Command2 | Command3>,
        optNames: Array<string>
    }
}

export const defaultCommandMetas: CommandMetas = {
    comm1: { constructor: comm1, optNames: ["o1", "o2"] },
    comm2: { constructor: comm2, optNames: ["o3", "o4"] },
    comm3: { constructor: comm3, optNames: ["req", "opt"] },
}

export type CommandOption = { name: string, values: string[] }
export type CommandOptionDict = Record<string, string[]>

export function xcomm1(name: string, arg: string, opts: CommandOptionDict): O.Option<E.Either<Error, Command1>> {
    return name != "comm1" ?
        O.none
        : O.some(E.right({
            _tag: "comm1",
            arg: arg,
            o1: opts["o1"][0],
            o2: opts["o2"][0]
        }))
}

export function xcomm2(name: string, arg: string, opts: CommandOptionDict): O.Option<E.Either<Error, Command2>> {
    return name != "comm2" ?
        O.none
        : O.some(E.right({
            _tag: "comm2",
            arg: arg,
            o3: opts["o3"][0],
            o4: opts["o4"][0]
        }))
}
