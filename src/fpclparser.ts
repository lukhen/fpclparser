import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as A from "fp-ts/lib/Array";
import * as R from "fp-ts/lib/Record";
import {
    CommandOption,
    CommandOptionDict,
    CommandConstructor,
    CommandAbs
} from "./command";



export function parseArgv<A>(argv: Array<string>, comms: CommandConstructor<any>[]): CommandAbs<A> {
    return pipe(
        comms,
        A.map(comm => comm(argv[0], getArgs(argv), getOptionDict(getAllOptionList(argv)))),
        x => A.filter(O.isSome)(x),
        x => A.isEmpty(x) ? O.none : x[0]
    );
}


export function getAllOptionList(argv: string[]): CommandOption[] {
    return pipe(
        argv,
        A.reduce(
            [],
            (soFar: CommandOption[], nextEl) => pipe(
                nextEl,
                E.fromPredicate(el => el.startsWith("--"), el => el),
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
export function explodeTailTip<A>(arr: Array<A>): { body: Array<A>; tailTip: O.Option<A>; } {
    return { body: arr.slice(0, arr.length - 1), tailTip: O.fromNullable(arr[arr.length - 1]) };
}
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
