import chalk from "chalk";
import type { ChalkInstance } from "chalk";
import moment from "moment";

const RED = chalk.red;
const YELLOW = chalk.yellow;
const CYAN = chalk.cyan;
const MAGENTA = chalk.magenta;
const GRAY = chalk.gray;

function getCurrentDTStr() {
    return moment().format("DD-MM-YYYY hh:mm:ss:SSS A Z");
}

function getFullName(obj: LoggingNamespace) {
    let name = obj.name;
    let ptr: Logging | LoggingNamespace = obj.parent;
    while (ptr instanceof LoggingNamespace) {
        name = `${ptr.name}/${name}`;
        ptr = ptr.parent;
    }
    name = `${ptr.name}/${name}`;
    return name;
}

export default class Logging {
    public namespaces: Array<LoggingNamespace>;
    public name: string;
    public constructor(name: string) {
        this.name = name;
        this.namespaces = new Array<LoggingNamespace>();
    }
    registerNamespace(name: string): LoggingNamespace {
        const Namespace = new LoggingNamespace(name, this);
        this.namespaces.push(Namespace);
        return Namespace;
    }
    getNamespace(name: string): LoggingNamespace {
        for (const namespace of this.namespaces) {
            if (namespace.name == name) return namespace;
        }
        return this.registerNamespace(name);
    }
}

export class LoggingNamespace {
    public name: string;
    public namespaces: Array<LoggingNamespace>;
    public parent: Logging | LoggingNamespace;
    public constructor(name: string, root: Logging | LoggingNamespace) {
        this.name = name;
        this.namespaces = [];
        this.parent = root;
    }
    registerNamespace(name: string): LoggingNamespace {
        const Namespace = new LoggingNamespace(name, this);
        this.namespaces.push(Namespace);
        return Namespace;
    }
    getNamespace(name: string): LoggingNamespace {
        for (const namespace of this.namespaces) {
            if (namespace.name == name) return namespace;
        }
        return this.registerNamespace(name);
    }
    write(color: ChalkInstance, msg: string, ...data: string[]) {
        return console.log(color(msg), ...data);
    }
    verbose(msg: string, ...data: string[]) {
        return this.write(GRAY, `[${getCurrentDTStr()}] [VRB] [${getFullName(this)}] ${msg}`, ...data);
    }
    debug(msg: string, ...data: string[]) {
        return this.write(MAGENTA, `[${getCurrentDTStr()}] [DBG] [${getFullName(this)}] ${msg}`, ...data);
    }
    info(msg: string, ...data: string[]) {
        return this.write(CYAN, `[${getCurrentDTStr()}] [INF] [${getFullName(this)}] ${msg}`, ...data);
    }
    warn(msg: string, ...data: string[]) {
        return this.write(YELLOW, `[${getCurrentDTStr()}] [WRN] [${getFullName(this)}] ${msg}`, ...data);
    }
    error(msg: string, ...data: string[]) {
        return this.write(RED, `[${getCurrentDTStr()}] [ERR] [${getFullName(this)}] ${msg}`, ...data);
    }
}
