import Snapshot from "./snapshot";
import Merkle from "./merkle";
import { AirdropMerkleItem } from "./types";
import * as logger from "./logger";
import { PostgresDriver } from "./postgres/postgres";
import fs from "fs";

const {
    lcd_endpoint,
    total_airdrop_amount,
    height,

    pg_user,
    pg_host,
    pg_database,
    pg_password,
    pg_table,
} = process.env;


void (async function() {
    // setup postgres driver
    const postgresDriver = new PostgresDriver({
        user: pg_user,
        host: pg_host,
        database: pg_database,
        password: pg_password,
    }, pg_table)

    // create snapshotService
    const snapshotService = new Snapshot(lcd_endpoint!, +total_airdrop_amount!);

    // take snapshot
    const airdropSnapshot = await takeSnapshot(
        snapshotService,
        +height,
    )

    // insert to postgres database
    let result = await postgresDriver.bulkInsert(airdropSnapshot);
    if (result) {
        logger.info('-- snapshot updated')
    }
})().catch(console.log)

async function takeSnapshot(
    snapshotService: Snapshot,
    height: number,
): Promise<AirdropMerkleItem[]> {
    // take snapshot
    logger.info('-- calculating airdrop amounts..')
    const delegatorsNebula = await snapshotService.takeSnapshot(height)

    const delegatorAddresses = Object.keys(delegatorsNebula)
    logger.info(`-- Nebula allocation example: ${delegatorAddresses[0]} getting ${delegatorsNebula[delegatorAddresses[0]]} NEB`)
    if (delegatorAddresses.length < 1) {
        throw new Error('take snapshot failed. target delegators is none.')
    }

    // write raw airdrop allocation to a json file
    fs.writeFileSync('./airdrop_raw.json', JSON.stringify(delegatorsNebula, null, 4) , 'utf-8');

    // remove delegators whose allocation is smaller than 1 uNEB
    let cleanedDelegatorsNebula: Record<string, number> = Object.keys(delegatorsNebula).reduce((acc, each) => {
        let amount = parseInt(delegatorsNebula[each].toString());
        if (amount > 0) {
            return {...acc, [each]: amount}
        } else {
            return acc
        }
    }, {});

    // create merkle tree
    const airdrop = new Merkle(cleanedDelegatorsNebula)
    const merkleRoot = airdrop.getMerkleRoot()

    // getting proofs for each delegator
    logger.info('-- generating proofs..')
    let i = 0;
    const airdropSnapshot = Object.entries(cleanedDelegatorsNebula).map(account => {
        const [delegator, amount] = account
        const proof = airdrop.getMerkleProof({ delegator, amount })
        const merkleItem: AirdropMerkleItem = {
            delegator,
            amount: amount.toString(),
            proof: JSON.stringify(proof),
        }
        if (i % 100 === 0) {
            logger.info(`-- Merkle item example: ${merkleItem.delegator} getting ${merkleItem.amount} uNEB with ${merkleItem.proof}`);
        }
        i++;
        return merkleItem
    })

    logger.info(
        `-- take airdrop snapshot - height: ${height}, total_stakers: ${delegatorAddresses.length}, eligible_for_airdrop: ${airdropSnapshot.length}, merkle_root: ${merkleRoot}`
    );

    return airdropSnapshot
}

