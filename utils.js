import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'
import * as auth from "./uauth"
import * as uswitch from "./uswitch"
import * as uconfig from "./uconfig"

const EOL = "\n"

export function getDataPath(fn = "", force = false) {
    if (force) {
        let folder = env.path("home", ".yaru")
        if (!sys.fs.statSync(folder)) {
            sys.fs.mkdirSync(folder)
        }
    }
    if (fn) {
        return env.path("home", `.yaru/${fn}`)
    } else {
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

export function cvtPath2Rsync(strPath) {
    if (env.PLATFORM === 'Windows' && strPath[1] == ':' && strPath[2] == '/')
        return `/cygdrive/${strPath[0]}/${strPath.substring(3)}`
    else
        return strPath
}

export async function makeRsycCmd(t, strOptions = null) {
    if (!t.enabled) return null
    let args = ["rsync"]
    args.push(...uswitch.cvtSwitches2Str(t.params, true))
    if (strOptions)
        args.push(strOptions)
    if (t.exclude) {
        args.push("-C")
        args.push("-f=!")
        sys.setenv("CVSIGNORE", t.exclude)
    }
    let pwdf = await auth.genAuthPassfile(t.auth)
    if(pwdf) {
        console.log(pwdf)
    //     // args.push(pwd)
    }
    args.push(cvtPath2Rsync(t.src))
    args.push(auth.genAuthPrefix(t.auth) + cvtPath2Rsync(t.dst))
    // out.append(<text>Starting task: {t.id}</text>)
    return args
}

export function makeDaemonCmd() {
    let cfgfile = uconfig.genDaemonConf()
    if(!cfgfile) return undefined

    cfgfile = cfgfile.replace(/\//g, "\\")
    let args = ["rsync"]
    args.push("--daemon")
    args.push(`--config=${cvtPath2Rsync(cfgfile)}`)
    args.push("--no-detach")

    return args
}

export async function pipeReader(pipe, name, fnNewLine) {
    try {
        var cline = "";
        reading: while (pipe.fileno()) {
            var text = await pipe.read();
            text = sciter.decode(text);
            while (text) {
                var eolpos = text.indexOf(EOL);
                if (eolpos < 0) { cline += text; continue reading; }
                cline += text.substr(0, eolpos);
                text = text.substr(eolpos + EOL.length)
                if (fnNewLine) fnNewLine(cline, "msg")
                cline = "";
            }
        }
    } catch (e) {
        // if (e.message != "socket is not connected")
            // if (fnNewLine) fnNewLine(e.message, "error")
        // out.append(<text class="error">{e.message}</text>);
    }
}