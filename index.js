import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'
import * as auth from './auth.js'
import * as gconfig from "./globalconfig"
import * as task from "./task"

const elTask = document.$("table>tbody")

const EOL = env.PLATFORM == "Windows" ? "\r\n" : "\n";
gconfig.loadCfg()
auth.loadAuths()
var tracert;

function genTaskReact(t) {
    return <tr #tsk data={t.id}><td><input #sel type="checkbox" value={t.enabled} mixed /></td>
        <td>{t.id}</td><td>{t.src}</td><td>{t.dst}</td>
        <td>{auth.genAuthString(t.auth)}</td><td>{t.params.join(" ")}</td></tr>
}

function init() {
    task.loadTaskList()
    for (let t of task.taskList) {
        elTask.append(genTaskReact(t))
    }
}

init()

async function pipeReader(pipe, name, out) {
    try {
        var cline = "";
        reading: while (pipe) {
            var text = await pipe.read();
            text = sciter.decode(text);
            while (text) {
                var eolpos = text.indexOf(EOL);
                if (eolpos < 0) { cline += text; continue reading; }
                cline += text.substr(0, eolpos);
                text = text.substr(eolpos + EOL.length);
                out.append(<text class={name}>{cline}</text>);
                cline = "";
            }
        }
    } catch (e) {
        if (e.message != "socket is not connected")
            out.append(<text class="error">{e.message}</text>);
    }

}

document.on("click", "#exec", async function () {
    var cmd = env.PLATFORM == "Windows" ? "rsync" : "rsync";
    const out = document.$("plaintext");
    try {
        for (let t of task.taskList) {
            if (t.enabled==null) continue
            let args = ["rsync"]
            if (t.enabled) {
                args.push(...t.params)
                args.push(t.src)
                args.push(auth.genAuthPrefix(t.auth)+t.dst)
            }
            out.append(<text>Starting task: {t.id}</text>)
            console.log(args)
            // out.append(<text class="done">Done with result:{r.exit_status} and {r.term_signal}</text>);
        }
        // tracert = sys.spawn([cmd, "sciter.com"], { stdout: "pipe", stderr: "pipe" });
        // pipeReader(tracert.stdout, "stdout", out);
        // pipeReader(tracert.stderr, "stderr", out);
        // var r = await tracert.wait();
    } catch (e) {
        out.append(<text class="error">{e.message}</text>);
    }
})

document.on("click", "#test", async function () {
    // await auth.saveAuths();
    auth.loadAuths();
    console.log(auth.findAuth(1))

    let str = gconfig.sshCopyId(auth.findAuth(1))
    console.log(str)
    return;
})

function addTask() {
    let id = task.newTaskId()
    let t = {enabled: false, id: id, src: "", dst: "", auth: 0, params: []}

    document.state.disabled = true;

    var retval = Window.this.modal({
        url: __DIR__ + "task.html",
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
        t.enabled = el.checked
        task.saveTaskList()
    }
})

document.on("doubleclick", "#tsk", function (evt, el) {
    let id = Number(el.getAttribute("data"))
    let t = task.findTask(id)

    document.state.disabled = true;

    var retval = Window.this.modal({
        url: __DIR__ + "task.html",
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


document.on("contextmenu", "tbody", function (evt, el) {
    evt.source = Element.create(<menu.context>
        <li data="tcreate">create task</li>
      </menu>);
      return true;
})

document.on("contextmenu", "tbody>tr", function (evt, el) {
    let id = el.getAttribute("data")
    evt.source = Element.create(<menu.context>
        <li data="tcreate">create task</li>
        <li data="tremove" tid={id}>remove task</li>
      </menu>);
      return true;
})

document.on("click", "menu.context>li", function(evt, el){
    switch(el.getAttribute("data")) {
        case 'tcreate':
            addTask()
            break;
        case 'tremove':
            let id=evt.target.getAttribute("tid")
            task.removeTask(Number(id))
            document.$(`tbody>tr[data=${id}]`).remove()
            console.log(task.taskList)
            break;
    }
})