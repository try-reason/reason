import reasonConfig from '../configs/reason-config';
import setupOpenTEL from '../observability/setup-opentel';
import isDebug from '../utils/isDebug';

export default async function setup() {
  if (isDebug) console.log('RΞASON — `.reason.config.js` was sucessfully imported');

  setupOpenTEL()
}
