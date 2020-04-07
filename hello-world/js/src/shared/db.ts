/*! Copyright (c) 2018 Siemens AG. Licensed under the MIT License. */

import { DatabaseOptions } from "@coaty/core";
import { DbAdapterFactory, DbContext } from "@coaty/core/db";
import { PostgresAdapter } from "@coaty/core/db/adapter-postgres";

/**
 * Defines static constants and functions for database initialization
 * and access.
 */
export class Db {

    public static readonly COLLECTION_LOG = "log";
    public static readonly COLLECTION_TASK = "task";

    private static readonly USER_NAME = "helloworld_user";
    private static readonly USER_PWD = "helloworld_user_pwd";
    private static readonly DB_NAME = "helloworld_db";

    public static getConnectionString() {
        return `postgres://${Db.USER_NAME}:${Db.USER_PWD}@localhost/${Db.DB_NAME}`;
    }

    public static getAdminConnectionString() {
        // Connect as admin user (postgres) with password (postgres) to admin database (postgres).
        // Format: "postgres://<superusername>:<password>@localhost/postgres"
        return `postgres://postgres:postgres@localhost/postgres`;
    }

    public static initDatabaseAdapters() {
        DbAdapterFactory.registerAdapter("PostgresAdapter", PostgresAdapter);
    }

    /**
     * Set up the Postgres database by creating a database user and a database
     * with two collections for logs and tasks.
     *
     * @param options Database options
     * @param clearData if true, clear all collection data from previous runs
     */
    public static initDatabase(options: DatabaseOptions, clearData: boolean = true): Promise<any> {
        const dbcAdmin = new DbContext(options["admindb"]);

        return dbcAdmin.callExtension("initDatabase",
            options["db"],
            [Db.COLLECTION_LOG, Db.COLLECTION_TASK],
            clearData);

        // Developer Note: The "initDatabase" extension is a convenience extension
        // which uses the "createUser" and "createDatabase" extensions as follows:
        // 
        // const dbc = new DbContext(options["db"]);
        // return dbcAdmin.callExtension("createUser", Db.USER_NAME, Db.USER_PWD)
        //     .then(() => dbcAdmin.callExtension("createDatabase", Db.DB_NAME, Db.USER_NAME))
        //
        //     // Add collections if they do not exist yet
        //     .then(() => dbc.addCollection(Db.COLLECTION_LOG))
        //     .then(() => dbc.addCollection(Db.COLLECTION_TASK))
        //
        //     // If requested, clear all data from previous runs
        //     .then(() => clearData && dbc.clearCollection(Db.COLLECTION_LOG))
        //     .then(() => clearData && dbc.clearCollection(Db.COLLECTION_TASK));
    }
}
