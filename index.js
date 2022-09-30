import * as sys from '@sys'
import * as env from '@env'
import * as sciter from '@sciter'
import * as auth from './auth.js'
import * as gconfig from "./globalconfig"

const out = document.$("plaintext");

const EOL = env.PLATFORM == "Windows" ? "\r\n" : "\n";
gconfig.loadCfg()
gconfig.genSSHKey()

var tracert;

async function pipeReader(pipe, name) {
  try {
    var cline = "";
    reading: while (pipe) {
      var text = await pipe.read();
      text = sciter.decode(text);
      while (text) {
        var eolpos = text.indexOf(EOL);
        if (eolpos < 0) { cline += text; continue reading; }
        cline += text.substr(0, eolpos);
        text = text.substr(eolpos + EOL.length);
        out.append(<text class={name}>{cline}</text>);
        cline = "";
      }
    }
  } catch (e) {
    if (e.message != "socket is not connected")
      out.append(<text class="error">{e.message}</text>);
  }

}

document.on("click", "#exec", async function () {
  // await auth.saveAuths();
  auth.loadAuths();
  console.log(auth.auths)

  await gconfig.sshCopyId(auth.auths[0])

  return;

  var cmd = env.PLATFORM == "Windows" ? "tracert" : "traceroute";
  try {
    tracert = sys.spawn([cmd, "sciter.com"], { stdout: "pipe", stderr: "pipe" });
    pipeReader(tracert.stdout, "stdout");
    pipeReader(tracert.stderr, "stderr");
    var r = await tracert.wait();
    out.append(<text class="done">Done with result:{r.exit_status} and {r.term_signal}</text>);
  } catch (e) {
    out.append(<text class="error">{e.message}</text>);
  }
});

document.on("click", "#addtask", function () {
  document.state.disabled = true;

  var retval = Window.this.modal({
    url: __DIR__ + "task.html",
    alignment: -5,
  });

  document.state.disabled = false;
});