import * as uconfig from './uconfig.js';
import * as sys from '@sys';
import * as utils from './utils.js';

export class AuthTable extends Element {
    auths = [];
    sshroot = "";
    keyexists = false;

    this(props) {
        this.auths = props.auths || [];
        this.sshroot = props.sshroot || "";
        this.keyexists = props.keyexists || false;
    }

    // Delete button handler
    ["on click at #delete"](evt, el) {
        const tr = el.$p("tr");
        const id = Number(tr.getAttribute("data"));
        uconfig.removeAuth(id);
        this.componentUpdate();
    }

    // Install Key button handler
    ["on click at #install"](evt, el) {
        const tr = el.$p("tr");
        const id = Number(tr.getAttribute("data"));
        const a = uconfig.findAuth(id);
        const publicID = uconfig.sshPublicId();
        if (publicID) {
            Clipboard.writeText(publicID);
            Window.this.modal(<info>The public ID has been copied to clipboard. Please ask an administrator to add it to authorized_keys on the server.</info>);
        }
    }

    // Test button handler
    ["on click at #test"](evt, el) {
        const tr = el.$p("tr");
        const id = Number(tr.getAttribute("data"));
        const a = uconfig.findAuth(id);
        const port = a.port || 22;
        const cmd = ['rsync', '-vn', './', `${a.user}@${a.host}:`, '-e', `ssh -p ${port}`];
        const processRsync = sys.spawn(cmd, { stderr: "pipe", stdout: "pipe" });

        async function runTest() {
            function fnNewLine(data) {
                // console.log(data);
            }
            const pout = utils.pipeReader(processRsync.stdout, "stdout", fnNewLine);
            const perr = utils.pipeReader(processRsync.stderr, "stderr", fnNewLine);

            const r = await processRsync.wait();
            processRsync.stderr.close();
            processRsync.stdout.close();
            await pout;
            await perr;

            const msg = r.exitCode ? "Failed" : "Succeed";
            Window.this.modal(msg);
        }

        runTest();
    }

    // Type change handler
    ["on change at .auth-type-select"](evt, el) {
        const tr = el.$p("tr");
        const id = Number(tr.getAttribute("data"));
        const a = uconfig.findAuth(id);
        a.type = el.value;
        this.componentUpdate();
    }

    // Generate SSH Key button handler
    ["on click at #btngen"](evt, el) {
        (async () => {
            await uconfig.genSSHKey();
            this.keyexists = uconfig.configs.ssh.keyexists;
            this.componentUpdate();
        })();
    }

    // New auth button handler
    ["on click at #newauth"](evt, el) {
        uconfig.newAuth();
        this.auths = uconfig.configs.auths;
        this.componentUpdate();
    }

    // Field value change handlers
    ["on change at .field-host"](evt, el) {
        const tr = el.$p("tr");
        const id = Number(tr.getAttribute("data"));
        const a = uconfig.findAuth(id);
        a.host = el.value;
    }

    ["on change at .field-user"](evt, el) {
        const tr = el.$p("tr");
        const id = Number(tr.getAttribute("data"));
        const a = uconfig.findAuth(id);
        a.user = el.value;
    }

    ["on change at .field-port"](evt, el) {
        const tr = el.$p("tr");
        const id = Number(tr.getAttribute("data"));
        const a = uconfig.findAuth(id);
        a.port = el.value;
    }

    render(props, kids) {
        const auths = props.auths || this.auths || [];
        const sshroot = props.sshroot || this.sshroot || "";
        const keyexists = props.keyexists !== undefined ? props.keyexists : this.keyexists;

        return (
            <div style="flow: vertical;">
                {/* SSH Key Folder Section */}
                <div style="flow: horizontal; vertical-align: middle; height: 40dip; margin-bottom: 16dip;">
                    <div style="flow: horizontal; vertical-align: middle; width: *;">
                        <b style="margin-right: 8dip;">SSH Key folder:</b>
                        <span id="sshroot" style="color: var(--text-secondary);">{sshroot}</span>
                    </div>
                    {!keyexists && <button class="btn greybtn" #btngen style="height: 32dip; margin-left: 12dip;">Generate</button>}
                </div>

                {/* Auths Header Section */}
                <div style="flow: horizontal; vertical-align: middle; height: 40dip; margin-bottom: 16dip;">
                    <div style="flow: horizontal; vertical-align: middle; width: *;">
                        <b style="margin-right: 12dip;">Auths:</b>
                    </div>
                    <button.btn.linebtn #newauth style="height: 32dip;"><i.i_add />New</button>
                </div>

                {/* Auths Table */}
                <table class="configtable">
                    <thead>
                        <tr>
                            <th value="1">ID</th>
                            <th value="2">Type</th>
                            <th value="3">Host</th>
                            <th value="4">User</th>
                            <th value="5">Port</th>
                            <th value="6">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auths.map(a => {
                            let actions = <div>
                                <button title="Delete" class="ibtn" #delete> <i class="i_del"></i></button>
                                {a.type === "ssh" && <button title="Install Key" class="ibtn" #install> <i class="i_istall"></i></button>}
                                {a.type === "ssh" && <button title="Test" class="ibtn" #test><i class="i_test"></i>{a.type}</button>}
                            </div>
                            return (
                                <tr data={a.id}>
                                    <td>{String(a.id)}</td>
                                    <td>
                                        <select type="dropdown" class="auth-type-select">
                                            {["ssh", "local", "rsync"].map(t => {
                                                if (t === a.type) {
                                                    return <option value={t} selected>{t}</option>
                                                } else {
                                                    return <option value={t}>{t}</option>
                                                }
                                            })}
                                        </select>
                                    </td>
                                    <td>
                                        {a.type !== "local" && <input type="text" class="field-host" value={a.host}> </input>}
                                    </td>
                                    <td>
                                        {a.type !== "local" && <input type="text" class="field-user" value={a.user}> </input>}
                                    </td>
                                    <td>
                                        {a.type !== "local" && <input type="text" class="field-port" value={a.port}> </input>}
                                    </td >
                                    <td>
                                        {actions}
                                    </td >
                                </tr >
                            );
                        })}
                    </tbody>
                </table >
            </div >
        );
    }
}
