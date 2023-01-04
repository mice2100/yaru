import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'
import * as auth from "./uauth"

const EOL = "\n"

export function getDataPath(fn="", force = false) {
    if (force) {
        let folder = env.path("home", ".yaru")
        if (!sys.fs.statSync(folder)) {
            sys.fs.mkdirSync(folder)
        }
    }
    if(fn){
        return env.path("home", `.yaru/${fn}`)
    } else{
        return env.path("home", '.yaru')
    }
}

export function loadJson(fn) {
    let filename = getDataPath(fn)
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

    let filename = getDataPath(fn, true)
    let f = sys.fs.sync.open(filename, "w")
    if (f) {
        f.writeSync(JSON.stringify(data))
        f.closeSync()
        return true
    } else {
        return false
    }
}

function cvtPath2Cgy(strPath) {
    if (env.PLATFORM === 'Windows' && strPath[1] == ':' && strPath[2] == '/')
        return `/cygdrive/${strPath[0]}/${strPath.substring(3)}`
    else
        return strPath
}

export function makeRsycCmd(t, strOptions = null) {
    if (!t.enabled) return null
    let args = ["rsync"]
    args.push(...t.params)
    if (strOptions)
        args.push(strOptions)
    if (t.exclude) {
        args.push("-C")
        args.push("-f=!")
        sys.setenv("CVSIGNORE", t.exclude)
    }
    if (t.enabled) {
        args.push(cvtPath2Cgy(t.src))
        args.push(auth.genAuthPrefix(t.auth) + cvtPath2Cgy(t.dst))
        // out.append(<text>Starting task: {t.id}</text>)
    } else {
        args.push(auth.genAuthPrefix(t.auth) + cvtPath2Cgy(t.dst))
        args.push(cvtPath2Cgy(t.src))
    }
    return args
}

export async function pipeReader(pipe, name, fnNewLine) {
    try {
        var cline = "";
        reading: while (pipe) {
            var text = await pipe.read();
            text = sciter.decode(text);
            while (text) {
                var eolpos = text.indexOf(EOL);
                if (eolpos < 0) { cline += text; continue reading; }
                cline += text.substr(0, eolpos);
                text = text.substr(eolpos + EOL.length)
                if(fnNewLine) fnNewLine(cline, "msg")
                cline = "";
            }
        }
    } catch (e) {
        if (e.message != "socket is not connected")
            if(fnNewLine) fnNewLine(e.message, "error")
            // out.append(<text class="error">{e.message}</text>);
    }
}