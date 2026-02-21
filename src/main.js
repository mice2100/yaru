import * as sys from '@sys'
import * as uconfig from "./uconfig"
import * as utils from "./utils"
import { ConfigDialog } from "./ConfigDialog.js"
import { TaskTable } from "./TaskTable.js"

var processRsync
var processDaemon
var stopping = false

function fnNewLine(cline, cls) {
    let el = document.$("plaintext#terminal");
    if (el) {
        if (el.plaintext.content) {
            el.plaintext.appendLine(cline);
            el.execCommand("navigate:end");
        } else {
            el.plaintext.content = cline;
        }
    }
}

function init() {
    if (!uconfig.loadCfg()) {
        fnNewLine(`Can't load config!`, 'error');
        return;
    }
    
    document.$("#tasktable").patch(<TaskTable #tasktable />);
    let rsyncInfo = utils.checkRsync();
    if (!rsyncInfo.found) {
        fnNewLine(`Can't find rsync! Expected at: ${rsyncInfo.path || 'unknown path'}`, 'error');
        document.$("#exec").disabled = true;
        document.$("#startserv").disabled = true;
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
                processRsync = null;
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



document.on("click", "#newtask", function (evt, el) {
    document.$("#tasktable").addTask()
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
    fnNewLine(`Rsync daemon is running at: ${ips.join(", ")} port: ${uconfig.configs.daemon.port}`, "info");
    fnNewLine(`Rsync daemon module: ${mod.join(", ")}`, "info")
    processDaemon = sys.spawn(cmds)
    await processDaemon.wait()

    daemonRunning = false
    setDaemonBtn(false)
})

document.on("closerequest", () => {
    if (processRsync && processRsync.pid) processRsync.kill()
    if (processDaemon && processDaemon.pid) processDaemon.kill()
    return true
})
