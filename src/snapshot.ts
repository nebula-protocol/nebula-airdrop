import axios, { AxiosResponse } from "axios";

const EXCLUDE_TOP_VALIDATOR: number = 5;

interface ValidatorsResponse {
  result: {
    operator_address: string;
    delegator_shares: string;
  }[];
}

interface DelegationsResponse {
  result: {
    delegation: {
      delegator_address: string;
      shares: string;
    };
  }[];
}

export default class Snapshot {
  URL: string;
  total_airdrop: number;

  constructor(URL: string, total_airdrop: number) {
    this.URL = URL;
    this.total_airdrop = total_airdrop;
  }

  async takeSnapshot(block: number): Promise<Record<string, number>> {
    const {
      data: { result },
    }: AxiosResponse<ValidatorsResponse> = await axios.get(
      `${this.URL}/staking/validators?height=${block}`,
      {
        timeout: 10000000,
      }
    );
    let validatorsPower: Record<string, number> = result.reduce<
      Record<string, number>
    >(function (acc, each) {
      return {
        ...acc,
        [each.operator_address]: parseFloat(each.delegator_shares) * 1e-6,
      };
    }, {});
    validatorsPower = Object.fromEntries(
      Object.entries(validatorsPower)
        .sort((a, b) => b[1] - a[1])
        .slice(EXCLUDE_TOP_VALIDATOR)
    );
    const totalVotingPower: number = Object.values(
      validatorsPower
    ).reduce<number>((a, b) => a + b, 0);
    console.log(`Current total voting power: ${totalVotingPower}`);

    let validatorsShare: Record<string, number> = {};
    const normalizedTotalPower = Object.values(validatorsPower).reduce(
      (acc, each) => {
        return acc + Math.pow(each, 0.75);
      },
      0
    );
    Object.keys(validatorsPower).forEach((each) => {
      validatorsShare[each] =
        Math.pow(validatorsPower[each], 0.75) / normalizedTotalPower;
    });
    console.log(`Normalized total voting power: ${normalizedTotalPower}`);

    const validatorsNebula: Record<string, number> = Object.keys(
      validatorsShare
    ).reduce((acc, addr) => {
      return { ...acc, [addr]: validatorsShare[addr] * this.total_airdrop };
    }, {});
    let delegatorsNebula: Record<string, number> = {};

    for (let validator of Object.keys(validatorsNebula)) {
      console.log(`Now calculating airdrop for ${validator}`);
      const {
        data: { result },
      }: AxiosResponse<DelegationsResponse> = await axios.get(
        `${this.URL}/staking/validators/${validator}/delegations?limit=10000000&height=${block}`,
        {
          timeout: 10000000,
        }
      );
      const delegatorsAmount = result.length;
      console.log(`Total delegators: ${delegatorsAmount}`);
      for (let delegator of result) {
        let nebulaAmount =
          (parseFloat(delegator.delegation.shares) /
            validatorsPower[validator]) *
          validatorsNebula[validator];
        if (delegator.delegation.delegator_address in delegatorsNebula) {
          delegatorsNebula[delegator.delegation.delegator_address] +=
            nebulaAmount;
        } else {
          delegatorsNebula[delegator.delegation.delegator_address] =
            nebulaAmount;
        }
      }
    }

    return delegatorsNebula;
  }
}
