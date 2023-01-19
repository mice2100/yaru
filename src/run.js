import * as env from "@env";

let gfx = "gpu"; // use best GPU backend...

if (env.PLATFORM === "OSX")
    gfx = "opengl"; // force using OpenGL instead of Metal
application.start(gfx); // configure graphics backend

const mainWindow = new Window({
    url: __DIR__+"main.htm",
    parameter: {}  // parameters to pass
})

mainWindow.on("close", () => application.quit(0));

application.run(); // message pump loop
