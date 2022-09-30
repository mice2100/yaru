import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'

export var auths = [{type:'ssh', host: 'SERVER', user: 'george', passwd: 'iamgeorge'}]

const conf_auth = env.path("home", ".yaru/auth.cfg")

export function loadAuths() {
    var cfg = sys.fs.readFileSync(conf_auth)
    sciter.decode(cfg)
    console.log(sciter.decode(cfg))
}

export async function saveAuths() {
    let f = await sys.fs.open(conf_auth, "w")
    if (f) {
        f.writeSync(JSON.stringify(auths))
        f.closeSync()
        return true
    } else{
        return false
    }
}

export function genAuthString(auth) {
    try {
        switch(auth.type) {
            case 'ssh':
                return `${auth.user}@${auth.host}:`
                break;
        }
    } catch (e) {
        console.error(e.message)
        return null
    }
} 