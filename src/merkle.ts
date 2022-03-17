import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";

export default class Merkle {
  private tree: MerkleTree;

  constructor(accounts: Record<string, number>) {
    let leaves = [];
    for (let address in accounts) {
      leaves.push(keccak256(address + accounts[address].toString()));
    }
    this.tree = new MerkleTree(leaves, keccak256, { sort: true });
  }

  public getMerkleRoot(): string {
    return this.tree.getHexRoot().replace("0x", "");
  }

  public getMerkleProof(account: {
    delegator: string;
    amount: number;
  }): string[] {
    return this.tree
      .getHexProof(keccak256(account.delegator + account.amount.toString()))
      .map((v) => v.replace("0x", ""));
  }
}
