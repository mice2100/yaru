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
                <span>
                    <b>Daemon Config:</b>
                    <button .btn linebtn .btn-new-module><i .i_add />New</button>
                </span>
                <ul .module-list>
                    {modules.map((m, idx) => (
                        <li .module-item data={idx}>
                            <input|text .field-module value={m.module} />
                            <input .urlipt .field-path value={m.path} />
                            <button .btn greybtn .btn-browse-module data={idx}>Select...</button>
                            <span>
                                <input type="checkbox" .field-readonly checked={m.readonly || false} />
                                <label for="readonly">read only</label>
                            </span>
                            <span>
                                <input type="checkbox" .field-writeonly checked={m.writeonly || false} />
                                <label for="writeonly">write only</label>
                            </span>
                            <button .ibtn .btn-remove-module data={idx}><i .i_del /></button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}
