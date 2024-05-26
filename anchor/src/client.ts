import * as anchor from "@coral-xyz/anchor";

import { GlamClientConfig } from "./clientConfig";
import { BaseClient } from "./client/base";
import { DriftClient } from "./client/drift";
import { JupiterClient } from "./client/jupiter";
import { MarinadeClient } from "./client/marinade";

export class GlamClient extends BaseClient {
  drift: DriftClient;
  jupiter: JupiterClient;
  marinade: MarinadeClient;

  public constructor(config?: GlamClientConfig) {
    super(config);
    this.drift = new DriftClient(this);
    this.jupiter = new JupiterClient(this);
    this.marinade = new MarinadeClient(this);
  }
}
