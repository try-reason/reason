export default function isJs(filepath) {
  return filepath.endsWith('.js') || filepath.endsWith('.mjs')
}