import * as utils from './utils.js';
import * as uconfig from './uconfig.js';
import { uexclude } from './uexclude.js';
import * as uswitch from './uswitch.js';
import * as env from '@env';
import { WSwitchDialog } from './WSwitchDialog.js';

export class WTaskDialog extends Element {
    tsk = null;
    auths = [];

    this(props) {
        this.tsk = props.tsk ? Object.assign({}, props.tsk) : null;
        this.auths = uconfig.configs.auths || [];
        this.onOk = props.onOk || null;
        this.onCancel = props.onCancel || null;
        uswitch.initSwitches();
    }

    // ── event handlers ──────────────────────────────────────────

    ["on click at #browsesrc"](evt, el) {
        let newFolder = Window.this.selectFolder({ path: this.tsk.src });
        if (newFolder) {
            this.tsk.src = URL.toPath(newFolder);
            this.componentUpdate();
        }
    }

    ["on click at #browsedst"](evt, el) {
        let newFolder = Window.this.selectFolder({ path: this.tsk.dst });
        if (newFolder) {
            this.tsk.dst = URL.toPath(newFolder);
            this.componentUpdate();
        }
    }

    ["on click at #import"](evt, el) {
        this.tsk.exclude = this.$('#exclude').value;
        let startPath = utils.getDataPath();
        if (env.PLATFORM === "Windows") startPath += "/*.excl";
        let profile = Window.this.selectFile({
            mode: "open",
            caption: "Select profile",
            path: startPath,
            filter: "exclude file(*.excl)|*.excl"
        });
        if (profile) {
            let excl = uexclude.loadProfile(URL.toPath(profile));
            if (!this.tsk.exclude) this.tsk.exclude = "";
            let excludes = new Set(this.tsk.exclude.split(' '));
            for (let e of excl) excludes.add(e);
            this.tsk.exclude = Array.from(excludes).join(' ').trim();
            this.componentUpdate();
        }
    }

    ["on click at #export"](evt, el) {
        this.tsk.exclude = this.$('#exclude').value;
        let startPath = utils.getDataPath("*.excl");
        let profile = Window.this.selectFile({
            mode: "save",
            caption: "Save as profile",
            path: startPath,
            filter: "exclude file(*.excl)|*.excl"
        });
        if (profile) {
            uexclude.saveProfile(this.tsk.exclude.split(" "), URL.toPath(profile));
        }
    }

    ["on click at #swap"](evt, el) {
        let tmpSrc = this.tsk.src;
        let tmpAuth = this.tsk.authsrc;
        this.tsk.src = this.tsk.dst;
        this.tsk.authsrc = this.tsk.authdst;
        this.tsk.dst = tmpSrc;
        this.tsk.authdst = tmpAuth;
        this.componentUpdate();
        this.$("#authsrc").value = this.tsk.authsrc;
        this.$("#authdst").value = this.tsk.authdst;
    }

    ["on change at #authsrc"](evt, el) {
        this.tsk.authsrc = Number(el.value);
        this.componentUpdate();
    }

    ["on change at #authdst"](evt, el) {
        this.tsk.authdst = Number(el.value);
        this.componentUpdate();
    }

    ["on click at #swch"](evt, el) {
        let arrSwch = uswitch.cvtStr2Switches(this.$('#params').value);

        this.popup(
            <WSwitchDialog switches={arrSwch} onOk={(selected) => {
                this.tsk.params = selected;
                this.componentUpdate();
            }} />,
            { anchorAt: 5, animationType: "blend" }
        );
    }

    ["on click at #ok"](evt, el) {
        // collect current input values into tsk
        const tsk = this.tsk;
        tsk.enabled = this.$('#enabled').value === "true" || this.$('#enabled').value === true;
        tsk.src = this.$('#src').value;
        tsk.dst = this.$('#dst').value;
        tsk.authsrc = this.$('#authsrc').value;
        tsk.authdst = this.$('#authdst').value;
        tsk.exclude = this.$('#exclude').value;

        let strArrSwich = this.$('#params').value.split("  ");
        tsk.params = [];
        strArrSwich.forEach(v => {
            let sws = uswitch.cvtStr2Switches(v);
            tsk.params.push(...sws);
        });

        if (this.onOk) this.onOk(Object.assign({}, tsk));
        if (this.onCancel) this.onCancel();
    }

    ["on click at #cancel"](evt, el) {
        if (this.onCancel) this.onCancel();
    }

    // ── render ──────────────────────────────────────────────────

