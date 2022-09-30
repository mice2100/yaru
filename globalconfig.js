import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'

export var configs = {}
const conffile = env.path("home", ".yaru/cfg.json")

export function loadCfg() {
    if (sys.fs.statSync(conffile)) {
        var cfgjson = sys.fs.readFileSync(conffile)
        if (cfgjson) {
            configs = JSON.parse(sciter.decode(cfgjson))
        }
    }
    if (!configs.ssh) {
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

}

export async function genSSHKey() {
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

export async function sshCopyId(auth) {
    let fn = configs.ssh.sshroot+"/id_rsa.pub"
    if (!sys.fs.statSync(fn)) {
        return false
    }
    
    // if (env.PLATFORM=="Windows") fn = fn.replace(/\//g, "\\")
    try {
        let plink = env.path("downloads", "putty/plink.exe")
        console.log(fn, plink)
        
        let args = [plink, `${auth.user}@${auth.host}`, "-pw", auth.passwd, "<", fn, "cat >>.ssh/authorized_keys"]
        console.log(args)
        env.exec(plink, `${auth.user}@${auth.host}`, "-pw", auth.passwd, "<", fn, "cat >>.ssh/authorized_keys")
    } catch (e) {
        console.error(e.message)
    }
}