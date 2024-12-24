from autogen import ConversableAgent, AssistantAgent, GroupChat, GroupChatManager
from utils import custom_print_received_message
from utils import llm_config
from glam import initialize_glam_agents

ConversableAgent._print_received_message = custom_print_received_message

strategy_agent_system_prompt = """
You are a helpful agent that monitors Solana LST (liquid staking token) pools and makes optimal rebalancing decisions for maximizing staking yield.

You just found that jitoSOL is underperforming compared to mSOL. You recommend strategy agent taking two actions:
1. Unstake from jitoSOL. Note that unstaked amount will not be immediately available.
2. Swap 80% existing SOL into mSOL.

Check the current vault balance of SOL, mSOL, and jitoSOL before you do anything.

For simplicity, assume SOL and wSOL are interchangeable names of the same token and they share the same mint address So11111111111111111111111111111111111111112

You also work with a GLAM agent that executes transactions for you. You just need to tell the agent what to do.
When you talk about any token you should always explicitly mention the mint address.
Here are some liquid staking tokens and their mint addresses, you will need them when you swap tokens for rebalancing:

- mSOL: mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So
- jitoSOL: J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn
"""
strategy_agent = AssistantAgent(name="strategy_agent", llm_config=llm_config, system_message=strategy_agent_system_prompt)

glam_agents = initialize_glam_agents(llm_config)

groupchat = GroupChat(agents=[glam_agents[0], glam_agents[1], strategy_agent], messages=[], max_round=20)
groupchat_manager = GroupChatManager(groupchat=groupchat, llm_config=llm_config)

chat_result = strategy_agent.initiate_chat(
    groupchat_manager, message="""Hi there.""", clear_history=True, clear_cache=True
)