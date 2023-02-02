import * as env from "@env";

let gfx = "gpu"; // use best GPU backend...

switch (env.PLATFORM) {
    case "OSX":
        if (env.OS.localeCompare("OSX-11") < 0)
            gfx = "opengl"
        break
    case "Windows":
        gfx = "direct2d"
        break;
}
application.start(gfx); // configure graphics backend

const mainWindow = new Window({
    url: __DIR__ + "main.htm",
    parameter: {}  // parameters to pass
})

mainWindow.on("close", () => application.quit(0));

application.run(); // message pump loop
