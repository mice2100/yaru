import * as uconfig from './uconfig.js';
import { ConfigDialog } from './ConfigDialog.js';

document.on("ready", () => {
    // Render the ConfigDialog component into the body
    document.$("body").content(<ConfigDialog />);
});

// Listen for custom event when Done is clicked
document.on("config-saved", () => {
    // Navigate back to main page
    Window.this.load(__DIR__ + "main.htm");
});
