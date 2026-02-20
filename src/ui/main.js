import * as sys from '@sys'
import * as uconfig from "./uconfig"
import * as utils from "./utils"
import * as uswitch from "./uswitch"
import { uexclude } from './uexclude.js'
import * as env from '@env'
import { xt } from "./xterm.js"
import { ConfigDialog } from "./ConfigDialog.js"
import { WTaskDialog } from "./WTaskDialog.js"

uswitch.initSwitches()

// Ensure UTF-8 locale so terminal widget and spawned processes (rsync etc.) output UTF-8
const elTask = document.$("table>tbody")
var processRsync
var processDaemon
var stopping = false

function fnNewLine(cline, cls) {
    let txt = ""
    switch (cls) {
        case 'msg':
            txt = cline  // raw output — ANSI wrapping garbles non-ASCII (CJK) chars
            break;
        case 'info':
            txt = xt.yellow(cline)
            break;
        case 'error':
            txt = xt.red(cline)
            break;
    }
    console.log(txt);
    document.$("terminal").terminal.write(txt + "\r\n");
}

function genTaskReact(t) {
    return <tr #tsk data={t.id}><td><input #sel type="checkbox" checked={t.enabled} /></td>
        <td>{t.id}</td><td>{uconfig.genAuthString(t.authsrc)}|{t.src}</td><td>{uconfig.genAuthString(t.authdst)}|{t.dst}</td>
        <td>{uswitch.cvtSwitches2Str(t.params)}</td>
        <td><button.ibtn #edittask title="Edit" tid={t.id}><i.i_edit /></button> <button.ibtn #rmtask title="Delete" tid={t.id}><i.i_del /></button></td>
    </tr>
}

function init() {
    elTask.clear()
    if (!uconfig.loadCfg()) {
        fnNewLine(`Can't load config!`, 'error');
        return;
    }

    if (!utils.checkRsync()) {
        fnNewLine(`Can't find rsync!`, 'error');
        return;
    }

    for (let t of uconfig.configs.taskList) {
        elTask.append(genTaskReact(t))
    }
}

document.on("ready", () => {
    init()
})

var running = false

function setExecBtn(isRunning) {
    const el = document.$("#exec")
    if (isRunning) {
        el.classList.remove("bluebtn")
        el.classList.add("redbtn")
        el.innerHTML = '<i class="i_stop"></i>Stop'
    } else {
        el.classList.remove("redbtn")
        el.classList.add("bluebtn")
        el.innerHTML = '<i class="i_start"></i>Start'
    }
}

async function runit(dryrun = false) {
    running = true
    setExecBtn(true)
    let dry = dryrun ? "-n" : undefined

    try {
        for (let t of uconfig.configs.taskList) {
            if (stopping) break
            let args = utils.makeRsycCmd(t, dry)
            if (args) {
                fnNewLine(`Starting task ${t.id} :${args.join(" ")}`, "info");
                processRsync = sys.spawn(args, { stdout: "pipe", stderr: "pipe" });
                let pout = utils.pipeReader(processRsync.stdout, "stdout", fnNewLine);
                let perr = utils.pipeReader(processRsync.stderr, "stderr", fnNewLine);

                var r = await processRsync.wait()
                processRsync.stderr.close()
                processRsync.stdout.close()
                await pout
                await perr
                fnNewLine(`Task ${t.id} done with result:${r.exit_status} and ${r.term_signal}`, "info")
                fnNewLine("", "msg")
            }
        }
    } catch (e) {
        console.log(e.message, e.stack)
    }
    stopping = false
    running = false
    setExecBtn(false)
}

document.on("click", "#exec", async function () {
    if (running) {
        // act as Stop
        stopping = true
        if (processRsync && processRsync.pid) processRsync.kill()
    } else {
        const dryrun = document.$("#dryrun").checked
        runit(dryrun)
    }
})



function addTask() {
    let id = uconfig.newTaskId()
    let exclude = uexclude.defaultExcludes()
    let t = { enabled: false, id: id, src: "", dst: "", authsrc: 1, authdst: 1, params: [], exclude: exclude.join(" ") }
    if (id === 1) {
        t.src = URL.toPath(env.path("documents"))
    }

    document.popup(
        <WTaskDialog tsk={t} onOk={(saved) => {
            uconfig.configs.taskList.push(saved)
            elTask.append(genTaskReact(saved))
            uconfig.saveCfg()
        }} />,
        { anchorAt: 5, animationType: "blend" }
    )
}

document.on("change", "#sel", function (evt, el) {
    let id = Number(el.$p("tr").getAttribute("data"))
    let t = uconfig.findTask(id)
    if (t) {
        t.enabled = el.checked
        uconfig.saveCfg()
    }
})

document.on("click", "#edittask", function (evt, el) {
    let id = Number(el.getAttribute("tid"))
    let t = uconfig.findTask(id)

    document.popup(
        <WTaskDialog tsk={t} onOk={(saved) => {
            el.$p("tr").patch(genTaskReact(saved))
            let t0 = uconfig.findTask(id)
            Object.assign(t0, saved)
            uconfig.saveCfg()
        }} />,
        { anchorAt: 5, animationType: "blend" }
    )
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
    showConfigPopup()
})

function showConfigPopup() {
    document.popup(<ConfigDialog />, {
        anchorAt: 5,
        animationType: "blend"
    })
}

var daemonRunning = false

function setDaemonBtn(isRunning) {
    const el = document.$("#startserv")
    if (isRunning) {
        el.classList.remove("bluebtn")
        el.classList.add("redbtn")
        el.innerHTML = '<i class="i_stop"></i>Stop Daemon'
    } else {
        el.classList.remove("redbtn")
        el.classList.add("bluebtn")
        el.innerHTML = '<i class="i_start"></i>Start Daemon'
    }
}

document.on("click", "#startserv", async () => {
    if (daemonRunning) {
        // act as Stop Daemon
        if (processDaemon && processDaemon.pid) processDaemon.kill()
        fnNewLine("Rsync daemon stopped.", "info")
        daemonRunning = false
        setDaemonBtn(false)
        return
    }

    let cmds = utils.makeDaemonCmd()
    if (!cmds) {
        Window.this.modal(<alert>No module in daemon. Please check section: "Daemon Config" in the configurations first.</alert>)
        return
    }

    daemonRunning = true
    setDaemonBtn(true)

    let ips = await utils.getLocalIP()
    let mod = []
    for (let m of uconfig.configs.daemon.modules) {
        mod.push(m.module)
    }
    fnNewLine(`Rsync daemon is running at: ${ips.join(", ")}`, "info");
    fnNewLine(`Rsync daemon module: ${mod.join(", ")}`, "info")
    processDaemon = sys.spawn(cmds)
    await processDaemon.wait()

    daemonRunning = false
    setDaemonBtn(false)
})
