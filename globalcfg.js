import * as globalconfig from './globalconfig'
import * as auth from './auth'
import * as env from '@env'

globalconfig.loadCfg()
auth.loadAuths()

document.$("#sshroot").innerText = globalconfig.configs.ssh.sshroot
document.$("#btngen").style.display = globalconfig.configs.ssh.keyexists ? 'none' : 'block'

function appendAuth(a) {
    document.$("table>tbody").append(<tr data={a.id}><td>{a.id}</td><td>
        <select id="itype" value={a.type}><option>ssh</option><option>local</option></select></td>
        <td><input id="ihost" value={a.host}></input></td><td><input id="iuser" value={a.user} /></td></tr>)
}

for (let a of auth.auths) {
    appendAuth(a)
}

document.on("click", "#btngen", async ()=>{
    await globalconfig.genSSHKey()
    document.$("#btngen").style.display = globalconfig.configs.ssh.keyexists ? 'none' : 'block'
})

document.on("contextmenu", "tbody", function (evt, el) {
    evt.source = Element.create(<menu.context><li id="mnnew">New</li>
    </menu>)
    return true
})

document.on("contextmenu", "tbody>tr", function (evt, el) {
    let id = el.getAttribute("data")
    evt.source = Element.create(<menu.context>
        <li id="mnnew">New</li>
        <li id="mndel" aid={id}>Remove</li>
    </menu>)

    let a = auth.findAuth(Number(id))
    if (a && a.type == 'ssh') {
        evt.source.append(<li id="mnins" aid={id}>Install SSH key</li>)
        evt.source.append(<li id="mntst" aid={id}>Test SSH Connection</li>)
    }
    return true
})

document.on("click", "menu.context>li", function (evt, el) {
    var id, a, cmd
    switch (el.getAttribute("id")) {
        case 'mnnew':
            appendAuth(auth.newAuth())
            break;
        case 'mndel':
            id = el.getAttribute("aid")
            auth.removeAuth(Number(id))
            document.$(`tbody>tr[data=${id}]`).remove()
            break;
        case 'mnins':
            id = el.getAttribute("aid")
            a = auth.findAuth(Number(id))
            cmd = globalconfig.sshCopyId(a)
            if (cmd) {
                Clipboard.writeText(cmd)

                let ret = Window.this.modal(<info>A terminal windows be opened to excute this command: {cmd} <br/>, please follow the screen to finish.</info>)
                if (ret=="ok") {
                    env.exec("cmd", "/K", cmd)
                }
            }
            break;
            case 'mntst':
                id = Number(el.getAttribute("aid"))
                a = auth.findAuth(id)
                cmd = `ssh ${a.user}@${a.host}`
                Clipboard.writeText(cmd)
                let ret = Window.this.modal(<info>A terminal windows be opened with:<br/>{cmd}<br/>You should login into the server if everything is good. <br/>Otherwise, please check the ssh password or re-generate the keys.</info>)
                if (ret=="ok") {
                    env.exec("cmd", "/K", cmd)
                }
                break;
        }
})

document.on("change", "tr", function (evt, el) {
    let id = Number(el.getAttribute("data"))
    let a = auth.findAuth(id)
    a.type = el.$("#itype").value
    a.host = el.$("#ihost").value
    a.user = el.$("#iuser").value
    return true
})

document.on("click", "#ok", ()=>{
    auth.saveAuths()
    globalconfig.saveCfg()
})