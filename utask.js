import * as utils from "./utils"

export var taskList = [{enabled: false, id: 10, src: "c:/Users/george/documents", dst: "backup/documents", auth: 1, params: ["-rv", "-t"], exclude:""}]
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