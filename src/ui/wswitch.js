import * as uswitch from "./uswitch"

const elSwitches = document.$("div#switches")
var origSwches = Window.this.parameters
// var origSwches = []

function swchInOrig(swch) {
    for (let osch of origSwches) {
        if ((osch.short && swch.short && osch.short == swch.short)
            || (osch.switch && swch.switch && osch.switch == swch.switch)) {
            return osch
        }
    }
    return undefined
}

function genSwitchReact(swch) {
    var elParam, elShort, elSwch
    var oriSwch = swchInOrig(swch)
    var enabled = oriSwch ? true : false
    var sid

    if (swch.short) {
        elShort = <span #elshort>-{swch.short},</span>
        sid = swch.short
    }
    if (swch.switch) {
        elSwch = <span #elswch>{swch.switch}</span>
        if (!sid) sid = swch.switch
    }
    if (swch.param) {
        elParam = <span><input|text #param value={enabled ? oriSwch.param : swch.param} /></span>;
    }
    return <div #sw data={sid} title={swch.info}><input #sel type="checkbox" value={enabled} />{elShort}{elSwch}{elParam}</div>
}

function init() {
    elSwitches.clear()
    uswitch.initSwitches()
    for (let t of uswitch.arraySwitches) {
        elSwitches.append(genSwitchReact(t))
    }
}

init()

document.on("click", "#ok", function () {
    var arrSelected = []

    for (let el of document.$$("#sw")) {
        if (el.$("#sel").value) {
            let sw = uswitch.findSwith(el.getAttribute("data"))
            if (sw) {
                let nsw = {}
                Object.assign(nsw, sw)
                nsw.info = undefined
                if (nsw.param) {
                    nsw.param = el.$("#param").value
                }
                arrSelected.push(nsw)
            }
        }
    }
    // console.log(JSON.stringify(arrSelected))

    Window.this.close(JSON.stringify(arrSelected))
})

document.on("click", "#cancel", function () {
    Window.this.close()
})