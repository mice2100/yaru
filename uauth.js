import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'
import * as utils from './utils'

export var auths = []

export function loadAuths() {
    let a = utils.loadJson("auth.cfg")
    if (a) {
        auths = a
        return true
    } else {
        return false
    }
}

export function saveAuths() {
    return utils.saveJson(auths, "auth.cfg")
}

export function genAuthString(id) {
    let auth = findAuth(id)
    switch (auth.type) {
        case 'ssh':
            return `ssh:${auth.user}@${auth.host}`
        case 'local':
            return 'local:'
        case 'rsync':
            return `rsync:${auth.user}@${auth.host}`
    }
}

export function genAuthPrefix(id) {
    let auth = findAuth(id)
    switch (auth.type) {
        case 'ssh':
            return `${auth.user}@${auth.host}:`
        case 'local':
            return ''
        case 'rsync':
            return `${auth.host}::`
    }
}

export async function genAuthPassfile(id) {
    var ret
    let auth = findAuth(id)
    if(auth &&auth.type=='rsync'){
        let fn = utils.getDataPath(`passwd.${id}`)
        if(sys.fs.statSync(fn)) {
            await sys.fs.unlink(fn)
        }
        let f = await sys.fs.open(fn, "w")
        await f.write(auth.passwd)
        await f.close()
        await sys.fs.chmod(fn, 600)
        ret = "--password-file="+fn
    }

    return ret
}


export function maxAuthID() {
    auths.sort((a, b) => a.id - b.id)
    if (auths.length <= 0) return 0
    return auths[auths.length - 1].id
}

export function findAuth(id) {
    return auths.find(v => v.id == id)
}

export function newAuth() {
    let id = maxAuthID() + 1
    let a = { id: id, type: "ssh", host: "", user: "" }
    auths.push(a)
    return a
}

export function removeAuth(id) {
    let idx = auths.findIndex(v => v.id == id)
    if (idx != -1) {
        auths.splice(idx, 1)
    }
}