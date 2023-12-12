import { libname } from "../utils/libname.js"

export { libname }

export default function isPathFromReason(p) {
  if (process.env?.REASON_ENV === 'local') {
    if (p.includes('functions')) {
      return true
    }

    if (p.includes('ast-transforms')) {
      return true
    }

    return false
  }
  
  const fromLib = p.includes(libname)
  return fromLib
}