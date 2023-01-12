import * as globalconfig from './uconfig'
import * as uauth from './uauth'
import * as env from '@env'
import * as sys from '@sys'

var processSSH
var elAuthTpl, elModuleTpl

function appendAuth(a) {
    let el = elAuthTpl.cloneNode()
    document.$("#authtbl").appendChild(el)
    el.setAttribute("data", a.id)
    el.$("#id").innerText = String(a.id)
    el.$("#itype").value = a.type
    el.$("#ihost").value = a.host
    el.$("#iuser").value = a.user
    el.$("#ipasswd").value = a.passwd
    el.$("#insauth").style.display = a.type === "ssh" ? 'inline-block' : 'none'
    el.$("#tstauth").style.display = a.type === "ssh" ? 'inline-block' : 'none'
    el.$("#ihost").style.display = a.type === "local" ? 'none' : 'inline-block'
    el.$("#iuser").style.display = a.type === "local" ? 'none' : 'inline-block'
    el.$("#ipasswd").style.display = a.type === "local" ? 'none' : 'inline-block'
}

function appendDaemonModule(idx) {
    let m = globalconfig.configs.daemon.modules[idx]
    let el = elModuleTpl.cloneNode()
    document.$("ul#modules").appendChild(el)

    el.setAttribute("data", idx)
    el.$("#module").value = m.module
    el.$("#path").value = m.path
    el.$("#readonly").checked = m.readonly || false
    el.$("#writeonly").checked = m.writeonly || false
}

function populateDaemon() {
    document.$("#modules").clear()
    for (let idx = 0; idx < globalconfig.configs.daemon.modules.length; idx++) {
        appendDaemonModule(idx)
    }
}
document.on("ready", function () {
    globalconfig.loadCfg()
    uauth.loadAuths()
    elAuthTpl = document.$("#authtbl").lastElementChild
    document.$("#authtbl").removeChild(elAuthTpl)
    elModuleTpl = document.$("#modules").lastElementChild
    document.$("#modules").removeChild(elModuleTpl)
    document.$("#sshroot").innerText = globalconfig.configs.ssh.sshroot
    document.$("#btngen").style.display = globalconfig.configs.ssh.keyexists ? 'none' : 'block'
    for (let a of uauth.auths) {
        appendAuth(a)
    }
    populateDaemon()
})

document.on("click", "#btngen", async () => {
    await globalconfig.genSSHKey()
    document.$("#btngen").style.display = globalconfig.configs.ssh.keyexists ? 'none' : 'block'
})

document.on("click", "#newauth", () => {
    appendAuth(uauth.newAuth())
})

document.on("click", "#rmauth", (evt, el) => {
    let id = el.$p("tr").getAttribute("data")
    uauth.removeAuth(Number(id))
    document.$(`tbody>tr[data=${id}]`).remove()
})

document.on("click", "#insauth", (evt, el) => {
    let id = el.$p("tr").getAttribute("data")
    let a = uauth.findAuth(Number(id))
    let cmd = globalconfig.sshCopyId(a)
    if (cmd) {
        Clipboard.writeText(cmd)
        let ret = Window.this.modal(<info>A terminal windows be opened to excute this command: {cmd} <br />, please follow the screen to finish.</info>)
        if (ret == "ok") {
            env.exec("cmd", "/K", cmd)
        }
    }
})

document.on("click", "#tstauth", async (evt, el) => {
    let id = el.$p("tr").getAttribute("data")
    let a = uauth.findAuth(Number(id))
    let cmd = ['ssh', `${a.user}@${a.host}`, "ls /"]
    processSSH = sys.spawn(cmd)
    var r = await processSSH.wait()
    let msg = r.exitCode ? "Failed" : "Succeed"
    Window.this.modal(msg)
})

document.on("change", "tr", function (evt, el) {
    let id = Number(el.getAttribute("data"))
    let a = uauth.findAuth(id)
    a.type = el.$("#itype").value
    a.host = el.$("#ihost").value
    a.user = el.$("#iuser").value
    a.passwd = el.$("#ipasswd").value
    el.$("#insauth").style.display = a.type === "ssh" ? 'inline-block' : 'none'
    el.$("#tstauth").style.display = a.type === "ssh" ? 'inline-block' : 'none'
    el.$("#ihost").style.display = a.type === "local" ? 'none' : 'inline-block'
    el.$("#iuser").style.display = a.type === "local" ? 'none' : 'inline-block'
    el.$("#ipasswd").style.display = a.type === "local" ? 'none' : 'inline-block'
    return true
})

document.on("change", "li#daemonmodule", function (evt, el) {
    let idx = Number(el.getAttribute("data"))
    let a = globalconfig.configs.daemon.modules[idx]
    a.module = el.$("#module").value
    a.path = el.$("#path").value
    a.readonly = el.$("#readonly").checked
    a.writeonly = el.$("#writeonly").checked

    return true
})

document.on("click", "#newmodule", () => {
    appendDaemonModule(globalconfig.newDaemonModule())
})

document.on("click", "#rmmodule", async (evt, el) => {
    let idx = Number(el.$p("#daemonmodule").getAttribute("data"))
    globalconfig.configs.daemon.modules.splice(idx, 1)
    populateDaemon()
})

document.on("click", "#browmodule", async (evt, el) => {
    let idx = Number(el.getAttribute("data"))
    let elpath = el.parentElement.$("#path")
    let newFolder = Window.this.selectFolder({ path: elpath.value })
    if (newFolder) {
        elpath.value = URL.toPath(newFolder)
        globalconfig.configs.daemon.modules[idx].path = elpath.value
    }
})

document.on("click", "#ok", () => {
    uauth.saveAuths()
    globalconfig.saveCfg()
    Window.this.close("true")
})

document.on("click", "#cancel", () => {
    Window.this.close()
})