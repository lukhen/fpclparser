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
    return [argv[1]]
}

describe("parseArgvMultipleArgs", () => {
    test("commWithMultipleArgs", () => {
        const argv: string[] = []
        expect(parseArgvMultipleArgs(["commwithmultipleargs"], [commWithMultipleArgs])).toEqual(
            commWithMultipleArgs("commwithmultipleargs", getArgs(argv), getOptionDict(getAllOptionList(argv)))
        )
    })
})
