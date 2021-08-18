import { CommandConstructor, CommandMeta, CommandOptionDict, InnerConstructor, getConstructor, parseArgv } from "./fpclparser"
import * as C from "./fpclparser"
import * as E from "fp-ts/lib/Either"
import { pipe } from "fp-ts/lib/function"
import { sequenceT } from "fp-ts/lib/Apply"
import * as O from "fp-ts/lib/Option"

/**
   Assignment: 
   We need a command line tool that adds 2 numbers:
    command: sum 2 4
    output: 6

    sum    2     4

     ^     ^     ^
   _tag   arg0  arg1 
**/

interface Sum {
    _tag: "sum",
    n1: number,
    n2: number,
    verbose: boolean
}

/**
   First let's define InnerConstructor for Sum
**/

const sumInnerConstructor: C.InnerConstructor<Sum> = function([name, args, opts]) {
    return pipe(
        [+args[0], +args[1]],
        ([n1, n2]) => [
            E.fromPredicate((n: number) => !isNaN(n), x => ["first is not a number"])(n1),
            E.fromPredicate((n: number) => !isNaN(n), x => ["second is not a number"])(n2),
        ] as [
                E.Either<string[], number>,
                E.Either<string[], number>
            ],
        x => sequenceT(C.e)(...x),
        E.map(
            ([n1, n2]) => ({
                _tag: "sum",
                n1: n1,
                n2: n2,
                verbose: !(opts["verbose"] == undefined)
            })
        ))
}

/**
   Now CommandMeta
**/


const sumMeta: C.CommandMeta<Sum> = {
    tagOfA: "sum",
    argCount: 2,
    reqOpts: [],
    innerConstructor: sumInnerConstructor
}


const sumConstr: C.CommandConstructor<Sum> = C.getConstructor(sumMeta)

type Command = Sum


const c: E.Either<string[], Command> = C.parseArgv<Command>([sumConstr])(process.argv.slice(2))

const p = E.fold(
    (s: string[]) => () => { console.log(s) },
    (c: Command) => () => { c.verbose ? console.log(`verbose ${c.n1 + c.n2}`) : console.log(c.n1 + c.n2) }
)(c)

p()
