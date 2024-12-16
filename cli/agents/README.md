# GLAM <> AI Agents

This is a guide for building AI agents (using the AutoGen framework) to interact with GLAM vaults via the GLAM CLI.

## Build glam-cli docker image

1. Create a `coding` directory in the same directory as this README file. The relative path to the root of the repo would be `cli/agents/coding`.

2. You can use an existing keypair or generate a new keypair for the AI agent to use. The pubkey is the identity of your AI agent, and the pubkey (aka your agent) must be granted necessary permissions by the vault's owner to sign transactions.

   - Drop the keypair into the `coding` directory and rename it to `agent-keypair.json`.

3. Create a `config.json` file in the `coding` directory with the following content:

   - `helius_api_key` is required.
   - DO NOT change the `keypair_path` value (unless you know what you're doing).
   - `fund` is optional, it can be set later on by telling the agent to use a specific one.

```json
{
  "helius_api_key": "your_helius_api_key",
  "keypair_path": "/workspace/agent-keypair.json",
  "fund": "optional_fund_pubkey"
}
```

4. Run docker build from the root of the repo and tag the image as `glam-cli`:

```bash
docker build -f ./cli/Dockerfile -t glam-cli .
```

## Build AI agent

### Python environment

1. Create a virtual environment in the same directory as this README file. The relative path to the root of the repo would be `cli/agents/.venv`. Python 3.12 is recommended, otherwise you may run into AutoGen dependencies issues.

```bash
python3.12 -m venv .venv
```

2. Activate the virtual environment:

```bash
source .venv/bin/activate
```

2. Install the required Python packages:

```bash
pip install python-dotenv pyautogen autogen-core==0.4.0.dev3 autogen-core==0.4.0.dev3 autogen-agentchat==0.4.0.dev3
```

### OpenAI API key

Create a `.env` file in the same directory as this README file. The relative path to the root of the repo would be `cli/agents/.env`.

Add your OpenAI API key to the `.env` file:

```
OPENAI_API_KEY=your_openai_api_key
```

### Get started

Check out `agent-template.ipynb`, a jupyter notebook that contains a template for building an AI agent using the AutoGen framework.

We have prepared the GLAM CLI executor and the GLAM agent.

To get started, please customize the `strategy_agent` and its system prompt `strategy_agent_system_prompt`.
