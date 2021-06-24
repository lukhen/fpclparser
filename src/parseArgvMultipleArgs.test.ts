import { getAllOptionList, getOptionDict } from "./fpclparser"
import { CommandOptionDict } from "./command"
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as A from "fp-ts/lib/Array";

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

// !!!
const commWithMultipleArgs: CommMultipleArgs = (name, args, opts) => {
    return O.some(E.right({
        _tag: "commwithmultipleargs",
        arg1: "",
        arg2: "",
        opt1: "",
        opt2: ""
    }))
}


// !!!
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
        const argv: string[] = ["commWithMultipleArgs", "arg1", "arg2", "--opt1", "--opt2"]
        expect(parseArgvMultipleArgs(["commwithmultipleargs"], [commWithMultipleArgs])).toEqual(
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


})

function isOption(s: string) {
    return s.startsWith("--");
}
