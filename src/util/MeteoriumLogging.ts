import chalk from "chalk";
import moment from "moment";

const RED = chalk.red;
const YELLOW = chalk.yellow;
const CYAN = chalk.cyan;
const MAGENTA = chalk.magenta;
const GRAY = chalk.gray;

function getCurrentDTStr() {
    return moment().format("DD-MM-YYYY hh:mm:ss:SSS A Z");
}

export class MeteoriumLogging {
    public namespaces: Array<MeteoriumLoggingNamespace>;
    public name: string;
    constructor(name: string) {
        this.name = name;
        this.namespaces = new Array<MeteoriumLoggingNamespace>();
    }
    RegisterNamespace(name: string, verbose: boolean) {
        const Namespace = new MeteoriumLoggingNamespace(name, this, verbose);
        this.namespaces.push(Namespace);
        return Namespace;
    }
    GetNamespace(name: string) {
        for (const namespace of this.namespaces) {
            if (namespace.name == name) return namespace;
        }
        return this.RegisterNamespace(name, true);
    }
}

export class MeteoriumLoggingNamespace {
    public name: string;
    public loggy: MeteoriumLogging;
    public verboseMode: boolean;
    constructor(name: string, root: MeteoriumLogging, verbose: boolean) {
        this.name = name;
        this.loggy = root;
        this.verboseMode = verbose;
    }
    write(color: chalk.Chalk, msg: string, ...data: string[]) {
        return console.log(color(msg), ...data);
    }
    verbose(msg: string, ...data: string[]) {
        if (!this.verboseMode) return;
        return this.write(GRAY, `[${getCurrentDTStr()}] [VRB] [${this.loggy.name}/${this.name}] ${msg}`, ...data);
    }
    debug(msg: string, ...data: string[]) {
        if (!this.verboseMode) return;
        return this.write(MAGENTA, `[${getCurrentDTStr()}] [DBG] [${this.loggy.name}/${this.name}] ${msg}`, ...data);
    }
    info(msg: string, ...data: string[]) {
        return this.write(CYAN, `[${getCurrentDTStr()}] [INF] [${this.loggy.name}/${this.name}] ${msg}`, ...data);
    }
    warn(msg: string, ...data: string[]) {
        return this.write(YELLOW, `[${getCurrentDTStr()}] [WRN] [${this.loggy.name}/${this.name}] ${msg}`, ...data);
    }
    error(msg: string, ...data: string[]) {
        return this.write(RED, `[${getCurrentDTStr()}] [ERR] [${this.loggy.name}/${this.name}] ${msg}`, ...data);
    }
}
