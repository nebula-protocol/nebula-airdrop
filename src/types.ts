export interface AirdropMerkleItem {
    delegator: string,
    amount: string,
    proof: string, // JSON.stringify(proof)
}
