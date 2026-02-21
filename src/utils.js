import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'
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
        return URL.toPath(env.path("home", `.yaru/${fn}`))
    } else {
        return URL.toPath(env.path("home", '.yaru'))
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

export function makeRsycCmd(t, strOptions = null) {
    if (!t.enabled) return null
    let args = [checkRsync()]
    args.push(...uswitch.cvtSwitches2Str(t.params, true))
    if (strOptions)
        args.push(strOptions)
    if (t.exclude) {
        args.push("-C")
        env.variable("CVSIGNORE", t.exclude)
    }
    // Auth suffixes (handles both SSH '-e ssh' and Rsync '--port')
    // Suffixes must come BEFORE src/dst paths
    const srcSuffix = uconfig.genAuthSurfixes(t.authsrc) || []
    const dstSuffix = uconfig.genAuthSurfixes(t.authdst) || []

    if (srcSuffix.length > 0) args.push(...srcSuffix)
    
    for (let i = 0; i < dstSuffix.length; i++) {
        // avoid adding '-e' twice if src already added it
        if (dstSuffix[i] === '-e' && srcSuffix.includes('-e')) {
            i++ // skip `-e` and its argument
        } else {
            args.push(dstSuffix[i])
        }
    }
    args.push(uconfig.genAuthPrefix(t.authsrc) + cvtPath2Rsync(t.src))
    args.push(uconfig.genAuthPrefix(t.authdst) + cvtPath2Rsync(t.dst))
    return args
}

export function makeDaemonCmd() {
    let cfgfile = uconfig.genDaemonConf()
    if (!cfgfile) return undefined

    if (env.PLATFORM === "Windows")
        cfgfile = cfgfile.replace(/\//g, "\\")
    let args = [checkRsync()]
    args.push("--daemon")
    args.push(`--config=${cvtPath2Rsync(cfgfile)}`)
    args.push("--no-detach")

    return args
}

export async function pipeReader(pipe, name, fnNewLine) {
    try {
        // Raw byte accumulator — keeps partial multi-byte chars safe across chunks
        let pending = [];

        while (pipe.fileno()) {
            const chunk = await pipe.read();
            if (!chunk || !chunk.byteLength) continue;

            const bytes = new Uint8Array(chunk);
            let lineStart = 0;

            for (let i = 0; i < bytes.length; i++) {
                if (bytes[i] === 10) { // 0x0A = '\n'
                    for (let j = lineStart; j < i; j++) pending.push(bytes[j]);
                    // strip trailing \r (CRLF)
                    if (pending.length > 0 && pending[pending.length - 1] === 13) pending.pop();
                    const line = sciter.decode(new Uint8Array(pending).buffer, "utf-8");
                    if (fnNewLine) fnNewLine(line, "msg");
                    pending = [];
                    lineStart = i + 1;
                }
            }
            // bytes without a newline yet — accumulate for next chunk
            for (let j = lineStart; j < bytes.length; j++) pending.push(bytes[j]);
        }

        // flush remaining bytes (last line without trailing newline)
        if (pending.length > 0) {
            if (pending[pending.length - 1] === 13) pending.pop();
            const line = sciter.decode(new Uint8Array(pending).buffer, "utf-8");
            if (fnNewLine) fnNewLine(line, "msg");
        }
    } catch (e) {
        // pipe closed or process exited — normal exit
    }
}

export async function getLocalIP() {
    var ret = []
    function fnNewLine(cline, cls) {
        cline = cline.trim()
        if (env.PLATFORM === "Windows") {
            if (cline.startsWith("IPv4 Address")) {
                let pos = cline.indexOf(":")
                if (pos >= 0) {
                    ret.push(cline.substring(pos + 1).trim())
                }
            }
        } else {
            if (cline.startsWith("inet ")) {
                let pos = cline.indexOf("netmask")
                let strip = cline.substring(5, pos).trim()
                ret.push(strip)
            }
        }
    }

    let cmds
    if (env.PLATFORM === "Windows")
        cmds = ["ipconfig"]
    else
        cmds = ["ifconfig"]

    try {
        let proc = sys.spawn(cmds, { stdout: "pipe", stderr: "pipe" })
        let po = pipeReader(proc.stdout, "stdout", fnNewLine)
        let pe = pipeReader(proc, "stderr", fnNewLine)

        var r = await proc.wait()
        proc.stderr.close()
        proc.stdout.close()
        // await po
        // await pe
    } catch (ex) {

    }

    return ret
}

export function lang(str) {

}

export function checkRsync() {
    if (env.PLATFORM == "Windows") {
        let rsyncpath = URL.toPath(env.home("cwrsync/bin"))
        let rsyncbin = rsyncpath + "/rsync.exe"
        if (!sys.fs.statSync(rsyncbin)) {
            return null;
        }
        return rsyncbin
    }
    else if (env.PLATFORM == "OSX") {
        let rsyncpath = URL.toPath("/opt/homebrew/bin")
        let rsyncbin = rsyncpath + "/rsync"
        if (!sys.fs.statSync(rsyncbin)) {
            return null;
        }
        return rsyncbin
    }
    return null;
}