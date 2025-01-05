import useUmiStore from "../../store/useUmiStore";
import { Signer, signerIdentity } from "@metaplex-foundation/umi";

const umiWithSigner = (signer: Signer) => {
  const umi = useUmiStore.getState().umi;
  if (!signer) throw new Error("No Signer selected");
  return umi.use(signerIdentity(signer));
};

export default umiWithSigner;