import * as sys from '@sys'
import * as env from '@env'
import * as sctr from '@sciter'
import * as utils from './utils'

class UExclude {
    constructor() {
        this.cvs = []
    }

    listProfiles() {
        let folder = utils.getDataPath()
        let fnlist = sys.fs.sync.readdir(folder)
        let ret = []
        fnlist.forEach(element => {
            if (element.type == sys.fs.UV_DIRENT_FILE && element.name.toLowerCase().endsWith(".excl")) {
                ret.push(`${folder}/${element.name}`)
            }
        })
        return ret
    }

    loadProfile(profile) {
        profile = profile || utils.getDataPath('myexcludes.excl')
        let cnt = sctr.decode(sys.fs.readFileSync(profile))
        if (!cnt) return undefined

        let lns = cnt.split("\n")
        let ret = []
        lns.forEach((v) => {
            let vv = v.trim()
            if (vv.includes(' ')) {
                ret.push(`"${vv}"`)
            } else {
                if(vv) ret.push(vv)
            }
        })
        return ret
    }

    saveProfile(excludes, profile) {
        let f = sys.fs.sync.open(profile, "w")
        if (!f) return false
        for (let ln of excludes) {
            if (ln)
                f.writeSync(`${ln}\n`)
        }
        f.closeSync()

        return true
    }

    defaultExcludes() {
        let excl = "tmp venv *.db node_modules *.lnk .git"
        return excl.split(" ")
    }
}

export var uexclude = new UExclude()
