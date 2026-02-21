import * as uconfig from './uconfig.js';
import * as env from '@env';

export class DaemonModuleList extends Element {
    daemon = null;

    this(props) {
        this.daemon = props.daemon || null;
    }

    ["on change at .field-daemon-port"](evt, el) {
        this.daemon.port = Number(el.value) || 873;
        return true;
    }

    ["on change at li.module-item"](evt, el) {
        const idx = Number(el.getAttribute("data"));
        const m = this.daemon.modules[idx];
        m.module = el.$(".field-module").value;
        m.path = el.$(".field-path").value;
        m.readonly = el.$(".field-readonly").checked;
        m.writeonly = el.$(".field-writeonly").checked;
        return true;
    }

    ["on click at .btn-new-module"](evt, el) {
        let newModule = uconfig.newDaemonModule();
        this.daemon.modules.push(newModule);
        this.componentUpdate();
        this.requestPaint();

    }

    ["on click at .btn-remove-module"](evt, el) {
        const idx = Number(el.$p(".module-item").getAttribute("data"));
        this.daemon.modules.splice(idx, 1);
        this.componentUpdate();
        this.requestPaint();
    }

    ["on click at .btn-browse-module"](evt, el) {
        const idx = Number(el.getAttribute("data"));
        const elpath = el.parentElement.$(".field-path");
        const newFolder = Window.this.selectFolder({ path: elpath.value });
        if (newFolder) {
            elpath.value = URL.toPath(newFolder);
            this.daemon.modules[idx].path = elpath.value;
        }
    }

    render() {
        const modules = this.daemon.modules || [];

        return (
            <div class="modulelist">
                <div style="flow: horizontal; vertical-align: middle; margin-bottom: 12dip;">
                    <div style="flow: horizontal; vertical-align: middle; width: *; line-height: 32dip;">
                        <b style="margin-right: 12dip;">Daemon Config:</b>
                    </div>
                    <label style="margin-right: 4dip; line-height: 32dip;">Port:</label>
                    <input type="text" class="field-daemon-port" value={this.daemon.port || 873} style="height: 32dip; width: 60dip; margin-right: 12dip; vertical-align: middle;" />
                    <button class="btn linebtn btn-new-module" style="height: 32dip; vertical-align: middle;"><i.i_add />New</button>
                </div>
                <ul class="module-list" style="border-spacing: 8dip;">
                    {modules.map((m, idx) => (
                        <li class="module-item" data={idx} style="flow: horizontal; vertical-align: middle; height: 36dip; border-spacing: 8dip;">
                            <input type="text" class="field-module" value={m.module} style="height: 32dip;" />
                            <input class="urlipt field-path" value={m.path} style="height: 32dip;" />
                            <button class="btn greybtn btn-browse-module" data={idx} style="height: 32dip; min-width: 70dip;">Select...</button>
                            <span style="flow: horizontal; vertical-align: middle; border-spacing: 4dip;">
                                <input type="checkbox" class="field-readonly" checked={m.readonly || false} />
                                <label for="readonly" title="Read Only">RO</label>
                            </span>
                            <span style="flow: horizontal; vertical-align: middle; border-spacing: 4dip;">
                                <input type="checkbox" class="field-writeonly" checked={m.writeonly || false} />
                                <label for="writeonly" title="Write Only">WO</label>
                            </span>
                            <button class="ibtn btn-remove-module" data={idx} style="height: 32dip; width: 32dip;"><i class="i_del" /></button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}