    render() {
        const tsk = this.tsk;
        const auths = this.auths;

        const authOptions = auths.map(a =>
            <option value={a.id}>{uconfig.genAuthString(a.id)}</option>
        );

        return (
            <div style="flow: vertical; width: 680dip; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 8dip; padding: 20dip;">

                {/* Title */}
                <div style="flow: horizontal; vertical-align: middle; height: 36dip; margin-bottom: 12dip;">
                    <b style="width: *; font-size: 14pt;">Task Configuration</b>
                </div>

                <div class="taskmain" style="flow: vertical;">

                    {/* Enabled */}
                    <div style="flow: horizontal; vertical-align: middle; margin-bottom: 8dip; height: 32dip;">
                        <span style="width: 70dip; line-height: 32dip;">Enabled:</span>
                        <toggle #enabled value={tsk ? tsk.enabled : false} style="height: 32dip;"><option value="false"></option><option value="true"></option></toggle>
                    </div>

                    {/* ID */}
                    <div style="flow: horizontal; vertical-align: middle; margin-bottom: 8dip; height: 32dip;">
                        <span style="width: 70dip; line-height: 32dip;">ID:</span>
                        <label #id style="color: var(--text-secondary); line-height: 32dip;">{tsk ? String(tsk.id) : ""}</label>
                    </div>

                    {/* Src */}
                    <div style="flow: horizontal; vertical-align: middle; margin-bottom: 8dip; height: 32dip;">
                        <span style="width: 70dip; line-height: 32dip;">Src:</span>
                        <select #authsrc style="width: 160dip; margin-right: 6dip;">
                            {authOptions}
                        </select>
                        <input class="ipt" #src type="text" value={tsk ? tsk.src : ""} style="width: *; margin-right: 6dip;" />
                        {(!tsk || tsk.authsrc == 1) ? <button class="btn greybtn" #browsesrc>Select...</button> : ""}
                    </div>

                    {/* Dest */}
                    <div style="flow: horizontal; vertical-align: middle; margin-bottom: 8dip; height: 32dip;">
                        <span style="width: 70dip; line-height: 32dip;">Dest:</span>
                        <select #authdst style="width: 160dip; margin-right: 6dip;">
                            {authOptions}
                        </select>
                        <input class="ipt" #dst type="text" value={tsk ? tsk.dst : ""} style="width: *; margin-right: 6dip;" />
                        {(!tsk || tsk.authdst == 1) ? <button class="btn greybtn" #browsedst>Select...</button> : ""}
                    </div>

                    {/* Exclude */}
                    <div style="flow: vertical; margin-bottom: 8dip;">
                        <div style="flow: horizontal; vertical-align: middle; height: 28dip;">
                            <span class="b" style="width: 70dip;">Exclude:</span>
                            <div style="width: *;" />
                            <button class="btn linebtn" #import style="margin-right: 6dip;"><i class="i_import" />Import</button>
                            <button class="btn linebtn" #export><i class="i_save" />Save As</button>
                        </div>
                        <textarea #exclude type="text" style="width: *; height: 80dip; margin-top: 4dip;">{tsk ? tsk.exclude : ""}</textarea>
                    </div>

                    {/* Params */}
                    <div style="flow: horizontal; vertical-align: middle; margin-bottom: 8dip; height: 32dip;">
                        <span style="width: 70dip;">Params:</span>
                        <input class="ipt" #params type="text"
                            value={tsk ? uswitch.cvtSwitches2Str(tsk.params) : ""}
                            style="width: *; margin-right: 6dip;" />
                        <button class="btn greybtn" #swch>Set &gt;&gt;</button>
                    </div>

                </div>

                {/* Bottom buttons */}
                <div class="dlgbtm" style="flow: horizontal; vertical-align: middle; margin-top: 16dip; height: 36dip;">
                    <button class="btn linebtn" #swap style="margin-right: *;">Src&lt;-&gt;Dest</button>
                    <button class="btn bluebtn" #ok style="margin-right: 8dip;">OK</button>
                    <button class="btn linebtn" #cancel>Cancel</button>
                </div>

            </div>
        );
    }

    componentDidMount() {
        // set select values after mount (value must be set after options are rendered)
        if (this.tsk) {
            this.$('#authsrc').value = this.tsk.authsrc;
            this.$('#authdst').value = this.tsk.authdst;
        }
    }

    componentDidUpdate() {
        // ensure select values stay in sync across renders
        if (this.tsk) {
            this.$('#authsrc').value = this.tsk.authsrc;
            this.$('#authdst').value = this.tsk.authdst;
        }
    }
}
