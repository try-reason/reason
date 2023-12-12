import { libname } from "./isPathFromReason.js";

// windows fucking sucks 3
function isWindows() {
    return process.platform === 'win32'
}

export default function getBasePath() {
    let reasonEnv = process.env?.REASON_ENV
    // honestly window fucking sucks
    if (isWindows() && reasonEnv) {
        reasonEnv = reasonEnv.trim()
    }
    if (reasonEnv === 'dev') {
        let path = `${process.cwd()}/node_modules/${libname}/dist/ast-transforms/`;

        if (isWindows()) {
            path = 'file:///' + path
        }

        return path
    }
    // now we now REASON is running in dev mode (MY MACHINE)
    return `${process.cwd()}/ast-transforms/`;
}
