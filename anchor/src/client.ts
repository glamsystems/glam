import { GlamClientConfig } from "./clientConfig";
import { BaseClient } from "./client/base";
import { DriftClient } from "./client/drift";
import { InvestorClient } from "./client/investor";
import { JupiterClient } from "./client/jupiter";
import { MarinadeClient } from "./client/marinade";
import { WSolClient } from "./client/wsol";

export { JUPITER_API_DEFAULT } from "./client/base";

export class GlamClient extends BaseClient {
  drift: DriftClient;
  investor: InvestorClient;
  jupiter: JupiterClient;
  marinade: MarinadeClient;
  wsol: WSolClient;

  public constructor(config?: GlamClientConfig) {
    super(config);
    this.drift = new DriftClient(this);
    this.investor = new InvestorClient(this);
    this.jupiter = new JupiterClient(this);
    this.marinade = new MarinadeClient(this);
    this.wsol = new WSolClient(this);
  }
}
