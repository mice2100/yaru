import * as uconfig from './uconfig.js';
import * as uswitch from './uswitch.js';
import * as env from '@env';
import { uexclude } from './uexclude.js';
import { WTaskDialog } from './WTaskDialog.js';

export class TaskTable extends Element {
    taskList = [];

    this(props) {
        this.taskList = uconfig.configs.taskList || [];
    }

    // ── public API ─────────────────────────────────────────────

    addTask() {
        let id = uconfig.newTaskId();
        let exclude = uexclude.defaultExcludes();
        let t = { enabled: false, id: id, src: "", dst: "", authsrc: 1, authdst: 1, params: [], exclude: exclude.join(" ") };
        if (id === 1) {
            t.src = URL.toPath(env.path("documents"));
        }

        document.popup(
            <WTaskDialog tsk={t} onOk={(saved) => {
                uconfig.configs.taskList.push(saved);
                uconfig.saveCfg();
                this.componentUpdate();
            }} />,
            { anchorAt: 5, animationType: "blend" }
        );
    }

    // ── internal event handlers ────────────────────────────────

    ["on change at #sel"](evt, el) {
        let id = Number(el.$p("tr").getAttribute("data"));
        let t = uconfig.findTask(id);
        if (t) {
            t.enabled = el.checked;
            uconfig.saveCfg();
        }
    }

    ["on click at #edittask"](evt, el) {
        let id = Number(el.getAttribute("tid"));
        let t = uconfig.findTask(id);

        document.popup(
            <WTaskDialog tsk={t} onOk={(saved) => {
                let t0 = uconfig.findTask(id);
                Object.assign(t0, saved);
                uconfig.saveCfg();
                this.componentUpdate();
            }} />,
            { anchorAt: 5, animationType: "blend" }
        );
    }

    ["on click at #rmtask"](evt, el) {
        let id = Number(el.getAttribute("tid"));
        uconfig.removeTask(id);
        uconfig.saveCfg();
        this.componentUpdate();
    }

    // ── render ─────────────────────────────────────────────────

    render() {
        const taskList = uconfig.configs.taskList || [];

        return (
            <table>
                <thead>
                    <tr>
                        <th value="1">Enable</th>
                        <th value="2">ID</th>
                        <th value="3">Src</th>
                        <th value="4">Dest</th>
                        <th value="5">Params</th>
                        <th value="6">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {taskList.map(t =>
                        <tr data={t.id}>
                            <td><input #sel type="checkbox" checked={t.enabled} /></td>
                            <td>{t.id}</td>
                            <td>{uconfig.genAuthString(t.authsrc)}|{t.src}</td>
                            <td>{uconfig.genAuthString(t.authdst)}|{t.dst}</td>
                            <td>{uswitch.cvtSwitches2Str(t.params)}</td>
                            <td>
                                <button class="ibtn" #edittask title="Edit" tid={t.id}><i.i_edit /></button>
                                <button class="ibtn" #rmtask title="Delete" tid={t.id}><i.i_del /></button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        );
    }
}
