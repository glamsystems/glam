# AutoGen Integration

## Python Environment

Check out the GLAM repo and enter `cli/agents`directory:

```
git checkout https://github.com/glamsystems/glam
cd glam/cli/agents
```

Create a virtual environment with Python 3.12 (you may run into AutoGen dependencies issues if using a different Python version):

```bash
python3.12 -m venv .venv
```

Activate the virtual environment:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install python-dotenv \
    pyautogen \
    autogen-core==0.4.0.dev3 \
    autogen-core==0.4.0.dev3 \
    autogen-agentchat==0.4.0.dev3
```

## OpenAI API Key

Create a `.env` file and add your OpenAI API key to it:

```
OPENAI_API_KEY=your_openai_api_key
```

## CLI Config and Keypair

Create a `coding`directory and add the following `config.json` to it:

```
{
  "helius_api_key": "your_helius_api_key",
  "keypair_path": "/workspace/agent-keypair.json",
  "fund": "optional_fund_pubkey"
}
```

You can use an existing keypair or generate a new keypair for the AI agent to use. The pubkey is the identity of your AI agent, and the pubkey (aka your agent) must be granted necessary permissions by the vault's owner to sign transactions. Permissions can be managed at [https://gui.glam.systems/vault/access](https://gui.glam.systems/vault/access) by vault owner.

## Start an Agent

Check out [`agent-template.ipynb`](../../../cli/agents/agent-template.ipynb), a Jupyter notebook that contains a template for building an AI agent using the AutoGen framework.

We have prepared the GLAM CLI executor and the GLAM agent. You can customize the `strategy_agent` and its system prompt `strategy_agent_system_prompt` to implement your own strategy.

During the Solana AI Hackathon, we developed a few agents for demo purposes, which can be found at [https://github.com/glamsystems/glam/tree/main/cli/agents/demo](https://github.com/glamsystems/glam/tree/main/cli/agents/demo)
