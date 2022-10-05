import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'

export function loadJson(fn) {
    let filename = env.path("home", `.yaru/${fn}`)
    let result = undefined
    if (sys.fs.statSync(filename)) {
        var cfg = sys.fs.readFileSync(filename)
        if (cfg) {
            result = JSON.parse(sciter.decode(cfg))
        }
    }
    return result
}

export function saveJson(data, fn) {
    let folder = env.path("home", ".yaru")
    if (!sys.fs.statSync(folder)) {
        sys.fs.mkdirSync(folder)
    }
    let filename = env.path("home", `.yaru/${fn}`)
    let f = sys.fs.sync.open(filename, "w")
    if (f) {
        f.writeSync(JSON.stringify(data))
        f.closeSync()
        return true
    } else{
        return false
    }
}