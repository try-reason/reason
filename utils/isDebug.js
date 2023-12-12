let reasonInternalDebug = process.env?.REASON_INTERNAL_DEBUG

function isWindows() {
    return process.platform === 'win32'
}

if (isWindows() && reasonInternalDebug) {
    reasonInternalDebug = reasonInternalDebug.trim()
}

const isDebug = reasonInternalDebug === 'true';
export default isDebug;
