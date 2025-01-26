import { GlamClient } from "@glamsystems/glam-sdk";
import { AnchorProvider } from "@coral-xyz/anchor";

export class Client extends GlamClient {
  public constructor(connection: any, wallet: any) {
    super({
      provider: new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      }),
    });
  }

  stakeJup = async (amount: number) => {
    const name = "fatcat-" + this.getSigner().toBase58().substring(0, 6);
    console.log(`+ Creating vault ${name}`);
    this.state.createState({ name });
  };
}
