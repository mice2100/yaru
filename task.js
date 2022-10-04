import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'
import * as auth from "./auth"
import * as utils from "./utils"
auth.loadAuths()

export var taskList = [{enabled: false, id: 10, src: "c:/Users/george/documents", dst: "backup/documents", auth: 1, params: ["-rv", "-t"]}]
/* id, src, dst, auth, [params] */

export function findTask(id) {
    return taskList.find(v=>v.id==id)
}

export function newTaskId() {
    taskList.sort( (a, b) => a.id-b.id)
    if (taskList.length>0)
        return taskList[taskList.length-1].id + 1
    else
        return 1
}

export function removeTask(id) {
    let idx = taskList.findIndex( v=>v.id==id)
    if (idx!=-1) {
        taskList.splice(idx, 1)
    }
}

export function loadTaskList() {
    let tl = utils.loadJson("tasklist.json")
    if (tl) taskList = tl
    else taskList = []
}

export function saveTaskList() {
    return utils.saveJson(taskList, "tasklist.json")
}

function init() {
    if (Window.this.parameters) {
        let tsk = Window.this.parameters
        if (tsk) {
            document.$("#enabled").value = tsk.enabled
            document.$("#id").textContent = tsk.id.toString()
            document.$("#src").value = tsk.src
            document.$("#dst").value = tsk.dst
            document.$("#params").value = tsk.params.join(" ")
            for (let a of auth.auths){
                document.$("#auth").select.options.append(<option value={a.id}>{auth.genAuthString(a.id)}</option>)
            }
            document.$("#auth").value = tsk.auth
        }
    }
}

init()

document.on("click", "#browse", function () {
        let tsk = Window.this.parameters
        let newFolder = Window.this.selectFolder({path: tsk.src})
        if(newFolder) {
            tsk.src = URL.toPath(newFolder)
            document.$("#src").value = tsk.src
        }
})

document.on("click", "#ok", function () {
    let tsk = Window.this.parameters
    tsk.enabled = document.$("#enabled").value
    tsk.src = document.$("#src").value
    tsk.dst = document.$("#dst").value
    tsk.params = document.$("#params").value.split(" ")
    tsk.auth = document.$("#auth").value

    Window.this.close(JSON.stringify(tsk))
})

document.on("click", "#cancel", function () {
    Window.this.close()
})