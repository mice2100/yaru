import * as uconfig from './uconfig.js';
import * as sys from '@sys';
import * as utils from './utils.js';

export class AuthTable extends Element {
    auths = [];

    this(props) {
        this.auths = props.auths || [];
    }

    // Delete button handler
    ["on click at .btn-delete"](evt, el) {
        const tr = el.$p("tr");
        const id = Number(tr.getAttribute("data"));
        uconfig.removeAuth(id);
        this.componentUpdate({ auths: uconfig.configs.auths });
    }

    // Install Key button handler
    ["on click at .btn-install"](evt, el) {
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
    ["on click at .btn-test"](evt, el) {
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

        // Update field visibility based on type
        const isLocal = a.type === "local";
        const isSsh = a.type === "ssh";

        tr.$(".field-host").style.display = isLocal ? "none" : "inline-block";
        tr.$(".field-user").style.display = isLocal ? "none" : "inline-block";
        tr.$(".field-port").style.display = isLocal ? "none" : "inline-block";
        tr.$(".btn-install").style.display = isSsh ? "inline-block" : "none";
        tr.$(".btn-test").style.display = isSsh ? "inline-block" : "none";
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

        return (
            <table class="configtable">
                <thead>
                    <th value="1">ID</th>
                    <th value="2">Type</th>
                    <th value="3">Host</th>
                    <th value="4">User</th>
                    <th value="5">Port</th>
                    <th value="6">Actions</th>
                </thead>
                <tbody>
                    {auths.map(a => {
                        const isLocal = a.type === "local";
                        const isSsh = a.type === "ssh";
                        return (
                            <tr data={a.id}>
                                <td>{String(a.id)}</td>
                                <td>
                                    <select|dropdown .auth-type-select value={a.type}>
                                        <option value="ssh">ssh</option>
                                        <option value="local">local</option>
                                        <option value="rsync">rsync</option>
                                    </select>
                                </td>
                                <td>
                                    <input|text .field-host value={a.host}  />
                                </td>
                                <td>
                                    <input|text .field-user value={a.user}  />
                                </td>
                                <td>
                                    <input|text .field-port value={a.port}  />
                                </td>
                                <td>
                                    <button title="Delete" .ibtn .btn-delete><i .i_del /></button>
                                    <button title="Install Key" .ibtn .btn-install><i .i_istall /></button>
                                    <button title="Test" .ibtn .btn-test><i .i_test /></button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    }
}
