import { Driver, SqliteQueryCompiler, SqliteIntrospector, SqliteAdapter  } from "kysely";
import { Kysely } from "kysely";
import { QueryCompiler } from "kysely";
import { Dialect } from "kysely";
import { DialectAdapter } from "kysely";
import { DatabaseIntrospector } from "kysely";

import { SqliteDriver } from "./sqlite-driver.js";
import { SqliteDialectConfig } from "./sqlite-dialect-config.js";

/**
 * SQLite dialect that uses the [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3) library.
 *
 * The constructor takes an instance of {@link SqliteDialectConfig}.
 *
 * ```ts
 * import Database from 'better-sqlite3'
 *
 * new SqliteDialect({
 *   database: new Database('db.sqlite')
 * })
 * ```
 *
 * If you want the pool to only be created once it's first used, `database`
 * can be a function:
 *
 * ```ts
 * import Database from 'better-sqlite3'
 *
 * new SqliteDialect({
 *   database: async () => new Database('db.sqlite')
 * })
 */
export class SqliteDialect implements Dialect {
  readonly #config: SqliteDialectConfig;

  constructor(config: SqliteDialectConfig) {
    this.#config = Object.freeze({ ...config });
  }

  createDriver(): Driver {
    return new SqliteDriver(this.#config);
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler();
  }

  createAdapter(): DialectAdapter {
    return new SqliteAdapter();
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db);
  }
}
