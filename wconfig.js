import * as globalconfig from './uconfig'
import * as auth from './uauth'
import * as env from '@env'
import * as sys from '@sys'

var processSSH

function appendAuth(a) {
    var passwd = <td></td>
    if(a.type==="rsync") passwd = <td><input type="password" id="ipasswd" value={a.passwd}/></td>;
    document.$("table>tbody").append(<tr data={a.id}><td>{a.id}</td><td>
        <select id="itype" value={a.type}><option>ssh</option><option>local</option><option>rsync</option></select></td>
        <td><input id="ihost" value={a.host}></input></td><td><input id="iuser" value={a.user} /></td>
        {passwd}
        <td><button title="Delete" .ibtn #rmauth data={a.id}><i .i_del/></button><button title="Install Key" .ibtn #insauth data={a.id}><i .i_istall/></button> <button title="Test" .ibtn #tstauth data={a.id}><i .i_test/></button></td></tr>)

    let el = document.$("table>tbody").lastElementChild
    el.$("#insauth").style.display = a.type==="ssh" ? 'inline-block' : 'none'
    el.$("#tstauth").style.display = a.type==="ssh" ? 'inline-block' : 'none'
}

function appendDaemonModule(idx){
    let m = globalconfig.configs.daemon.modules[idx]
    let el = <li #daemonmodule data={idx}><input type="text" id="module" value={m.module} />
        <input .urlipt type="text" id="path" value={m.path} /><button .btn .greybtn #browmodule data={idx}>Select...</button>
        <span><input type="checkbox" id="readonly" value={m.readonly} /> <label for="readonly">read only</label></span>
        <span><input type="checkbox" id="writeonly" value={m.writeonly} /> <label for="writeonly">write only</label></span>
        <button .ibtn #rmmodule data={idx}><i .i_del/></button>
        </li>

    document.$("ul#modules").append(el)
}

function populateDaemon(){
    document.$("#modules").clear()
    for(let idx=0; idx<globalconfig.configs.daemon.modules.length; idx++){
        appendDaemonModule(idx)
    }
}
document.on("ready", function () {
    globalconfig.loadCfg()
    auth.loadAuths()
    document.$("#sshroot").innerText = globalconfig.configs.ssh.sshroot
    document.$("#btngen").style.display = globalconfig.configs.ssh.keyexists ? 'none' : 'block'
    
    for (let a of auth.auths) {
        appendAuth(a)
    }
    populateDaemon()
})

document.on("click", "#btngen", async () => {
    await globalconfig.genSSHKey()
    document.$("#btngen").style.display = globalconfig.configs.ssh.keyexists ? 'none' : 'block'
})

document.on("click", "#newauth", () => {
    appendAuth(auth.newAuth())
})

document.on("click", "#rmauth", (evt, el) => {
    let id = el.getAttribute("data")
    auth.removeAuth(Number(id))
    document.$(`tbody>tr[data=${id}]`).remove()
})

document.on("click", "#insauth", (evt, el) => {
    let id = el.getAttribute("data")
    let a = auth.findAuth(Number(id))
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
    let id = el.getAttribute("data")
    let a = auth.findAuth(Number(id))
    let cmd = ['ssh', `${a.user}@${a.host}`, "ls /"]
    processSSH = sys.spawn(cmd)
    var r = await processSSH.wait()
    let msg = r.exitCode? "Failed" : "Succeed"
    Window.this.modal(msg)
})

document.on("change", "tr", function (evt, el) {
    let id = Number(el.getAttribute("data"))
    let a = auth.findAuth(id)
    a.type = el.$("#itype").value
    a.host = el.$("#ihost").value
    a.user = el.$("#iuser").value
    a.passwd = el.$("#ipasswd").value
    el.$("#insauth").style.display = a.type==="ssh" ? 'inline-block' : 'none'
    el.$("#tstauth").style.display = a.type==="ssh" ? 'inline-block' : 'none'
    return true
})

document.on("change", "li#daemonmodule", function (evt, el) {
    let idx = Number(el.getAttribute("data"))
    let a = globalconfig.configs.daemon.modules[idx]
    a.module = el.$("#module").value
    a.path = el.$("#path").value
    a.readonly = el.$("#readonly").value
    a.writeonly = el.$("#writeonly").value
    return true
})

document.on("click", "#newmodule", () => {
    appendDaemonModule(globalconfig.newDaemonModule())
})

document.on("click", "#rmmodule", async (evt, el) => {
    let idx = Number(el.getAttribute("data"))
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
    auth.saveAuths()
    globalconfig.saveCfg()
    Window.this.close("true")
})

document.on("click", "#cancel", () => {
    Window.this.close()
})