import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'
import * as utils from './utils'

export var configs = {}
export function loadCfg() {
    let cfg = utils.loadJson("cfg.json")
    if (cfg) configs = cfg
    if (configs && !configs.ssh) {
        configs.ssh = {"sshroot": env.path("home", ".ssh")}
        if (!sys.fs.statSync(configs.ssh.sshroot+"/id_rsa") || 
            !sys.fs.statSync(configs.ssh.sshroot+"/id_rsa.pub")
        ) {
            configs.ssh.keyexists = false
        } else {
            configs.ssh.keyexists = true
        }
    }
}

export function saveCfg() {
    return utils.saveJson(configs, "cfg.json")
}

export async function genSSHKey() {
    if (!sys.fs.statSync(configs.ssh.sshroot)) {
        sys.fs.mkdirSync(configs.ssh.sshroot)
    }
    let fn = configs.ssh.sshroot+"/id_rsa.pub"
    if (sys.fs.statSync(fn)) {
        sys.fs.unlink(fn)
    }
    fn = configs.ssh.sshroot+"/id_rsa"
    if (sys.fs.statSync(fn)) {
        sys.fs.unlink(fn)
    }

    var process = sys.spawn(["ssh-keygen", "-t", "rsa", "-N","", "-f", fn])
    await process.wait()
}

export function sshCopyId(auth) {
    let fn = configs.ssh.sshroot+"/id_rsa.pub"
    if (!sys.fs.statSync(fn)) {
        return false
    }
    
    // if (env.PLATFORM=="Windows") fn = fn.replace(/\//g, "\\")
    try {
        // let plink = env.path("downloads", "putty/plink.exe")
        let plink = "ssh"
        
        let args = [plink, `${auth.user}@${auth.host}`, "<", fn, '"cat >>.ssh/authorized_keys"']
        let cmd = args.join(" ")
        // console.log(cmd)
        // Clipboard.writeText(cmd)
        // env.exec("cmd")
        return cmd
    } catch (e) {
        console.error(e.message)
        return ""
    }
}