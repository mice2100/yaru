import * as uswitch from './uswitch.js';

export class WSwitchDialog extends Element {
    origSwitches = [];
    onOk = null;

    this(props) {
        this.origSwitches = props.switches || [];
        this.onOk = props.onOk || null;
        uswitch.initSwitches();
    }

    // ── helpers ──────────────────────────────────────────────────

    _swchInOrig(swch) {
        for (let osch of this.origSwitches) {
            if ((osch.short && swch.short && osch.short === swch.short)
                || (osch.switch && swch.switch && osch.switch === swch.switch)) {
                return osch;
            }
        }
        return undefined;
    }

    _collectSelected() {
        const arrSelected = [];
        for (let row of this.$$(".sw-row")) {
            if (row.$("#swsel").checked) {
                const sid = row.getAttribute("data");
                const sw = uswitch.findSwith(sid);
                if (sw) {
                    const nsw = Object.assign({}, sw);
                    nsw.info = undefined;
                    const paramEl = row.$("#param");
                    if (nsw.param && paramEl) {
                        nsw.param = paramEl.value;
                    }
                    arrSelected.push(nsw);
                }
            }
        }
        return arrSelected;
    }

    // ── lifecycle ────────────────────────────────────────────────

    componentWillUnmount() {
        if (this.onOk) {
            this.onOk(this._collectSelected());
        }
    }

    // ── render ──────────────────────────────────────────────────

    render() {
        const switches = uswitch.arraySwitches || [];

        const rows = switches.map(swch => {
            const oriSwch = this._swchInOrig(swch);
            const enabled = oriSwch ? true : false;
            const sid = swch.short || swch.switch || "";

            let shortLabel = null;
            let switchLabel = null;
            let paramInput = null;

            if (swch.short) {
                shortLabel = <span class="sw-short">-{swch.short},</span>;
            }
            if (swch.switch) {
                switchLabel = <span class="sw-switch">{swch.switch}</span>;
            }
            if (swch.param) {
                const paramVal = enabled ? String(oriSwch.param || swch.param) : String(swch.param);
                paramInput = <span class="sw-param"><input type="text" #param value={paramVal} style="width: 100dip;" /></span>;
            }

            return (
                <div class="sw-row" data={sid} title={swch.info} style="margin-right:8dip;">
                    <input #swsel type="checkbox" checked={enabled} style="margin-right: 4dip;" />
                    {shortLabel}
                    {switchLabel}
                    {paramInput}
                </div>
            );
        });

        return (
            <div style="flow: vertical; width: 520dip; height: 400dip; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 8dip; padding: 16dip;">

                {/* Title */}
                <div style="flow: horizontal; vertical-align: middle; height: 32dip; margin-bottom: 10dip;">
                    <b style="width: *; font-size: 12pt;">Rsync Switch Options</b>
                </div>

                {/* Switch list */}
                <div id="switches" style="flow: horizontal-wrap; overflow-y: scroll; height: *;">
                    {rows}
                </div>

            </div>
        );
    }
}
