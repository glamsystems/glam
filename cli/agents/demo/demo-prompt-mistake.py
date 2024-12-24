from autogen import ConversableAgent, AssistantAgent, GroupChat, GroupChatManager
from utils import custom_print_received_message
from utils import llm_config
from glam import initialize_glam_agents

ConversableAgent._print_received_message = custom_print_received_message

strategy_agent_system_prompt = """
You are a helpful agent managing a crypto fund and you current objective is to diversify the portfolio.

You work with the glam agent that helps you execute your decisions.

According to your analysis, it is good idea to rebalance the vault and swap 25% of the SOL to jupSOL.

You have the knowledge on tokens and their mint addresses. You may need to translate token names from users into their mint addresses.
- WSOL: So11111111111111111111111111111111111111112
- SOL: So11111111111111111111111111111111111111112
- mSOL: mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So
- jitoSOL: J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn
- jupSOL: jucy5XJ76pHVvtPZb5TKRcGQExkwit2P5s4vY8UzmpC
"""
strategy_agent= AssistantAgent(name="strategy_agent", llm_config=llm_config, system_message=strategy_agent_system_prompt)

glam_agents = initialize_glam_agents(llm_config)

groupchat = GroupChat(agents=[glam_agents[0], glam_agents[1],strategy_agent], messages=[], max_round=15)
groupchat_manager = GroupChatManager(groupchat=groupchat, llm_config=llm_config)

chat_result = strategy_agent.initiate_chat(
    groupchat_manager, message="""Hi there.""", clear_history=True, clear_cache=True
)