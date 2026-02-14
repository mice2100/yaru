import * as uconfig from './uconfig.js';
import * as env from '@env';
import * as sys from '@sys';
import * as utils from './utils.js';
import { AuthTable } from './AuthTable.js';
import { DaemonModuleList } from './DaemonModuleList.js';

export class ConfigDialog extends Element {
    name = "config-dialog";

    componentDidMount() {
        // 延迟初始化，确保 DOM 渲染完成
        this.timer(100, () => {
            uconfig.loadCfg();

            const sshroot = this.$("#sshroot");
            if (sshroot) {
                sshroot.innerText = uconfig.configs.ssh.sshroot;
            }

            const btngen = this.$("#btngen");
            if (btngen) {
                btngen.style.display = uconfig.configs.ssh.keyexists ? 'none' : 'block';
            }
        });
    }

    ["on click at #btngen"](evt, el) {
        (async () => {
            await uconfig.genSSHKey();
            document.$("#btngen").style.display = uconfig.configs.ssh.keyexists ? 'none' : 'block';
        })();
    }

  ["on click at #newauth"](evt, el) {
        uconfig.newAuth();
        this.componentUpdate({ auths: uconfig.configs.auths });
    }

    ["on click at #ok"](evt, el) {
      uconfig.configs.daemon.modules = this.$("#daemonlist").modules;
        uconfig.saveCfg();
        this.state.popup = false;
    }

    ["on click at #cancel"](evt, el) {
        this.state.popup = false;
    }

    render() {
      return <div.wconfigmian style="width: 800dip; height: 580dip;">
            <div .authslist>
                <div .keybox>
                    <b>SSH Key folder:</b>
                    <span #sshroot></span>
                    <button .btn greybtn #btngen>Generate</button>
                </div>
                <span>
                    <b>Auths:</b>
                    <button .btn linebtn #newauth><i .i_add></i>New</button>
                </span>
                <AuthTable auths={uconfig.configs.auths} />
            </div>

            <DaemonModuleList #daemonlist modules={uconfig.configs.daemon.modules} />

            <div .dlgbtm>
                <button .btn bluebtn #ok>OK</button>
                <button .btn linebtn #cancel>Cancel</button>
            </div>
        </div>;
    }
}
