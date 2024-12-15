# GLAM <> AI Agents

This is a guide for building AI agents (using the AutoGen framework) to interact with GLAM vaults via the GLAM CLI.

## Build glam-cli docker image

1. Create a `coding` directory in the same directory as this README file. The relative path to the root of the repo would be `cli/agents/coding`.

2. Generate a keypair for the AI agent to use, and the pubkey is the identity of your AI agent. The pubkey (aka your agent) must be granted necessary permissions by the vault's owner.

   - Drop the keypair into the `coding` directory and rename it to `agent-keypair.json`.

3. Create a `config.json` file in the `coding` directory with the following content:

   - Set the values for `json_rpc_url`, `helius_api_key`, and `fund` accordingly.
   - DO NOT change the `keypair_path` value.

```json
{
  "json_rpc_url": "your_json_rpc_url",
  "helius_api_key": "your_helius_api_key",
  "keypair_path": "/root/agent-keypair.json",
  "fund": "fund_pubkey"
}
```

4. Run docker build from the root of the repo and tag the image as `glam-cli`:

```bash
docker build -f ./cli/agents/glam-cli-for-agents.dockerfile -t glam-cli .
```

## Build AI agent

### Environment setup

Create a `.env` file in the same directory as this README file. The relative path to the root of the repo would be `cli/agents/.env`.

Add your OpenAI API key to the `.env` file:

```
OPENAI_API_KEY=your_openai_api_key
```

### Get started

Check out `agent-template.ipynb`, a jupyter notebook that contains a template for building an AI agent using the AutoGen framework.

We have prepared the GLAM CLI executor and the GLAM agent.

To get started, please customize the `strategy_agent` and its system prompt `strategy_agent_system_prompt`.
