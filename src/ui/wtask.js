import * as utils from "./utils"
import * as uconfig from "./uconfig"
import { uexclude } from "./uexclude"
import * as uswitch from "./uswitch"
import * as env from "@env"

uconfig.loadCfg()

// for debug only
uswitch.initSwitches()
// let id = task.newTaskId()
// var tsk = { enabled: true, id: id, src: "", dst: "", auth: 0, params: [] }
var tsk = Window.this.parameters
// console.log(tsk)

function init() {
    // if (Window.this.parameters) {
        // let tsk = Window.this.parameters
        if (tsk) {
            document.$("#enabled").value = tsk.enabled
            document.$("#id").textContent = tsk.id.toString()
            document.$("#src").value = tsk.src
            document.$("#dst").value = tsk.dst
            document.$("#params").value = uswitch.cvtSwitches2Str(tsk.params)
            for (let a of uconfig.configs.auths) {
                document.$("#authsrc").append(<option value={a.id}>{uconfig.genAuthString(a.id)}</option>)
                document.$("#authdst").append(<option value={a.id}>{uconfig.genAuthString(a.id)}</option>)
            }
            document.$("#authsrc").value = tsk.authsrc
            document.$("#authdst").value = tsk.authdst
            document.$("#exclude").value = tsk.exclude
        }
    // }
}

init()

document.on("click", "#browsesrc", function () {
    // let tsk = Window.this.parameters
    let newFolder = Window.this.selectFolder({ path: tsk.src })
    if (newFolder) {
        tsk.src = URL.toPath(newFolder)
        document.$("#src").value = tsk.src
    }
})
document.on("click", "#browsedst", function () {
    // let tsk = Window.this.parameters
    let newFolder = Window.this.selectFolder({ path: tsk.dst })
    if (newFolder) {
        tsk.dst = URL.toPath(newFolder)
        document.$("#dst").value = tsk.dst
    }
})

document.on("click", "#import", function () {
    // let tsk = Window.this.parameters
    tsk.exclude = document.$("#exclude").value
    let startPath = utils.getDataPath()
    if(env.PLATFORM==="Windows") startPath += "/*.excl"
    let profile = Window.this.selectFile({ mode: "open", caption: "Select profile", path: startPath, filter: "exclude file(*.excl)|*.excl" })
    if (profile) {
        let excl = uexclude.loadProfile(URL.toPath(profile))
        if(!tsk.exclude) tsk.exclude=""
        let excludes = new Set(tsk.exclude.split(' '))
        for(let e of excl) {
            excludes.add(e)
        }
        tsk.exclude = Array.from(excludes).join(' ').trim()
        document.$("#exclude").value = tsk.exclude
    }
})

document.on("click", "#export", function () {
    // let tsk = Window.this.parameters
    tsk.exclude = document.$("#exclude").value
    let startPath = utils.getDataPath("*.excl")
    let profile = Window.this.selectFile({ mode: "save", caption: "Save as profile", path: startPath, filter: "exclude file(*.excl)|*.excl" })
    if (profile) {
        uexclude.saveProfile(tsk.exclude.split(" "), URL.toPath(profile))
    }
})

document.on("click", "#ok", function () {
    // let tsk = Window.this.parameters
    tsk.enabled = document.$("#enabled").value
    tsk.src = document.$("#src").value
    tsk.dst = document.$("#dst").value
    let strArrSwich = document.$("#params").value.split("  ")
    tsk.params = []
    strArrSwich.forEach(v=>{
        let sws = uswitch.cvtStr2Switches(v)
        tsk.params.push(...sws)
    })
    tsk.authsrc = document.$("#authsrc").value
    tsk.authdst = document.$("#authdst").value
    tsk.exclude = document.$("#exclude").value

    // console.log(JSON.stringify(tsk))

    Window.this.close(JSON.stringify(tsk))
})

document.on("click", "#swap", function () {
    let tmp = document.$("#src").value
    let tmpauth = document.$("#authsrc").value

    document.$("#src").value = document.$("#dst").value
    document.$("#authsrc").value = document.$("#authdst").value
    document.$("#dst").value = tmp
    document.$("#authdst").value = tmpauth
})

document.on("click", "#cancel", function () {
    Window.this.close()
})

document.on("click", "#swch", function () {
    let arrSwch = []
    let strArrSwich = document.$("#params").value.split("  ")
    strArrSwich.forEach(v=>{
        let sws = uswitch.cvtStr2Switches(v)
        arrSwch.push(...sws)
    })

    var retval = Window.this.modal({
        url: __DIR__ + "wswitch.html",
        alignment: -5,
        parameters: arrSwch
    })

    if (retval) {
        let t = JSON.parse(retval)
        tsk.params = t
        document.$("#params").value = uswitch.cvtSwitches2Str(t)
    }
})