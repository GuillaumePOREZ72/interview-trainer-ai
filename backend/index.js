/**
 * This file is a proxy for the startup file.
 * It is placed at the root level to help o2switch/cPanel
 * find the entry point more easily if dist/server.js
 * causes detection issues.
 */
require("./dist/server.js");
