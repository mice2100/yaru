import * as utils from './utils'

var txtSwitches = [
    ["--verbose", "v", "increase verbosity"],
    ["--quiet", "q", "suppress non-error messages"],
    ["--no-motd", "suppress daemon-mode MOTD"],
    ["--checksum", "c", "skip based on checksum, not mod-time & size"],
    ["--archive", "a", "archive mode is -rlptgoD (no -A,-X,-U,-N,-H)"],
    ["--recursive", "r", "recurse into directories"],
    ["--relative", "R", "use relative path names"],
    ["--no-implied-dirs", "don't send implied dirs with --relative"],
    ["--backup", "b", "make backups (see --suffix & --backup-dir)"],
    ["--backup-dir=DIR", "make backups into hierarchy based in DIR"],
    ["--suffix=SUFFIX", "backup suffix (default ~ w/o --backup-dir)"],
    ["--update", "u", "skip files that are newer on the receiver"],
    ["--inplace", "update destination files in-place"],
    ["--append", "append data onto shorter files"],
    ["--append-verify", "--append w/old data in file checksum"],
    ["--dirs", "d", "transfer directories without recursing"],
    ["--old-dirs", "-old-d", "works like --dirs when talking to old rsync"],
    ["--mkpath", "create destination's missing path components"],
    ["--links", "l", "copy symlinks as symlinks"],
    ["--copy-links", "L", "transform symlink into referent file/dir"],
    ["--copy-unsafe-links", "only unsafe symlinks are transformed"],
    ["--safe-links", "ignore symlinks that point outside the tree"],
    ["--munge-links", "munge symlinks to make them safe & unusable"],
    ["--copy-dirlinks", "k", "transform symlink to dir into referent dir"],
    ["--keep-dirlinks", "K", "treat symlinked dir on receiver as dir"],
    ["--hard-links", "H", "preserve hard links"],
    ["--perms", "p", "preserve permissions"],
    ["--executability", "E", "preserve executability"],
    ["--chmod=CHMOD", "affect file and/or directory permissions"],
    ["--acls", "A", "preserve ACLs (implies --perms)"],
    ["--xattrs", "X", "preserve extended attributes"],
    ["--owner", "o", "preserve owner (super-user only)"],
    ["--group", "g", "preserve group"],
    ["--devices", "preserve device files (super-user only)"],
    ["--copy-devices", "copy device contents as a regular file"],
    ["--write-devices", "write to devices as files (implies --inplace)"],
    ["--specials", "preserve special files"],
    ["D", "same as --devices --specials"],
    ["--times", "t", "preserve modification times"],
    ["--atimes", "U", "preserve access (use) times"],
    ["--open-noatime", "avoid changing the atime on opened files"],
    ["--crtimes", "N", "preserve create times (newness)"],
    ["--omit-dir-times", "O", "omit directories from --times"],
    ["--omit-link-times", "J", "omit symlinks from --times"],
    ["--super", "receiver attempts super-user activities"],
    ["--fake-super", "store/recover privileged attrs using xattrs"],
    ["--sparse", "S", "turn sequences of nulls into sparse blocks"],
    ["--preallocate", "allocate dest files before writing them"],
    ["--dry-run", "n", "perform a trial run with no changes made"],
    ["--whole-file", "W", "copy files whole (w/o delta-xfer algorithm)"],
    ["--checksum-choice=STR", "choose the checksum algorithm (aka --cc)"],
    ["--one-file-system", "x", "don't cross filesystem boundaries"],
    ["--block-size=SIZE", "B", "force a fixed checksum block-size"],
    ["--rsh=COMMAND", "e", "specify the remote shell to use"],
    ["--rsync-path=PROGRAM", "specify the rsync to run on remote machine"],
    ["--existing", "skip creating new files on receiver"],
    ["--ignore-existing", "skip updating files that exist on receiver"],
    ["--remove-source-files", "sender removes synchronized files (non-dir)"],
    ["--del", "an alias for --delete-during"],
    ["--delete", "delete extraneous files from dest dirs"],
    ["--delete-before", "receiver deletes before xfer, not during"],
    ["--delete-during", "receiver deletes during the transfer"],
    ["--delete-delay", "find deletions during, delete after"],
    ["--delete-after", "receiver deletes after transfer, not during"],
    ["--delete-excluded", "also delete excluded files from dest dirs"],
    ["--ignore-missing-args", "ignore missing source args without error"],
    ["--delete-missing-args", "delete missing source args from destination"],
    ["--ignore-errors", "delete even if there are I/O errors"],
    ["--force", "force deletion of dirs even if not empty"],
    ["--max-delete=NUM", "don't delete more than NUM files"],
    ["--max-size=SIZE", "don't transfer any file larger than SIZE"],
    ["--min-size=SIZE", "don't transfer any file smaller than SIZE"],
    ["--max-alloc=SIZE", "change a limit relating to memory alloc"],
    ["--partial", "keep partially transferred files"],
    ["--partial-dir=DIR", "put a partially transferred file into DIR"],
    ["--delay-updates", "put all updated files into place at end"],
    ["--prune-empty-dirs", "m", "prune empty directory chains from file-list"],
    ["--numeric-ids", "don't map uid/gid values by user/group name"],
    ["--usermap=STRING", "custom username mapping"],
    ["--groupmap=STRING", "custom groupname mapping"],
    ["--chown=USER:GROUP", "simple username/groupname mapping"],
    ["--timeout=SECONDS", "set I/O timeout in seconds"],
    ["--contimeout=SECONDS", "set daemon connection timeout in seconds"],
    ["--ignore-times", "I", "don't skip files that match size and time"],
    ["--size-only", "skip files that match in size"],
    ["--modify-window=NUM", "@", "set the accuracy for mod-time comparisons"],
    ["--temp-dir=DIR", "T", "create temporary files in directory DIR"],
    ["--fuzzy", "y", "find similar file for basis if no dest file"],
    ["--compare-dest=DIR", "also compare destination files relative to DIR"],
    ["--copy-dest=DIR", "... and include copies of unchanged files"],
    ["--link-dest=DIR", "hardlink to files in DIR when unchanged"],
    ["--compress", "z", "compress file data during the transfer"],
    ["--compress-choice=STR", "choose the compression algorithm (aka --zc)"],
    ["--compress-level=NUM", "explicitly set compression level (aka --zl)"],
    ["--skip-compress=LIST", "skip compressing files with suffix in LIST"],
    ["--filter=RULE", "f", "add a file-filtering RULE"],
    ["F", "same as --filter='dir-merge /.rsync-filter' repeated: --filter='- .rsync-filter'"],
    ["--exclude=PATTERN", "exclude files matching PATTERN"],
    ["--exclude-from=FILE", "read exclude patterns from FILE"],
    ["--include=PATTERN", "don't exclude files matching PATTERN"],
    ["--include-from=FILE", "read include patterns from FILE"],
    ["--files-from=FILE", "read list of source-file names from FILE"],
    ["--from0", "0", "all *-from/filter files are delimited by 0s"],
    ["--old-args", "disable the modern arg-protection idiom"],
    ["--secluded-args", "s", "use the protocol to safely send the args"],
    ["--trust-sender", "trust the remote sender's file list"],
    ["--copy-as=USER[:GROUP]", "specify user & optional group for the copy"],
    ["--address=ADDRESS", "bind address for outgoing socket to daemon"],
    ["--port=PORT", "specify double-colon alternate port number"],
    ["--sockopts=OPTIONS", "specify custom TCP options"],
    ["--blocking-io", "use blocking I/O for the remote shell"],
    ["--outbuf=N|L|B", "set out buffering to None, Line, or Block"],
    ["--stats", "give some file-transfer stats"],
    ["--8-bit-output", "8", "leave high-bit chars unescaped in output"],
    ["--human-readable", "h", "output numbers in a human-readable format"],
    ["--progress", "show progress during transfer"],
    ["P", "same as --partial --progress"],
    ["--itemize-changes", "i", "output a change-summary for all updates"],
    ["--remote-option=OPT", "M", "send OPTION to the remote side only"],
    ["--out-format=FORMAT", "output updates using the specified FORMAT"],
    ["--log-file=FILE", "log what we're doing to the specified FILE"],
    ["--log-file-format=FMT", "log updates using the specified FMT"],
    ["--password-file=FILE", "read daemon-access password from FILE"],
    ["--early-input=FILE", "use FILE for daemon's early exec input"],
    ["--list-only", "list the files instead of copying them"],
    ["--bwlimit=RATE", "limit socket I/O bandwidth"],
    ["--stop-after=MINS", "Stop rsync after MINS minutes have elapsed"],
    ["--stop-at=y-m-dTh:m", "Stop rsync at the specified point in time"],
    ["--fsync", "fsync every written file"],
    ["--write-batch=FILE", "write a batched update to FILE"],
    ["--only-write-batch=FILE", "like --write-batch but w/o updating dest"],
    ["--read-batch=FILE", "read a batched update from FILE"],
    ["--protocol=NUM", "force an older protocol version to be used"],
    ["--iconv=CONVERT_SPEC", "request charset conversion of filenames"],
    ["--checksum-seed=NUM", "set block/file checksum seed (advanced)"]
]

