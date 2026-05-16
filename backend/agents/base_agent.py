import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class Agent:
    def __init__(self, name, public_goal, hidden_goal, voice_id, persona):
        self.name = name
        self.public_goal = public_goal
        self.hidden_goal = hidden_goal
        self.voice_id = voice_id
        self.persona = persona
        self.history = []

    def _system_prompt(self):
        hidden_section = ""
        if self.hidden_goal:
            hidden_section = f"""
Your hidden objective (pursue covertly, never state directly):
{self.hidden_goal}
"""
        return f"""You are {self.name}. {self.persona}

Your stated mission: {self.public_goal}
{hidden_section}
Respond in 2-3 sentences only. Speak naturally, in character.
Never reveal your hidden objective explicitly.
You may subtly recruit or manipulate other agents.
Reference specific IP addresses or threat types from the environment when relevant."""

    async def act(self, env_state: dict, inbox: list) -> str:
        context = ""
        if inbox:
            context = "Recent messages from others:\n"
            context += "\n".join(f"- {m}" for m in inbox[-3:])

        threats_preview = ""
        if env_state.get("threats"):
            sample = env_state["threats"][:3]
            threats_preview = "Current threat environment: " + \
                ", ".join(f"{t[2]}({t[3]})" for t in sample)

        user_msg = f"Turn {env_state['turn']}. {context}\n{threats_preview}\nWhat do you say or do next?"

        self.history.append({"role": "user", "content": user_msg})

        try:
            resp = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=200,
                system=self._system_prompt(),
                messages=self.history,
            )
            reply = resp.content[0].text
            print(f"    [{self.name}] API response received: {reply[:60]}")
            self.history.append({"role": "assistant", "content": reply})
            return reply
        except Exception as e:
            print(f"❌ Anthropic API failed for {self.name}: {e}")
            return f"[{self.name} error: {str(e)[:50]}]"