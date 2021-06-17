import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as A from "fp-ts/lib/Array";
import * as R from "fp-ts/lib/Record";
import {
    Command, CommandMetas,
    CommandOption,
    CommandOptionDict
} from "./command";

export function parseArgv(argv: Array<string>, cms: CommandMetas): E.Either<Error, Command> {
    return pipe(
        cms[argv[0]],
        O.fromNullable,
        E.fromOption(() => Error("Invalid command")),
        E.chain(cm => cm.constructor(argv[1], ...A.map(getOpt(argv))(cm.optNames)))
    );
}
type Comm = (name: string, arg: string, opts: CommandOptionDict) => O.Option<E.Either<Error, Command>>;

export function parseArgv2(argv: Array<string>, comms: Comm[]): O.Option<E.Either<Error, Command>> {
    return pipe(
        comms,
        A.map(comm => comm(argv[0], argv[1], getOptionDict(getAllOptionList(argv)))),
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