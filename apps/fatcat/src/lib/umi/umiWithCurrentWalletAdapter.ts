import useUmiStore from "../../store/useUmiStore";
import { signerIdentity } from "@metaplex-foundation/umi";

const umiWithCurrentWalletAdapter = () => {

  // Because Zustand is used to store the Umi instance, the Umi instance can be accessed from the store 
  // in both hook and non-hook format. This is an example of a non-hook format that can be used in a ts file
  // instead of a React component file.


  const umi = useUmiStore.getState().umi;
  const currentWallet = useUmiStore.getState().signer;
  if (!currentWallet) throw new Error("No wallet selected");
  return umi.use(signerIdentity(currentWallet));
};
export default umiWithCurrentWalletAdapter;