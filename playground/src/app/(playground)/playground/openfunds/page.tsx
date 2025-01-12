"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { GlamClient, useGlam, WSOL } from "@glam/anchor/react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExplorerLink } from "@/components/ExplorerLink";

function OpenfundsTable({ fund }: { fund: any }) {
  const share = fund?.shareClasses[0];
  if (!fund || !share) return null;

  return (
    <TooltipProvider>
      <div className="grid gap-3 text-sm">
        <div className="font-semibold">Openfunds</div>
        <ul className="grid gap-3">
          <li className="border-b pb-3 flex items-center justify-between">
            <span className="text-muted-foreground flex items-center">
              In-Kind
            </span>
            <span>
              <p className="font-semibold">
                You will receive a combination of {fund.fundCurrency} and other
                assets.
              </p>
            </span>
          </li>
          <li className="border-b pb-3 flex items-center justify-between">
            <span className="text-muted-foreground flex items-center">
              Share Class Currency
            </span>
            <span>
              <p className="font-semibold">
                You will receive {fund.fundCurrency}.
              </p>
            </span>
          </li>
        </ul>
      </div>
    </TooltipProvider>
  );
}

function Subitems({ obj }: { obj: any[] }) {
  return obj.map(({ name, value }: { name: any; value: any }) => {
    if (value.constructor.name === "Object") {
      console.log(value);
    }
    // console.log(name, value);
    // return null;
    return (
      <li className="border-b pb-3 flex items-center justify-between">
        <span className="font-semibold flex items-center">
          {Object.keys(name)[0].toString()}
        </span>
        <span>
          <p className="text-muted-foreground">
            {typeof value === "string"
              ? value.substring(0, 40) + (value.length > 40 ? "..." : "")
              : value.constructor.name === "PublicKey"
                ? // <ExplorerLink
                  //   path={`account/${value.toString()}`}
                  //   label={value.toString()}
                  // />
                  value.toString()
                : value.constructor.name === "Array"
                  ? value.join("\n")
                  : value.constructor.name === "Object"
                    ? //@ts-ignore
                      Object.values(value)[0]
                        .val.toString()
                        .replaceAll(",", "\n")
                    : value.constructor.name}
          </p>
        </span>
      </li>
    );
  });
}

function Items({ obj }: { obj: any }) {
  return Object.entries(obj).map(([key, value]: any[]) => {
    return key === "params" ? (
      <>
        {value.map((v: any) => (
          <Subitems obj={v} />
        ))}
      </>
    ) : (
      <>
        <li className="border-b pb-3 flex items-center justify-between">
          <span className="font-semibold flex items-center">
            {key.toString()}
          </span>
          <span>
            <p className="text-muted-foreground">
              {typeof value === "string"
                ? value.substring(0, 40) + (value.length > 40 ? "..." : "")
                : value.constructor.name === "PublicKey"
                  ? // <ExplorerLink
                    //   path={`account/${value.toString()}`}
                    //   label={value.toString()}
                    // />
                    value.toString()
                  : value.constructor.name === "Array"
                    ? value[0]?.name || value[0]?.constructor.name === "Array"
                      ? "---v"
                      : value.join("\n")
                    : value.constructor.name}
            </p>
          </span>
        </li>
        {value.constructor.name === "Array" ? (
          value[0]?.constructor.name === "Array" ? (
            <>
              {value.map((v: any) => (
                <Subitems obj={v} />
              ))}
            </>
          ) : value[0]?.name ? (
            <Subitems obj={value} />
          ) : null
        ) : null}
      </>
    );
  });
}

function FundAccount({ fundId }: { fundId: any }) {
  const { glamClient } = useGlam();
  const { data: fundAccount } = useQuery({
    // using wallet?.publicKey in queryKey will auto-refresh when wallet changes
    queryKey: ["fund-account", fundId],
    enabled: !!fundId,
    queryFn: () => glamClient.fetchStateAccount(new PublicKey(fundId)),
  });

  if (!fundAccount) return null;

  return (
    <TooltipProvider>
      <div className="grid gap-3 text-sm">
        <div className="font-semibold">
          GLAM Account:{" "}
          <ExplorerLink path={`account/${fundId}`} label={fundId} />
        </div>
        <ul className="grid gap-3">
          <Items obj={fundAccount} />
        </ul>
      </div>
    </TooltipProvider>
  );
}

// function ShareClassAccount({ shareClassId }: { shareClassId: any }) {
//   const { glamClient } = useGlam();
//   const { data: shareClassAccount } = useQuery({
//     // using wallet?.publicKey in queryKey will auto-refresh when wallet changes
//     queryKey: ["share-account", shareClassId],
//     enabled: !!shareClassId,
//     queryFn: () =>
//       glamClient.fetchShareClassAccount(new PublicKey(shareClassId)),
//   });

//   if (!shareClassAccount) return null;

//   return (
//     <TooltipProvider>
//       <div className="grid gap-3 text-sm">
//         <div className="font-semibold">Mint Account</div>
//         <ul className="grid gap-3">
//           <Items obj={shareClassAccount} />
//         </ul>
//       </div>
//     </TooltipProvider>
//   );
// }

function MetadataAccount({ fundId }: { fundId: any }) {
  const { glamClient } = useGlam();
  const { data: metaAccount } = useQuery({
    // using wallet?.publicKey in queryKey will auto-refresh when wallet changes
    queryKey: ["metadata-account", fundId],
    enabled: !!fundId,
    queryFn: () => glamClient.fetchMetadataAccount(new PublicKey(fundId)),
  });

  if (!metaAccount) return null;
  const metaId = glamClient.getOpenfundsPda(new PublicKey(fundId)).toString();

  return (
    <TooltipProvider>
      <div className="grid gap-3 text-sm">
        <div className="font-semibold">
          Metadata Account:{" "}
          <ExplorerLink path={`account/${metaId}`} label={metaId} />
        </div>
        <ul className="grid gap-3">
          <Items obj={metaAccount} />
        </ul>
      </div>
    </TooltipProvider>
  );
}

export default function Openfunds() {
  const { allGlamStates: allFunds, activeGlamState: activeFund } = useGlam();

  const fundId = activeFund?.address;
  // const fundId = "APx491vs2rRkGUCLp4kVDHz8J2Pc9cry3ZvVDJ7goVTB";
  const fund: any = fundId
    ? (allFunds || []).find((f: any) => f.idStr === fundId)
    : undefined;

  return (
    <PageContentWrapper>
      <div className="w-4/6 self-center">
        <FundAccount fundId={fundId} />
        <br />
        <br />
        <MetadataAccount fundId={fundId} />
        {/* <ShareClassAccount shareClassId={fund?.shareClasses[0].idStr} /> */}
      </div>
    </PageContentWrapper>
  );
}
