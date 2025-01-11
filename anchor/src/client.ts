import { GlamClientConfig } from "./clientConfig";
import { BaseClient } from "./client/base";
import { DriftClient } from "./client/drift";
import { InvestorClient } from "./client/investor";
import { JupiterClient } from "./client/jupiter";
import { MarinadeClient } from "./client/marinade";
import { WSolClient } from "./client/wsol";
import { StakingClient } from "./client/staking";
import { StateClient } from "./client/state";
import { ShareClassClient } from "./client/shareclass";

export { JUPITER_API_DEFAULT } from "./client/base";

/**
 * Main entrypoint for the GLAM SDK
 *
 * Lazy loads each client/module at first use
 */
export class GlamClient extends BaseClient {
  private _drift?: DriftClient;
  private _investor?: InvestorClient;
  private _jupiter?: JupiterClient;
  private _marinade?: MarinadeClient;
  private _wsol?: WSolClient;
  private _staking?: StakingClient;
  private _state?: StateClient;
  private _shareClass?: ShareClassClient;

  public constructor(config?: GlamClientConfig) {
    super(config);
  }

  get drift(): DriftClient {
    if (!this._drift) {
      // @ts-ignore Type instantiation is excessively deep and possibly infinite.
      this._drift = new DriftClient(this);
    }
    return this._drift;
  }

  get investor(): InvestorClient {
    if (!this._investor) {
      this._investor = new InvestorClient(this);
    }
    return this._investor;
  }

  get jupiter(): JupiterClient {
    if (!this._jupiter) {
      this._jupiter = new JupiterClient(this);
    }
    return this._jupiter;
  }

  get marinade(): MarinadeClient {
    if (!this._marinade) {
      this._marinade = new MarinadeClient(this);
    }
    return this._marinade;
  }

  get wsol(): WSolClient {
    if (!this._wsol) {
      this._wsol = new WSolClient(this);
    }
    return this._wsol;
  }

  get staking(): StakingClient {
    if (!this._staking) {
      this._staking = new StakingClient(this, this.marinade);
    }
    return this._staking;
  }

  get state(): StateClient {
    if (!this._state) {
      this._state = new StateClient(this);
    }
    return this._state;
  }

  get shareClass(): ShareClassClient {
    if (!this._shareClass) {
      this._shareClass = new ShareClassClient(this);
    }
    return this._shareClass;
  }
}
