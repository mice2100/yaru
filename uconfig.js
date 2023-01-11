import * as sys from '@sys'
import * as env from '@env'
import * as utils from './utils'

export var configs = {}
var loaded = false;
export function loadCfg() {
    // if (loaded) return //So we won't add path multiple times
    let cfg = utils.loadJson("cfg.json")
    if (cfg) Object.assign(configs, cfg)
    if (!configs.ssh) {
        configs.ssh = { "sshroot": env.path("home", ".ssh") }
    }
    if (!sys.fs.statSync(configs.ssh.sshroot + "/id_rsa") ||
        !sys.fs.statSync(configs.ssh.sshroot + "/id_rsa.pub")
    ) {
        configs.ssh.keyexists = false
    } else {
        configs.ssh.keyexists = true
    }

    if(!configs.daemon) {
        configs.daemon = {modules: []}
    }
    if (env.PLATFORM=="Windows") {
        let envpath = env.variable("path")
        // let rsyncpath = env.path("downloads", "cwrsync/bin")
        let rsyncpath = URL.toPath(__DIR__+"cwrsync/bin")
        // console.log(rsyncpath)
        if (envpath.indexOf(rsyncpath) ==-1 ) {
            env.variable("path", `${rsyncpath};${envpath};`)
            // env.variable("home", env.path("home"))
        }
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

export function newDaemonModule() {
    let newModule = {module:"modulename", path:"path", readonly: false, writeonly: false}
    if(configs.daemon.modules.length==0){
        newModule.module = "home"
        newModule.path = URL.toPath(env.path("home"))
    }
    configs.daemon.modules.push(newModule)
    return configs.daemon.modules.length-1
}

export function genDaemonConf(){
    if(configs.daemon.modules==0) return undefined
    let fn = utils.getDataPath("rsyncd.conf", true)
    let f = sys.fs.sync.open(fn, "w")

    for(let m of configs.daemon.modules){
        f.writeSync(`[${m.module}]\n`)
        f.writeSync(`  path = ${utils.cvtPath2Rsync(m.path)}\n`)
        f.writeSync(`  read only = ${m.readonly}\n`)
        f.writeSync(`  write only = ${m.writeonly}\n\n`)
    }
    f.closeSync()
    return fn
}