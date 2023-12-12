import { Kysely } from 'kysely'
import type Database from '../types/db/database.d.ts'

import sqlite3 from 'sqlite3'
import { SqliteDialect } from '../sqlite/sqlite-dialect'

const dialect = new SqliteDialect({
  database: new sqlite3.Database('database.sqlite'),
})

export const db = new Kysely<Database>({
  dialect
})