import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'
import * as utils from './utils'

export var configs = {}
var loaded = false;
export function loadCfg() {
    if (loaded) return //So we won't add path multiple times
    let cfg = utils.loadJson("cfg.json")
    if (cfg) configs = cfg
    if (configs && !configs.ssh) {
        configs.ssh = { "sshroot": env.path("home", ".ssh") }
    }
    if (!sys.fs.statSync(configs.ssh.sshroot + "/id_rsa") ||
        !sys.fs.statSync(configs.ssh.sshroot + "/id_rsa.pub")
    ) {
        configs.ssh.keyexists = false
    } else {
        configs.ssh.keyexists = true
    }
    if (env.PLATFORM=="Windows") {
        let envpath = env.variable("path")
        env.variable("path", `${env.path("documents", "cwRsync/bin")};${envpath};`)
        env.variable("HOME", env.path("home"))
        env.variable("CYGWIN", "disable_pcon")
        // env.variable("disable_pcon", "0")
    }
    loaded = true
}

export function saveCfg() {
    return utils.saveJson(configs, "cfg.json")
}

export async function genSSHKey() {
    if (!sys.fs.statSync(configs.ssh.sshroot)) {
        sys.fs.mkdirSync(configs.ssh.sshroot)
    }
    let fn = configs.ssh.sshroot + "/id_rsa.pub"
    if (sys.fs.statSync(fn)) {
        sys.fs.unlink(fn)
    }
    fn = configs.ssh.sshroot + "/id_rsa"
    if (sys.fs.statSync(fn)) {
        sys.fs.unlink(fn)
    }

    var process = sys.spawn(["ssh-keygen", "-t", "rsa", "-N", "", "-f", fn])
    await process.wait()
    if (!sys.fs.statSync(configs.ssh.sshroot + "/id_rsa") ||
        !sys.fs.statSync(configs.ssh.sshroot + "/id_rsa.pub")
    ) {
        configs.ssh.keyexists = false
    } else {
        configs.ssh.keyexists = true
    }
}

export function sshCopyId(auth) {
    let fn = configs.ssh.sshroot + "/id_rsa.pub"
    if (!sys.fs.statSync(fn)) {
        return ""
    }

    try {
        let args = ["ssh", `${auth.user}@${auth.host}`, "<", fn, '"cat >>.ssh/authorized_keys"']
        let cmd = args.join(" ")
        return cmd
    } catch (e) {
        console.error(e.message)
        return ""
    }
}