import { pipe } from "fp-ts/lib/function"
import * as C from "./command"
import { parseArgv2 } from "./fpclparser"

const x = pipe(
    process.argv.slice(2),
    args => parseArgv2(args, C.comms),
    C.fold({
        onNone: () => () => { console.log("no command") },
        onError: e => () => { console.log(e.message) },
        onCommand1: c => () => { console.log(c._tag) },
        onCommand2: c => () => { console.log(c._tag) },
        onCommand3: c => () => { console.log(c.arg) }
    })
)

x()
