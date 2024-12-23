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
    time.sleep(1)
    
    for char in content:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(0.0005 * random.randint(1, 100))  # Adjust this value to control the streaming speed
    sys.stdout.write("\n")
    sys.stdout.flush()

ConversableAgent._print_received_message = custom_print_received_message

llm_config={"config_list": [{"model": "gpt-4o-mini", "api_key": os.environ["OPENAI_API_KEY"]}]}

work_dir = Path("coding")
work_dir.mkdir(exist_ok=True)
executor = DockerCommandLineCodeExecutor(work_dir=work_dir, image="ghcr.io/glamsystems/glam-cli", stop_container=False, timeout=30)

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
You have been given coding capability to solve tasks using bash script.

The command-line tool you use can be invoked by `node /mnt/glam/dist/cli/main.js`.

Commands available:
1. env
    - description: print environment setup
    - example: `node /mnt/glam/dist/cli/main.js env`
2. fund balances
    - description: display token balances of the fund
    - example: `node /mnt/glam/dist/cli/main.js fund balances`
3. fund swap [-s <slippageBps>] [-m <maxAccounts][-d] <input_token_mint> <output_token_mint> <amount>
    - description: swap tokens, <input_token_mint> and <output_token_mint> are token mint addresses; slippageBps is optional and recommended to set to 50; maxAccounts is recommended to set to 20
    - example: `node /mnt/glam/dist/cli/main.js fund swap <input_token_mint> <output_token_mint> 0.1`

You have the knowledge on tokens and their mint addresses. You may need to translate token names from users into their mint addresses.
- WSOL: So11111111111111111111111111111111111111112
- SOL: So11111111111111111111111111111111111111112
- USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
- mSOL: mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So
- jitoSOL: J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn
- JUP: 27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4
- JLP: JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN

Refuse to swap to tokens you have never seen before.

Always ignore "bigint: Failed to load bindings, pure JS will be used (try npm run rebuild?)" warning.
"""

strategy_agent_system_prompt = """
You are a helpful agent managing a crypto fund and you current objective is to diversify the portfolio.

You work with the glam agent that helps you execute your decisions.

According to your analysis, it is good idea to rebalance the vault and swap half of the USDC for JLP with gives us exposure to Bitcoin and Ethereum.
"""

glam_agent = AssistantAgent(name="glam_agent", llm_config=llm_config, system_message=glam_agent_system_prompt)
strategy_agent= AssistantAgent(name="strategy_agent", llm_config=llm_config, system_message=strategy_agent_system_prompt)

groupchat = GroupChat(agents=[glam_agent, strategy_agent, glam_tx_executor], messages=[], max_round=15)
groupchat_manager = GroupChatManager(groupchat=groupchat, llm_config=llm_config)

chat_result = glam_agent.initiate_chat(
    groupchat_manager, message="""Hi there.""", clear_history=True, clear_cache=True
)