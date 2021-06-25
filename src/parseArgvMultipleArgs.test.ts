import { getAllOptionList, getOptionDict } from "./fpclparser"
import { CommandOptionDict, ensureOpts } from "./command"
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as A from "fp-ts/lib/Array";
import { sequenceT } from "fp-ts/lib/Apply"
import { Applicative2 } from "fp-ts/lib/Applicative"

interface CommandWithMultipleArgs {
    _tag: "commwithmultipleargs",
    arg1: string,
    arg2: string,
    opt1: string,
    opt2: string
}

type Command = O.Option<E.Either<Error, CommandWithMultipleArgs>>

type CommMultipleArgs = (name: string, args: string[], opts: CommandOptionDict) => Command;

function parseArgvMultipleArgs(argv: Array<string>, comms: CommMultipleArgs[]): Command {
    return pipe(
        comms,
        A.map(comm => comm(argv[0], getArgs(argv), getOptionDict(getAllOptionList(argv)))),
        x => A.filter(O.isSome)(x),
        x => A.isEmpty(x) ? O.none : x[0]
    );
}

const e: Applicative2<E.URI> = {
    URI: E.URI,
    ap: (fab, fa) => E.ap(fa)(fab),
    map: (fa, f) => E.map(f)(fa),
    of: E.of
}

function ensureSize(n: number): (ss: string[]) => E.Either<Error, string[]> {
    return ss => pipe(
        ss,
        E.fromPredicate(
            (x) => x.length == 2,
            () => Error("Invalid number of args")
        )
    )
}

const commWithMultipleArgs: CommMultipleArgs = (name, args, opts) => {
    return name != "commwithmultipleargs" ?
        O.none
        : O.some(pipe(
            [args, opts] as [string[], CommandOptionDict],
            ([args, opts]) => [
                ensureSize(2)(args),
                ensureOpts(["opt1", "opt2"])(opts)] as [
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
        ))
}


describe("commWithMultipleArgs", () => {
    test("command name valid, args valid, all options valid", () => {
        pipe(
            commWithMultipleArgs("commwithmultipleargs", ["arg1", "arg2"], { opt1: ["asd"], opt2: ["qewr"] }),
            a => {
                expect(a).toEqual(
                    O.some(
                        E.right({
                            _tag: "commwithmultipleargs",
                            arg1: "arg1",
                            arg2: "arg2",
                            opt1: "asd",
                            opt2: "qewr"
                        } as CommandWithMultipleArgs)))
            }
        )
    })

    test("command name valid, args valid, option opt1 is missing", () => {
        pipe(
            commWithMultipleArgs("commwithmultipleargs", ["arg1", "arg2"], { opt2: ["qewr"] }),
            er => { expect(er).toEqual(O.some(E.left(Error("Option opt1 is missing")))) }
        )
    })

    test("command name valid, args valid, option opt2 is missing", () => {
        pipe(
            commWithMultipleArgs("commwithmultipleargs", ["arg1", "arg2"], { opt1: ["qewr"] }),
            er => { expect(er).toEqual(O.some(E.left(Error("Option opt2 is missing")))) }
        )
    })

    test("command name valid, args valid, option opt1 and opt2 are missing", () => {
        pipe(
            commWithMultipleArgs("commwithmultipleargs", ["arg1", "arg2"], {}),
            er => { expect(er).toEqual(O.some(E.left(Error("Option opt1 is missing")))) }
        )
    })


    test("command name invalid, args valid, all options valid", () => {
        pipe(
            commWithMultipleArgs("invalidcommand", ["arg1", "arg2"], { opt1: ["opt1"], opt2: ["qewr"] }),
            x => { expect(x).toEqual(O.none) }
        )
    })

    test("command name invalid, no args, all options valid", () => {
        pipe(
            commWithMultipleArgs("commwithmultipleargs", [], { opt1: ["opt1"], opt2: ["qewr"] }),
            x => {
                expect(x).toEqual(
                    O.some(E.left(Error("Invalid number of args"))))
            }
        )
    })

    test("command name invalid, one arg, all options valid", () => {
        pipe(
            commWithMultipleArgs("commwithmultipleargs", ["arg1"], { opt1: ["opt1"], opt2: ["qewr"] }),
            x => {
                expect(x).toEqual(
                    O.some(E.left(Error("Invalid number of args"))))
            }
        )
    })

    test("command name invalid, 3 args, all options valid", () => {
        pipe(
            commWithMultipleArgs("commwithmultipleargs", ["arg1"], { opt1: ["opt1"], opt2: ["qewr"] }),
            x => {
                expect(x).toEqual(
                    O.some(E.left(Error("Invalid number of args"))))
            }
        )
    })

})



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
        )
    }

    return pipe(
        argv,
        O.fromPredicate(() => argv.length > 1),
        O.fold(
            () => [],
            argv => sliceToTheFirstOption(argv.slice(1))
        )
    )
}

describe("parseArgvMultipleArgs", () => {
    test("commWithMultipleArgs", () => {
        const argv: string[] = ["commwithmultipleargs", "arg1", "arg2", "--opt1", "opt1-value", "--opt2", "opt2-value"]
        expect(parseArgvMultipleArgs(argv, [commWithMultipleArgs])).toEqual(
            commWithMultipleArgs("commwithmultipleargs", getArgs(argv), getOptionDict(getAllOptionList(argv)))
        )
    })
})


describe("getArgs", () => {
    test("empty argv", () => {
        const argv: string[] = []
        expect(getArgs(argv)).toEqual(
            []
        )
    })

    test("one element argv", () => {
        const argv: string[] = ["commandname"]
        expect(getArgs(argv)).toEqual(
            []
        )
    })

    test("command name + one arg", () => {
        const argv: string[] = ["commandname", "arg"]
        expect(getArgs(argv)).toEqual(
            ["arg"]
        )
    })

    test("command name + 2 args", () => {
        const argv: string[] = ["commandname", "arg1", "arg2"]
        expect(getArgs(argv)).toEqual(
            ["arg1", "arg2"]
        )
    })

    test("command name + 1 arg + 1 opt", () => {
        const argv: string[] = ["commandname", "arg", "--opt", "val"]
        expect(getArgs(argv)).toEqual(
            ["arg"]
        )
    })

    test("command name + 0 args + 2 opts", () => {
        const argv: string[] = ["commandname", "--opt", "val1", "val2"]
        expect(getArgs(argv)).toEqual(
            []
        )
    })

    test("command name + multiple args + multiple commands opts", () => {
        const argv: string[] = ["commandname", "arg1", "arg2", "arg3", "arg4", "arg5",
            "--opt1", "val1", "val2",
            "--opt2", "val1", "val2"]
        expect(getArgs(argv)).toEqual(
            ["arg1", "arg2", "arg3", "arg4", "arg5"]
        )
    })

})

function isOption(s: string) {
    return s.startsWith("--");
}
