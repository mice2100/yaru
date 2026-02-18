import * as uconfig from './uconfig.js';
import * as env from '@env';
import * as sys from '@sys';
import * as utils from './utils.js';
import { AuthTable } from './AuthTable.js';
import { DaemonModuleList } from './DaemonModuleList.js';

export class ConfigDialog extends Element {
    name = "config-dialog";

    this(props) {
        // Load config immediately so it's available for render()
        uconfig.loadCfg();
    }

    componentDidMount() {
        // No need to manually update DOM elements - AuthTable handles them
    }

    componentWillUnmount() {
        uconfig.configs.daemon.modules = this.$("#daemonlist").modules;
        uconfig.saveCfg();
    }

    render() {
        return <div style="flow: vertical; width: 850dip; height: 620dip; background: var(--bg-primary);">
            <div style="flow: vertical; overflow-y: scroll; padding: 20dip;">
                <div style="flow: vertical;">
                    <AuthTable
                        auths={uconfig.configs.auths}
                        sshroot={uconfig.configs.ssh.sshroot}
                        keyexists={uconfig.configs.ssh.keyexists}
                    />
                </div>

                <div style="margin-top: 12dip;">
                    <DaemonModuleList #daemonlist modules={uconfig.configs.daemon.modules} />
                </div>
            </div>
        </div>;
    }
}
