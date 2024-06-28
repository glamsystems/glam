"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React from "react";

const products = [
  {
    "address": "GLAMvRgo7cHBPjQGf8UaVnsD6TUDjq16dEUuDPAPLjyJ",
    "name": "GLAM Alpha",
    "symbol": "GLAM",
    "baseAsset": "SOL",
    "inception": "2024-01-01",
    "status": "active"
  },
  {
    "address": "GLAM5PUeNkEyM8wnxuwoHbGRqSVK6wWpfvTVxe2UJKR6",
    "name": "GLAM Beta",
    "symbol": "GLB",
    "baseAsset": "wETH",
    "inception": "2023-06-15",
    "status": "projected"
  },
  {
    "address": "GLAMfixX32PwfCrHnkaMtXbHEYkUqvikSq73oSTat7UU",
    "name": "GLAM Gamma",
    "symbol": "GLG",
    "baseAsset": "wBTC",
    "inception": "2022-11-30",
    "status": "dormant"
  },
  {
    "address": "GLAMmMgDGnRXY8GkVkwdEwWc2XpHiXronBUa2bfHAHik",
    "name": "GLAM Delta",
    "symbol": "GLD",
    "baseAsset": "USDT",
    "inception": "2023-01-20",
    "status": "inLiquidation"
  },
  {
    "address": "GLAMz9bYh6tijKC3RUibwBTnj7H49EogWjN6c7c9r3kW",
    "name": "GLAM Epsilon",
    "symbol": "GLE",
    "baseAsset": "USDC",
    "inception": "2022-08-10",
    "status": "terminated"
  },
  {
    "address": "GLAMDoSXvHbkzwJKEYVzVjZCz9ffeL9vT2ZqWGHpptHs",
    "name": "GLAM Zeta",
    "symbol": "GLZ",
    "baseAsset": "SOL",
    "inception": "2024-05-05",
    "status": "toBeLaunched"
  },
  {
    "address": "GLAMHHNRp1ZzHHcBpppZB4sUjs8A2bo9kMS8MmWJLZsA",
    "name": "GLAM Eta",
    "symbol": "GLE",
    "baseAsset": "wETH",
    "inception": "2023-09-18",
    "status": "offeringPeriod"
  },
  {
    "address": "GLAMV7SxVzCVeh41fDeKoi3EBigoBiApP4WcUGXrFAeL",
    "name": "GLAM Theta",
    "symbol": "GLT",
    "baseAsset": "wBTC",
    "inception": "2023-07-22",
    "status": "active"
  },
  {
    "address": "GLAMofUq1HzDnrbk3jjdNu1Nx6fNzfgk8YxS9qKAyauK",
    "name": "GLAM Iota",
    "symbol": "GLI",
    "baseAsset": "USDT",
    "inception": "2023-10-01",
    "status": "projected"
  },
  {
    "address": "GLAM2kWqEJviYV9LAkW2R3MHtSkYhuFXGH9PnCuBQ67F",
    "name": "GLAM Kappa",
    "symbol": "GLK",
    "baseAsset": "USDC",
    "inception": "2022-05-25",
    "status": "dormant"
  },
  {
    "address": "GLAMonuafpMU9QVo2JFXvW2TSzFgBLLkyPEWaDCSmxYL",
    "name": "GLAM Lambda",
    "symbol": "GLL",
    "baseAsset": "SOL",
    "inception": "2023-03-15",
    "status": "inLiquidation"
  },
  {
    "address": "GLAMm9QxSGEqWXFPCeAuhp2Y2YypbPS7zVKWViybvVA4",
    "name": "GLAM Mu",
    "symbol": "GLM",
    "baseAsset": "wETH",
    "inception": "2022-07-09",
    "status": "terminated"
  },
  {
    "address": "GLAMxSh6Q296wnQ1dpJ9aL3WLz1j2YAJZLavXXNYJAVy",
    "name": "GLAM Nu",
    "symbol": "GLN",
    "baseAsset": "wBTC",
    "inception": "2024-02-14",
    "status": "toBeLaunched"
  },
  {
    "address": "GLAMSScX26fRB7KRXU1wPYGHgdh6DvCa7TLxY87kKsj8",
    "name": "GLAM Xi",
    "symbol": "GLX",
    "baseAsset": "wBTC",
    "inception": "2023-11-11",
    "status": "offeringPeriod"
  },
  {
    "address": "GLAM3DQTk4WygJxm4ApkMb4PjRxJoaxeXNYofBAYriqb",
    "name": "GLAM Omicron",
    "symbol": "GLO",
    "baseAsset": "USDC",
    "inception": "2022-03-28",
    "status": "active"
  },
  {
    "address": "GLAMvBpQNGKLGCczVCHSVvPhHbhM9fmiHreKzwSDSPm9",
    "name": "GLAM Pi",
    "symbol": "GLP",
    "baseAsset": "SOL",
    "inception": "2023-05-05",
    "status": "projected"
  },
  {
    "address": "GLAMAFB6xQQ22UcG6zP12bMVxpoCrnGMccEyA5Yw7uSc",
    "name": "GLAM Rho",
    "symbol": "GLR",
    "baseAsset": "wETH",
    "inception": "2023-12-01",
    "status": "dormant"
  },
  {
    "address": "GLAMDbTxHN8dthijW6XQoWdnuF93frR1PrqC9UaV1Eov",
    "name": "GLAM Sigma",
    "symbol": "GLS",
    "baseAsset": "wBTC",
    "inception": "2022-09-15",
    "status": "inLiquidation"
  },
  {
    "address": "GLAMGpeKYEgYujs8KEYsfWgRyoCPaJkTm3aF6s4FRSaP",
    "name": "GLAM Tau",
    "symbol": "GLT",
    "baseAsset": "wBTC",
    "inception": "2023-04-12",
    "status": "terminated"
  },
  {
    "address": "GLAMC4L4Yz4VSif1jzxDBWMftkFWhqxKRXX4K7qG1C6t",
    "name": "GLAM Upsilon",
    "symbol": "GLU",
    "baseAsset": "SOL",
    "inception": "2024-03-22",
    "status": "toBeLaunched"
  }
]

export default function Products() {
  return (
    <div className="flex w-2/3 mt-16 self-center">
      <DataTable data={products} columns={columns} />
    </div>
  );
}
