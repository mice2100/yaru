import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'
import * as auth from './uauth.js'
import * as gconfig from "./uconfig"
import * as task from "./utask"
import * as utils from "./utils"
import * as uswitch from "./uswitch"

uswitch.initSwitches()

// console.log(genSwitches(sw))

const elTask = document.$("table>tbody")
gconfig.loadCfg()
auth.loadAuths()
var processRsync
var processDaemon
var stopping = false

function genTaskReact(t) {
    return <tr #tsk data={t.id}><td><input #sel type="checkbox" value={t.enabled}/></td>
        <td>{t.id}</td><td>{t.src}</td><td>{t.dst}</td>
        <td>{auth.genAuthString(t.auth)}</td><td>{uswitch.cvtSwitches2Str(t.params)}</td>
        <td><button .ibtn #edittask title="edit" tid={t.id}><i .i_edit/></button> <button .ibtn #rmtask title="Delete" tid={t.id}><i .i_del/></button></td>
        </tr>
}

function init() {
    elTask.clear()
    task.loadTaskList()
    for (let t of task.taskList) {
        elTask.append(genTaskReact(t))
    }
}

init()

async function runit(dryrun = false) {
    const out = document.$("plaintext");
    let elStart = document.$("#exec")
    let elStop = document.$("#stop")
    elStart.disabled = true
    elStop.disabled = false
    let dry = dryrun?"-n":undefined
    function fnNewLine(cline, cls){
        out.append(<text class={cls}>{cline}</text>)
        out.lastElementChild.scrollIntoView()
    }

    try {
        out.clear()
        for (let t of task.taskList) {
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
        out.append(<text class="error">{e.message}</text>)
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
    let id = task.newTaskId()
    let t = { enabled: false, id: id, src: "", dst: "", auth: 0, params: [] }

    document.state.disabled = true;

    var retval = Window.this.modal({
        url: __DIR__ + "wtask.html",
        alignment: -5,
        parameters: t
    })

    if (retval) {
        let t = JSON.parse(retval)
        task.taskList.push(t)
        elTask.append(genTaskReact(t))
        task.saveTaskList()
    }

    document.state.disabled = false;
    // console.log(task.taskList[0])
}

document.on("change", "#sel", function (evt, el) {
    let id = Number(el.$p("tr").getAttribute("data"))
    let t = task.findTask(id)
    if (t) {
        t.enabled = el.value
        task.saveTaskList()
    }
})

document.on("click", "#edittask", function (evt, el) {
    let id = Number(el.getAttribute("tid"))
    let t = task.findTask(id)

    document.state.disabled = true;

    var retval = Window.this.modal({
        url: __DIR__ + "wtask.html",
        alignment: -5,
        parameters: t
    })

    if (retval) {
        let t = JSON.parse(retval)
        el.$p("tr").patch(genTaskReact(t))
        let t0 = task.findTask(id)
        Object.assign(t0, t)
        task.saveTaskList()
        // el = genTaskReact(t0)
    }

    document.state.disabled = false;
})

document.on("click", "#newtask", function (evt, el) {
    addTask()
})

document.on("click", "#rmtask", function (evt, el) {
    let id = el.getAttribute("tid")
    task.removeTask(Number(id))
    task.saveTaskList()
    document.$(`tbody>tr[data=${id}]`).remove()
})

document.on("click", "#config", function (evt) {
    document.state.disabled = true;

    var retval = Window.this.modal({
        url: __DIR__ + "wconfig.html",
        alignment: -5
    })

    if (retval) {
        gconfig.loadCfg()
        auth.loadAuths()
        init()
    }

    document.state.disabled = false;
})

document.on("click", "#startserv", async ()=>{
    document.$("#startserv").disabled = true
    document.$("#stopserv").disabled = false

    let cmds = utils.makeDaemonCmd()
    processDaemon = sys.spawn(cmds)
    await processDaemon.wait()

    document.$("#startserv").disabled = false
    document.$("#stopserv").disabled = true
})

document.on("click", "#stopserv", ()=>{
    if(processDaemon.pid) {
        processDaemon.kill()
    }
})