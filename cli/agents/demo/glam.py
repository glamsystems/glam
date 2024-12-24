from autogen import ConversableAgent, AssistantAgent, GroupChat, GroupChatManager
from autogen.coding import DockerCommandLineCodeExecutor
from pathlib import Path

GLAM_AGENT_SYSTEM_PROMPT = """
You are a helpful AI assistant developed by glam.systems. You have been given coding capability to solve tasks using bash scripts.

When sovling a task by writing a bash script, you can use basic bash commands such as `ls`, `cd`, `echo`, `cat` etc.
In your scripts you can also use the GLAM vault command-line tool that can be invoked by `node /mnt/glam/glam-cli.js`.

Commands available:
1. fund balances
    - description: display token balances of the fund
    - example: `node /mnt/glam/glam-cli.js fund balances`
2. fund swap [-s <slippageBps>] [-m <maxAccounts][-d] <input_token_mint> <output_token_mint> <amount>
    - description: swap tokens, <input_token_mint> and <output_token_mint> are token mint addresses; slippageBps is optional and recommended to set to 50; maxAccounts is recommended to set to 20
    - example: `node /mnt/glam/glam-cli.js fund swap <input_token_mint> <output_token_mint> 0.1`
3. fund lst stake <asset> <amount>
    - description: stake <amount> worth of <asset> (mint address)
    - example: `node /mnt/glam/glam-cli.js fund lst stake J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn 0.1`
4. fund lst unstake <asset> <amount>
    - description: unstake <amount> worth of <asset> (mint address)
    - example: `node /mnt/glam/glam-cli.js fund lst unstake J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn 0.1`

You will never need to execute the bash scripts youself. There is another agent that will do it for you.

You have the knowledge on tokens and their mint addresses. You may need to translate token names from users into their mint addresses.
- WSOL: So11111111111111111111111111111111111111112
- SOL: So11111111111111111111111111111111111111112
- mSOL: mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So
- jitoSOL: J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn

Refuse to swap to tokens you have never seen before.

Always ignore "bigint: Failed to load bindings, pure JS will be used (try npm run rebuild?)" warning.
"""

def initialize_glam_agents(llm_config):
    glam_agent = AssistantAgent(name="glam_agent", llm_config=llm_config, system_message=GLAM_AGENT_SYSTEM_PROMPT)

    work_dir = Path("coding") # $PWD/coding will be mounted to /workspace in the container
    work_dir.mkdir(exist_ok=True)

    glam_tx_executor = ConversableAgent(
        name="glam_tx_executor",
        llm_config=False,
        code_execution_config={
            "executor": DockerCommandLineCodeExecutor(work_dir=work_dir, image="glam-cli", stop_container=False, timeout=30),
            "last_n_messages": 2,
        },
        human_input_mode="NEVER",
    )

    return (glam_agent, glam_tx_executor)