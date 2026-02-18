import * as uconfig from './uconfig.js';
import * as env from '@env';

export class DaemonModuleList extends Element {
    modules = [];

    this(props) {
        this.modules = props.modules || [];
    }

    ["on change at li.module-item"](evt, el) {
        const idx = Number(el.getAttribute("data"));
        const m = this.modules[idx];
        m.module = el.$(".field-module").value;
        m.path = el.$(".field-path").value;
        m.readonly = el.$(".field-readonly").checked;
        m.writeonly = el.$(".field-writeonly").checked;
        return true;
    }

    ["on click at .btn-new-module"](evt, el) {
      let newModule = uconfig.newDaemonModule();
      this.modules.push(newModule);
      this.componentUpdate();
      this.requestPaint();

    }

    ["on click at .btn-remove-module"](evt, el) {
      const idx = Number(el.$p(".module-item").getAttribute("data"));
      this.modules.splice(idx, 1);
      this.componentUpdate();
      this.requestPaint();
    }

    ["on click at .btn-browse-module"](evt, el) {
        const idx = Number(el.getAttribute("data"));
        const elpath = el.parentElement.$(".field-path");
        const newFolder = Window.this.selectFolder({ path: elpath.value });
        if (newFolder) {
            elpath.value = URL.toPath(newFolder);
            this.modules[idx].path = elpath.value;
        }
    }

    render() {
        const modules = this.modules || [];

        return (
            <div .modulelist>
                <div style="flow: horizontal; vertical-align: middle; height: 40dip; margin-bottom: 12dip;">
                    <div style="flow: horizontal; vertical-align: middle; width: *;">
                        <b style="margin-right: 12dip;">Daemon Config:</b>
                    </div>
                    <button .btn linebtn .btn-new-module style="height: 32dip;"><i .i_add />New</button>
                </div>
                <ul .module-list style="border-spacing: 8dip;">
                    {modules.map((m, idx) => (
                        <li .module-item data={idx} style="flow: horizontal; vertical-align: middle; height: 36dip; border-spacing: 8dip;">
                            <input|text .field-module value={m.module} style="height: 32dip;" />
                            <input .urlipt .field-path value={m.path} style="height: 32dip;" />
                            <button .btn greybtn .btn-browse-module data={idx} style="height: 32dip; min-width: 70dip;">Select...</button>
                            <span style="flow: horizontal; vertical-align: middle; border-spacing: 4dip;">
                                <input type="checkbox" .field-readonly checked={m.readonly || false} />
                                <label for="readonly">RO</label>
                            </span>
                            <span style="flow: horizontal; vertical-align: middle; border-spacing: 4dip;">
                                <input type="checkbox" .field-writeonly checked={m.writeonly || false} />
                                <label for="writeonly">WO</label>
                            </span>
                            <button .ibtn .btn-remove-module data={idx} style="height: 32dip; width: 32dip;"><i .i_del /></button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}
