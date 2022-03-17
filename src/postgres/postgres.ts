import { Pool } from 'pg';
import {AirdropMerkleItem} from "../types";

interface PGCredentials {
    user: string;
    host: string;
    database: string;
    password: string;
}

export class PostgresDriver {
    pool: Pool;
    database: string;
    table: string;

    constructor(credentials: PGCredentials, table: string) {
        this.table = table;
        this.database = credentials.database
        this.pool = new Pool({...credentials, port: 5432});
    }

    async get<T extends any>(pk: string): Promise<T> {
        return this.pool.query(`SELECT * FROM "${this.table}" WHERE delegator='${pk}'`)
            .then(r => {
                    if (r.rows.length === 1) {
                        return r.rows[0];
                    } else {
                        return {} as T;
                    }
                }
            )
            .catch(() => {
                return {} as T;
            });
    }

    async bulkInsert<T extends any>(arr: AirdropMerkleItem[]): Promise<boolean> {
        let values = arr.map(({delegator, amount, proof}) => `('${delegator}', '${amount}', '${proof}')`).join(",");
        return this.pool.query(`INSERT INTO "${this.table}" (delegator, amount, proof) VALUES ${values};`)
            .then(() => true)
            .catch(() => false);
    }
}
