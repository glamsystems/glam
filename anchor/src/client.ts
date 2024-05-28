import * as anchor from "@coral-xyz/anchor";

import { GlamClientConfig } from "./clientConfig";
import {
  BaseClient,
  JUPITER_API_DEFAULT as _JUPITER_API_DEFAULT
} from "./client/base";
import { DriftClient } from "./client/drift";
import { JupiterClient } from "./client/jupiter";
import { MarinadeClient } from "./client/marinade";
import { WSolClient } from "./client/wsol";

export const JUPITER_API_DEFAULT = _JUPITER_API_DEFAULT;

export class GlamClient extends BaseClient {
  drift: DriftClient;
  jupiter: JupiterClient;
  marinade: MarinadeClient;
  wsol: WSolClient;

  public constructor(config?: GlamClientConfig) {
    super(config);
    this.drift = new DriftClient(this);
    this.jupiter = new JupiterClient(this);
    this.marinade = new MarinadeClient(this);
    this.wsol = new WSolClient(this);
  }
}
