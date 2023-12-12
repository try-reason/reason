import reasonConfig from '../configs/reason-config';
import { Kysely } from 'kysely'
import { db } from "../services/db";
import setupOpenTEL from '../observability/setup-opentel';
import isDebug from '../utils/isDebug';

export default async function setup() {
  if (isDebug) console.log('RΞASON — `.reason.config.js` was sucessfully imported');

  setupOpenTEL()
  
  const database = db as Kysely<any>
  try {
    await database.schema
      .createTable('agent_history')
      .addColumn('id', 'text', (col) => col.primaryKey())
      .addColumn('messages', 'text', col => col.notNull())
      .execute()
  } catch {}
}
