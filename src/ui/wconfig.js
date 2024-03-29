import * as uconfig from './uconfig'
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
    el.$("#port").value = a.port
    el.$("#insauth").style.display = a.type === "ssh" ? 'inline-block' : 'none'
    el.$("#tstauth").style.display = a.type === "ssh" ? 'inline-block' : 'none'
    el.$("#ihost").style.display = a.type === "local" ? 'none' : 'inline-block'
    el.$("#iuser").style.display = a.type === "local" ? 'none' : 'inline-block'
    el.$("#port").style.display = a.type === "local" ? 'none' : 'inline-block'
}

function appendDaemonModule(idx) {
    let m = uconfig.configs.daemon.modules[idx]
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
    for (let idx = 0; idx < uconfig.configs.daemon.modules.length; idx++) {
        appendDaemonModule(idx)
    }
}
document.on("ready", function () {
    uconfig.loadCfg()
    elAuthTpl = document.$("#authtbl").lastElementChild
    document.$("#authtbl").removeChild(elAuthTpl)
    elModuleTpl = document.$("#modules").lastElementChild
    document.$("#modules").removeChild(elModuleTpl)
    document.$("#sshroot").innerText = uconfig.configs.ssh.sshroot
    document.$("#btngen").style.display = uconfig.configs.ssh.keyexists ? 'none' : 'block'
    for (let a of uconfig.configs.auths) {
        appendAuth(a)
    }
    populateDaemon()
})

document.on("click", "#btngen", async () => {
    await uconfig.genSSHKey()
    document.$("#btngen").style.display = uconfig.configs.ssh.keyexists ? 'none' : 'block'
})

document.on("click", "#newauth", () => {
    appendAuth(uconfig.newAuth())
})

document.on("click", "#rmauth", (evt, el) => {
    let id = el.$p("tr").getAttribute("data")
    uconfig.removeAuth(Number(id))
    document.$(`tbody>tr[data=${id}]`).remove()
})

document.on("click", "#insauth", (evt, el) => {
    let id = el.$p("tr").getAttribute("data")
    let a = uconfig.findAuth(Number(id))
    let cmd = uconfig.sshCopyId(a)
    if (cmd) {
        Clipboard.writeText(cmd)
        if (env.PLATFORM==="WINDOWS") {
                let ret = Window.this.modal(<info>A terminal windows be opened to run this command: <br />{cmd} <br />, please follow the screen to finish.</info>)
                env.exec("cmd", "/K", cmd)
            }
            else{
                Window.this.modal(<info>Please open a terminal window and press Cmd+V to paste the following command: <br />{cmd} <br />, then follow the screen to finish.</info>)
            }
    }
})

document.on("click", "#tstauth", async (evt, el) => {
    let id = el.$p("tr").getAttribute("data")
    let a = uconfig.findAuth(Number(id))
    let port = a.port || 22
    let cmd = ['ssh', `${a.user}@${a.host}`, "-p", `${port}`, "ls", "/"]
    processSSH = sys.spawn(cmd)
    var r = await processSSH.wait()
    let msg = r.exitCode ? "Failed" : "Succeed"
    Window.this.modal(msg)
})

document.on("change", "tr", function (evt, el) {
    let id = Number(el.getAttribute("data"))
    let a = uconfig.findAuth(id)
    a.type = el.$("#itype").value
    a.host = el.$("#ihost").value
    a.user = el.$("#iuser").value
    a.port = el.$("#port").value
    el.$("#insauth").style.display = a.type === "ssh" ? 'inline-block' : 'none'
    el.$("#tstauth").style.display = a.type === "ssh" ? 'inline-block' : 'none'
    el.$("#ihost").style.display = a.type === "local" ? 'none' : 'inline-block'
    el.$("#iuser").style.display = a.type === "local" ? 'none' : 'inline-block'
    el.$("#port").style.display = a.type === "local" ? 'none' : 'inline-block'
    return true
})

document.on("change", "li#daemonmodule", function (evt, el) {
    let idx = Number(el.getAttribute("data"))
    let a = uconfig.configs.daemon.modules[idx]
    a.module = el.$("#module").value
    a.path = el.$("#path").value
    a.readonly = el.$("#readonly").checked
    a.writeonly = el.$("#writeonly").checked

    return true
})

document.on("click", "#newmodule", () => {
    appendDaemonModule(uconfig.newDaemonModule())
})

document.on("click", "#rmmodule", async (evt, el) => {
    let idx = Number(el.$p("#daemonmodule").getAttribute("data"))
    uconfig.configs.daemon.modules.splice(idx, 1)
    populateDaemon()
})

document.on("click", "#browmodule", async (evt, el) => {
    let idx = Number(el.getAttribute("data"))
    let elpath = el.parentElement.$("#path")
    let newFolder = Window.this.selectFolder({ path: elpath.value })
    if (newFolder) {
        elpath.value = URL.toPath(newFolder)
        uconfig.configs.daemon.modules[idx].path = elpath.value
    }
})

document.on("click", "#ok", () => {
    uconfig.saveCfg()
    Window.this.close("true")
})

document.on("click", "#cancel", () => {
    Window.this.close()
})