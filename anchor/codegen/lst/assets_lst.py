#!/usr/bin/env python3

# TODO: Read from sanctum-lst-list.toml at
# https://raw.githubusercontent.com/igneous-labs/sanctum-lst-list/refs/heads/master/sanctum-lst-list.toml

import toml

with open('sanctum-lst-list.toml', 'r') as f:
    data = toml.load(f)

rust = ""
ts = ""
for lst in data["sanctum_lst_list"]:
    symbol = lst.get("symbol")
    name = lst.get("name")
    mint = lst.get("mint")
    decimals = lst.get("decimals")
    pool = lst.get("pool").get("pool")

    if pool is None:
        continue

    rust += f"""
    // {symbol} - {name}
    "{mint}" =>
    AssetMeta {{
        decimals: {decimals},
        is_stable_coin: false,
        pyth_account: "",
        staking_state: "{pool}",
    }},
"""

    ts += f"""
  [
    // {symbol} - {name}
    "{mint}",
    {{
      pricingAccount: new PublicKey(
        "{pool}" // state
      ),
    }},
  ],"""

# print(rust)
print(ts)
