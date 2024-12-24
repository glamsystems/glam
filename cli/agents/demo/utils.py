import sys
import time
import random
import os

from dotenv import load_dotenv

def custom_print_received_message(self, message, sender):
    if isinstance(message, dict):
        content = message.get("content", "")
    else:
        content = str(message)
    
    content = content.replace("bigint: Failed to load bindings, pure JS will be used (try npm run rebuild?)", "")
    content = content.replace("626d3925-3058-45c5-97a5-a4be014a9559", "[redacted]")
    is_error = content.find("exitcode: 1 (execution failed)") >= 0
    if is_error:
        sys.stdout.write("\033[1;31m")

    time.sleep(1)
    
    for char in content:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(0.0002 * random.randint(1, 100))  # Adjust this value to control the streaming speed

    sys.stdout.write("\n")
    sys.stdout.write("\033[0;0m")
    sys.stdout.flush()


load_dotenv()
llm_config={"config_list": [{"model": "gpt-4o", "api_key": os.environ["OPENAI_API_KEY"]}]}