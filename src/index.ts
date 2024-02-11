import Logging from "./classes/logging.js";

const logging = new Logging("Meteorium");
const mainNS = logging.registerNamespace("Main");
mainNS.info("Hello, world!");
