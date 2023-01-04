import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'
import * as auth from './uauth.js'
import * as gconfig from "./uconfig"
import * as task from "./utask"
import * as utils from "./utils"

const elTask = document.$("table>tbody")
gconfig.loadCfg()
auth.loadAuths()
var processRsync
var stopping = false

function genTaskReact(t) {
    return <tr #tsk data={t.id}><td><input #sel type="checkbox" value={t.enabled} /></td>
        <td>{t.id}</td><td>{t.src}</td><td>{t.dst}</td>
        <td>{auth.genAuthString(t.auth)}</td><td>{t.params.join(" ")}</td></tr>
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
            let args = utils.makeRsycCmd(t, dry)
            if (args) {
                out.append(<text>Starting task {t.id} ...</text>);
                processRsync = sys.spawn(args, { stdout: "pipe", stderr: "pipe" });
                utils.pipeReader(processRsync.stdout, "stdout", fnNewLine);
                utils.pipeReader(processRsync.stderr, "stderr", fnNewLine);
                var r = await processRsync.wait()
                fnNewLine(`Done with result:${r.exit_status} and ${r.term_signal}`, "done")
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
    console.log(task.taskList[0])
}

document.on("change", "#sel", function (evt, el) {
    let id = Number(el.$p("tr").getAttribute("data"))
    let t = task.findTask(id)
    if (t) {
        t.enabled = el.value
        task.saveTaskList()
    }
})

document.on("doubleclick", "#tsk", function (evt, el) {
    let id = Number(el.getAttribute("data"))
    let t = task.findTask(id)

    document.state.disabled = true;

    var retval = Window.this.modal({
        url: __DIR__ + "wtask.html",
        alignment: -5,
        parameters: t
    })

    if (retval) {
        let t = JSON.parse(retval)
        el.patch(genTaskReact(t))
        let t0 = task.findTask(id)
        Object.assign(t0, t)
        task.saveTaskList()
    }

    document.state.disabled = false;
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

document.on("contextmenu", "tbody", function (evt, el) {
    evt.source = Element.create(<menu.context>
        <li data="tcreate">create task</li>
    </menu>);
    return true;
})

document.on("contextmenu", "tbody>tr", function (evt, el) {
    let id = el.getAttribute("data")
    evt.source = Element.create(<menu.context>
        <li data="tcreate">Create Task</li>
        <li data="tremove" tid={id}>Remove Task</li>
    </menu>);
    return true
})

document.on("click", "menu.context>li", function (evt, el) {
    let id, args
    switch (el.getAttribute("data")) {
        case 'tcreate':
            addTask()
            break;
        case 'tremove':
            id = evt.target.getAttribute("tid")
            task.removeTask(Number(id))
            document.$(`tbody>tr[data=${id}]`).remove()
            break;
    }
})