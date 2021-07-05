import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as A from "fp-ts/lib/Array";
import * as R from "fp-ts/lib/Record";
import { sequenceT } from "fp-ts/lib/Apply";
import { Applicative2 } from "fp-ts/lib/Applicative";



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

export type CommandAbs<A> = O.Option<E.Either<Error, A>>;

export function getConstructor<A>(
    tag: string,
    argCount: number,
    reqOpts: string[],
    f: (a: [string[], CommandOptionDict]) => A
): CommandConstructor<A> {
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
    }): (c: CommandAbs<C1 | C2 | C3 | C4>) => X {
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

export function fold1<X, C1>(
    handlers: {
        onNone: () => X,
        onError: (e: Error) => X,
        onC1: (c1: C1) => X,
    }): (c: CommandAbs<C1>) => X {
    return c => pipe(
        c,
        O.fold(
            handlers.onNone,
            E.fold(
                handlers.onError,
                c => handlers.onC1(c)
            )
        )
    )

}
