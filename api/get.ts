import { run } from '../src/vercel/run';
import { cache, get } from '../src/vercel/http';
import { PostgresDriver } from '../src/postgres/postgres';
import { AirdropMerkleItem } from '../src/types';

const {
    pg_user,
    pg_host,
    pg_database,
    pg_password,
    pg_table,
} = process.env;

export default run(get, cache(600))(async (req, res) => {
    const { address } = req.query;

    const db = new PostgresDriver({
        user: pg_user,
        host: pg_host,
        database: pg_database,
        password: pg_password,
    }, pg_table);

    const items = await db.get<AirdropMerkleItem>(address as string);

    return res.status(200).json(items);
});
