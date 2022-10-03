import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'
import * as utils from './utils'

export var auths = [{id: 1, type:'ssh', host: '192.168.12.11', user: 'george', passwd: 'george'}]

export function loadAuths() {
    let a = utils.loadJson("auth.cfg")
    if (a) {
        auths = a
        return true
    } else {
        return false
    }
}

export async function saveAuths() {
    return utils.saveJson(auths, "auth.cfg")
}

export function genAuthString(id) {
    try {
        let auth = findAuth(id)
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

export function maxAuthID() {
    auths.sort((a, b) => a.id-b.id)
    return auths[auths.length-1].id
}

export function findAuth(id) {
    return auths.find( v=>v.id==id)
}