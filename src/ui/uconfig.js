import * as sys from '@sys'
import * as env from '@env'
import * as sctr from '@sciter'
import * as utils from './utils'

export var configs = {}

var loaded = false;
export function loadCfg() {
    // if (loaded) return //So we won't add path multiple times
    let ret = true
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

    configs.daemon = configs.daemon || {modules: []}
    configs.auths = configs.auths || []
    configs.taskList = configs.taskList || []
    if(configs.auths.length==0) {
        let a = newAuth()
        a.type = "local"

        a = newAuth()
        a.type = "ssh"
    }

    if (env.PLATFORM=="Windows") {
        let envpath = env.variable("path")
        // let rsyncpath = URL.toPath(__DIR__+"cwrsync/bin")
        let rsyncpath = URL.toPath(env.home("cwrsync/bin"))
        if (!sys.fs.statSync(rsyncpath)) {
            ret = false
        }
        else if (envpath.indexOf(rsyncpath) ==-1 ) {
            env.variable("path", `${rsyncpath};${envpath};`)
        }
    }
    loaded = true
    return ret
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
        let port = auth.port || 22
        let args = ["ssh", `${auth.user}@${auth.host}`, "-p", `${port}`, "<", fn, '"cat >>.ssh/authorized_keys"']
        let cmd = args.join(" ")
        return cmd
    } catch (e) {
        console.error(e.message)
        return ""
    }
}

export function sshPublicId() {
    let fn = configs.ssh.sshroot + "/id_rsa.pub"
    if (!sys.fs.statSync(fn)) {
        return ""
    }

    let cnt = sctr.decode(sys.fs.sync.readfile(fn))

    return cnt;
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
    if(configs.daemon.modules.length==0) return undefined
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

export function genAuthString(id) {
    id = id||1
    let auth = findAuth(id)
    switch (auth.type) {
        case 'ssh':
            return `ssh:${auth.user}@${auth.host}`
        case 'local':
            return 'local:'
        case 'rsync':
            return `rsync:${auth.user}@${auth.host}`
    }
}

export function genAuthPrefix(id) {
    let auth = findAuth(id)
    switch (auth.type) {
        case 'ssh':
            return `${auth.user}@${auth.host}:`
        case 'local':
            return ''
        case 'rsync':
            return `${auth.host}::`
    }
}

export function genAuthSurfixes(id) {
    let auth = findAuth(id)
    switch (auth.type) {
        case 'ssh':
            let port = auth.port || 22
            return ['-e', `ssh -p ${port}`];
        case 'local':
            return []
        case 'rsync':
            return []
    }
}

export async function genAuthPassfile(id) {
    var ret
    let auth = findAuth(id)
    if(auth &&auth.type=='rsync'){
        let fn = utils.getDataPath(`passwd.${id}`)
        if(sys.fs.statSync(fn)) {
            await sys.fs.unlink(fn)
        }
        let f = await sys.fs.open(fn, "w")
        await f.write(auth.passwd)
        await f.close()
        await sys.fs.chmod(fn, 600)
        ret = "--password-file="+fn
    }

    return ret
}

export function maxAuthID() {
    configs.auths.sort((a, b) => a.id - b.id)
    if (configs.auths.length <= 0) return 0
    return configs.auths[configs.auths.length - 1].id
}

export function findAuth(id) {
    return configs.auths.find(v => v.id == id)
}

export function newAuth() {
    let id = maxAuthID() + 1
    let a = { id: id, type: "ssh", host: "", user: "", passwd:"" }
    configs.auths.push(a)
    return a
}

export function removeAuth(id) {
    let idx = configs.auths.findIndex(v => v.id == id)
    if (idx != -1) {
        configs.auths.splice(idx, 1)
    }
}

export function findTask(id) {
    return configs.taskList.find(v=>v.id==id)
}

export function newTaskId() {
    configs.taskList.sort( (a, b) => a.id-b.id)
    if (configs.taskList.length>0)
        return configs.taskList[configs.taskList.length-1].id + 1
    else
        return 1
}

export function removeTask(id) {
    let idx = configs.taskList.findIndex( v=>v.id==id)
    if (idx!=-1) {
        configs.taskList.splice(idx, 1)
    }
}