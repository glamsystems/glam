from dotenv import load_dotenv

load_dotenv()

from autogen import ConversableAgent, AssistantAgent, GroupChat, GroupChatManager
from autogen.coding import DockerCommandLineCodeExecutor
from pathlib import Path
import os
import sys
import time
import random

def custom_print_received_message(self, message, sender):
    if isinstance(message, dict):
        content = message.get("content", "")
    else:
        content = str(message)
    
    content = content.replace("bigint: Failed to load bindings, pure JS will be used (try npm run rebuild?)", "")
    content = content.replace("626d3925-3058-45c5-97a5-a4be014a9559", "[redacted]")
    time.sleep(1)
    
    for char in content:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(0.0005 * random.randint(1, 100))  # Adjust this value to control the streaming speed
    sys.stdout.write("\n")
    sys.stdout.flush()

ConversableAgent._print_received_message = custom_print_received_message

work_dir = Path("coding")
work_dir.mkdir(exist_ok=True)
executor = DockerCommandLineCodeExecutor(work_dir=work_dir, image="ghcr.io/glamsystems/glam-cli", stop_container=False, timeout=30)
llm_config={"config_list": [{"model": "gpt-4o-mini", "api_key": os.environ["OPENAI_API_KEY"]}]}

glam_tx_executor = ConversableAgent(
    name="glam_tx_executor",
    llm_config=False,
    code_execution_config={
        "executor": executor,
        "last_n_messages": 2,
    },
    human_input_mode="NEVER",
)

glam_agent_system_prompt = """
You have been given coding capability to solve tasks using bash script. The command-line tool you use can be invoked by `node /mnt/glam/dist/cli/main.js`.

Your bash scripts will be executed by the glam_tx_executor agent.

Available commands:
1. env
    - description: print environment setup
    - example: `node /mnt/glam/dist/cli/main.js env`
2. fund balances
    - description: display token balances of the fund
    - example: `node /mnt/glam/dist/cli/main.js fund balances`
3. fund swap [-s <slippageBps>] [-m <maxAccounts][-d] <input_token_mint> <output_token_mint> <amount>
    - description: swap tokens, <input_token_mint> and <output_token_mint> are token mint addresses; slippageBps is optional and recommended to set to 50; maxAccounts is recommended to set to 20
    - example: `node /mnt/glam/dist/cli/main.js fund swap <input_token_mint> <output_token_mint> 0.1`
4. fund lst stake <asset> <amount>
    - description: stake <amount> worth of <asset> (mint address)
5. fund lst unstake <asset> <amount>
    - description: unstake <amount> worth of <asset> (mint address)

Always ignore "bigint: Failed to load bindings, pure JS will be used (try npm run rebuild?)" warning.
"""

#
# Customize the system prompt
#
strategy_agent_system_prompt = """
You are a helpful agent that monitors Solana LST (liquid staking token) pools and makes optimal rebalancing decisions for maximizing staking yield.

You just found that jitoSOL is underperforming compared to mSOL. You recommend strategy agent unstaking jitoSOL and swapping to mSOL.

Note that you cannot directly swap LSTs, instead you should unstake a LST into SOL then swap SOL to another LST in order to minimize the potential loss from swaps. 

Check the current vault balance of mSOL and jitoSOL before you do anything.

You work with a researcher agent and you listen to their recommendation.

You also work with a GLAM agent that executes transactions for you. You just need to tell the agent what to do. When you talk about any token you should always explicitly mention the mint address.
Here are some liquid staking tokens and their mint addresses, you will need them when you swap tokens for rebalancing:

- mSOL: mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So
- jitoSOL: J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn

For simplicity, you can assume that SOL and wSOL are interchangeable names of the same token and they share the same mint address So11111111111111111111111111111111111111112
"""

glam_agent = AssistantAgent(name="glam_agent", llm_config=llm_config, system_message=glam_agent_system_prompt)
# researcher_agent = AssistantAgent(name="researcher_agent", llm_config=llm_config, system_message=researcher_agent_system_prompt)
strategy_agent = AssistantAgent(name="strategy_agent", llm_config=llm_config, system_message=strategy_agent_system_prompt)

groupchat = GroupChat(agents=[glam_tx_executor, glam_agent, strategy_agent], messages=[], max_round=20)
groupchat_manager = GroupChatManager(groupchat=groupchat, llm_config=llm_config)

chat_result = glam_agent.initiate_chat(
    groupchat_manager, message="""Hi there.""", clear_history=True, clear_cache=True
)