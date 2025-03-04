import { GlamClientConfig } from "./clientConfig";
import { BaseClient } from "./client/base";
import { DriftClient } from "./client/drift";
import { InvestorClient } from "./client/investor";
import { JupiterSwapClient } from "./client/jupiter";
import { JupiterVoteClient } from "./client/jupiter";
import { MarinadeClient } from "./client/marinade";
import { WSolClient } from "./client/wsol";
import { StakingClient } from "./client/staking";
import { StateClient } from "./client/state";
import { MintClient } from "./client/mint";
import { KaminoLendingClient } from "./client/kamino";
import { MeteoraDlmmClient } from "./client/meteora";

export { JUPITER_API_DEFAULT } from "./client/base";

/**
 * Main entrypoint for the GLAM SDK
 *
 * Lazy loads each client/module at first use
 */
export class GlamClient extends BaseClient {
  private _drift?: DriftClient;
  private _investor?: InvestorClient;
  private _jupiterSwap?: JupiterSwapClient;
  private _jupiterVote?: JupiterVoteClient;
  private _marinade?: MarinadeClient;
  private _wsol?: WSolClient;
  private _staking?: StakingClient;
  private _state?: StateClient;
  private _mint?: MintClient;
  private _kaminoLending?: KaminoLendingClient;
  private _meteoraDlmm?: MeteoraDlmmClient;

  public constructor(config?: GlamClientConfig) {
    super(config);
  }

  get drift(): DriftClient {
    if (!this._drift) {
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

  get jupiterSwap(): JupiterSwapClient {
    if (!this._jupiterSwap) {
      this._jupiterSwap = new JupiterSwapClient(this);
    }
    return this._jupiterSwap;
  }

  get jupiterVote(): JupiterVoteClient {
    if (!this._jupiterVote) {
      this._jupiterVote = new JupiterVoteClient(this);
    }
    return this._jupiterVote;
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

  get mint(): MintClient {
    if (!this._mint) {
      this._mint = new MintClient(this);
    }
    return this._mint;
  }

  get kaminoLending(): KaminoLendingClient {
    if (!this._kaminoLending) {
      this._kaminoLending = new KaminoLendingClient(this);
    }
    return this._kaminoLending;
  }

  get meteoraDlmm(): MeteoraDlmmClient {
    if (!this._meteoraDlmm) {
      this._meteoraDlmm = new MeteoraDlmmClient(this);
    }
    return this._meteoraDlmm;
  }
}
