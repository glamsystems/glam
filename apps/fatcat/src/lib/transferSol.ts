// Example of a function that transfers SOL from one account to another pulling umi
// from the useUmiStore in a ts file which is not a React component file calling a hook.

import { transferSol } from "@metaplex-foundation/mpl-toolbox";
import umiWithCurrentWalletAdapter from "./umi/umiWithCurrentWalletAdapter";
import { publicKey, sol } from "@metaplex-foundation/umi";
import sendAndConfirmWalletAdapter from "./umi/sendAndConfirmWithWalletAdapter";

// This function transfers SOL from the current wallet to a destination account and is callable
// from any tsx/ts or component file in the project.

const transferSolToDestination = async ({
  destination,
  amount,
}: {
  destination: string;
  amount: number;
}) => {
  // Import Umi from `umiWithCurrentWalletAdapter`.
  const umi = umiWithCurrentWalletAdapter();

  // Create a transactionBuilder using the `transferSol` function from the mpl-toolbox.
  const tx = transferSol(umi, {
    destination: publicKey(destination),
    amount: sol(amount),
  });

  // Use the sendAndConfirmWithWalletAdapter method to send the transaction.
  // We do not need to pass the umi stance or wallet adapter as an argument because it is
  // that is fetched fresh from the store in the `sendAndConfirmWithWalletAdapter function`.
  const res = await sendAndConfirmWalletAdapter(tx);
};

export default transferSolToDestination;