class USwitch {
    constructor(info) {
        this.info = info[info.length - 1]
        this.short = undefined
        this.param = undefined
        for (let i = 0; i < info.length - 1; i++) {
            if (info[i].length == 1 && !this.short)
                this.short = info[i]
            if (info[i].startsWith("--")) {
                let pos = info[i].indexOf("=")
                if (pos >= 0 && !this.param) {
                    this.param = info[i].substr(pos + 1)
                    this.switch = info[i].substr(0, pos)
                } else {
                    this.switch = info[i]
                }
            }
        }
    }
}

export var arraySwitches = undefined

export function initSwitches() {
    if (arraySwitches) return //make sure init once
    arraySwitches = []
    txtSwitches.forEach((v) => {
        arraySwitches.push(new USwitch(v))
    })
    arraySwitches = arraySwitches.sort((a, b) => {
        let aa = a.param ? 1 : 0
        let bb = b.param ? 1 : 0
        return aa - bb
    })
}

export function cvtSwitches2Str(arrSwitch, asArray=false) {
    let short = []
    let ret = []
    arrSwitch.forEach(v => {
        if (v.short) {
            if (!v.param) short.push(v.short)
            else ret.push(`-${v.short}=${v.param}`)
        } else {
            if (!v.param) ret.push(v.switch)
            else {
                ret.push(`${v.switch}=${v.param}`)
            }
        }
    })
    if (short.length > 0) {
        ret = [`-${short.join("")}`, ...ret]
    }

    if(asArray) return ret
    else return ret.join("  ")
}

