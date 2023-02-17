import * as sys from '@sys'
import * as uconfig from "./uconfig"
import * as utils from "./utils"
import * as uswitch from "./uswitch"
import { uexclude } from './uexclude.js'
import * as env from '@env'

uswitch.initSwitches()

const elTask = document.$("table>tbody")
var processRsync
var processDaemon
var stopping = false

function genTaskReact(t) {
    return <tr #tsk data={t.id}><td><input #sel type="checkbox" value={t.enabled}/></td>
        <td>{t.id}</td><td>{uconfig.genAuthString(t.authsrc)}|{t.src}</td><td>{uconfig.genAuthString(t.authdst)}|{t.dst}</td>
        <td>{uswitch.cvtSwitches2Str(t.params)}</td>
        <td><button .ibtn #edittask title="Edit" tid={t.id}><i .i_edit/></button> <button .ibtn #rmtask title="Delete" tid={t.id}><i .i_del/></button></td>
        </tr>
}

function init() {
    elTask.clear()
    if(!uconfig.loadCfg()){
        document.$("#log").appendItem("Can't find cwrsync/bin in the same path, please check!", "info")
    }

    for (let t of uconfig.configs.taskList) {
        elTask.append(genTaskReact(t))
    }
    let rc = Window.this.screenBox("frame", "xywh")
    let WIDTH = 1200
    let HEIGHT = 800
    let xd = (WIDTH-rc[2])/2
    let yd = (HEIGHT-rc[3])/2
    Window.this.move(rc[0]-xd, rc[1]-yd, WIDTH, HEIGHT)
}

document.on("ready", ()=>{
    init()
})

async function runit(dryrun = false) {
    const out = document.$("#log");
    let elStart = document.$("#exec")
    let elStop = document.$("#stop")
    elStart.disabled = true
    elStop.disabled = false
    let dry = dryrun?"-n":undefined
    function fnNewLine(cline, cls){
        out.appendItem(cline, cls)
    }

    try {
        for (let t of uconfig.configs.taskList) {
            if (stopping) break
            let args = await utils.makeRsycCmd(t, dry)
            if (args) {

                fnNewLine(`Starting task ${t.id} ...`, "info");
                processRsync = sys.spawn(args, { stdout: "pipe", stderr: "pipe" });
                let pout = utils.pipeReader(processRsync.stdout, "stdout", fnNewLine);
                let perr = utils.pipeReader(processRsync.stderr, "stderr", fnNewLine);
                
                var r = await processRsync.wait()
                processRsync.stderr.close()
                processRsync.stdout.close()
                await pout
                await perr
                fnNewLine(`Task ${t.id} done with result:${r.exit_status} and ${r.term_signal}`, "info")
                fnNewLine("","msg")
            }
        }
    } catch (e) {
        console.log(e.message, e.stack)
        // out.appendItem(e.message, "info")
    }
    stopping = false
    elStart.disabled = false
    elStop.disabled = true
}

document.on("click", "#exec", async function () {
    runit(false)
})

document.on("click", "#stop", async function () {
    stopping = true
    if(processRsync && processRsync.pid) {
        processRsync.kill()
    }
})

document.on("click", "#test", async function () {
    runit(true)
})

function addTask() {
    let id = uconfig.newTaskId()
    let exclude = uexclude.defaultExcludes()
    let t = { enabled: false, id: id, src: "", dst: "", authsrc: 1, authdst: 1, params: [], exclude: exclude.join(" ")}
    if(id===1){
        t.src = URL.toPath(env.path("documents"))
    }

    document.state.disabled = true;

    var retval = Window.this.modal({
        url: __DIR__ + "wtask.html",
        alignment: -5,
        parameters: t
    })

    if (retval) {
        let t = JSON.parse(retval)
        uconfig.configs.taskList.push(t)
        elTask.append(genTaskReact(t))
        uconfig.saveCfg()
    }

    document.state.disabled = false;
}

document.on("change", "#sel", function (evt, el) {
    let id = Number(el.$p("tr").getAttribute("data"))
    let t = uconfig.findTask(id)
    if (t) {
        t.enabled = el.value
        uconfig.saveCfg()
    }
})

document.on("click", "#edittask", function (evt, el) {
    let id = Number(el.getAttribute("tid"))
    let t = uconfig.findTask(id)

    document.state.disabled = true;

    var retval = Window.this.modal({
        url: __DIR__ + "wtask.html",
        alignment: -5,
        parameters: t
    })

    if (retval) {
        let t = JSON.parse(retval)
        el.$p("tr").patch(genTaskReact(t))
        let t0 = uconfig.findTask(id)
        Object.assign(t0, t)
        uconfig.saveCfg()
    }

    document.state.disabled = false;
})

document.on("click", "#newtask", function (evt, el) {
    addTask()
})

document.on("click", "#rmtask", function (evt, el) {
    let id = el.getAttribute("tid")
    uconfig.removeTask(Number(id))
    uconfig.saveCfg()
    document.$(`tbody>tr[data=${id}]`).remove()
})

document.on("click", "#config", function (evt) {
    document.state.disabled = true;

    var retval = Window.this.modal({
        url: __DIR__ + "wconfig.html",
        alignment: -5
    })

    if (retval) {
        init()
    }

    document.state.disabled = false;
})

document.on("click", "#startserv", async ()=>{
    document.$("#startserv").disabled = true
    document.$("#stopserv").disabled = false
    const out = document.$("plaintext");

    let cmds = utils.makeDaemonCmd()
    if(!cmds) {
        Window.this.modal(<alert>No module in daemon. Please check section: "Daemon Config" in the configurations first.</alert>)
    } else{
        let ips = await utils.getLocalIP()
        let mod = []
        for(let m of uconfig.configs.daemon.modules){
            mod.push(m.module)
        }
        out.append(<text class="info">Rsync daemon runs at: <b>{ips.join(", ")}</b></text>)
        out.append(<text class="info">Rsync daemon module list: <b>{mod.join(", ")}</b></text>)
        processDaemon = sys.spawn(cmds)
        await processDaemon.wait()
    }

    document.$("#startserv").disabled = false
    document.$("#stopserv").disabled = true
})

document.on("click", "#stopserv", ()=>{
    if(processDaemon.pid) {
        processDaemon.kill()
    }
})