export function findSwith(strSwitch) {
    var ret = undefined
    if (strSwitch.length == 1) {
        arraySwitches.forEach(v => {
            if (v.short && v.short == strSwitch) {
                ret = v
                return
            }
        })
        return ret
    }
    // length>1
    arraySwitches.forEach(v => {
        if (strSwitch.startsWith(v.switch)) {
            ret = v
            return
        }
    })

    return ret
}

export function cvtStr2Switches(strSwitch) {
    var obj
    var ret = []
    let pos = strSwitch.indexOf("=")
    if (strSwitch.startsWith("--")) {
        let sw = findSwith(strSwitch)

        if (sw) {
            obj = new Object()
            Object.assign(obj, sw)
            obj.info = undefined
            if (pos >= 0) {
                obj.param = strSwitch.substr(pos + 1)
            }
            ret.push(obj)
        }
    } else if (strSwitch.startsWith("-")) {
        if (pos > 0) {
            let sw = findSwith(strSwitch[0])
            if (sw) {
                obj = new Object()
                Object.assign(obj, sw)
                obj.info = undefined
                obj.param = strSwitch.substr(pos + 1)
                ret.push(obj)
            }
        } else {
            for (let i = 1; i < strSwitch.length; i++) {
                let sw = findSwith(strSwitch[i])
                if (sw) {
                    obj = new Object()
                    Object.assign(obj, sw)
                    obj.info = undefined
                    ret.push(obj)
                }
            }
        }
    }
    return ret
}