"""Deploy an ADK Agent to Gemini Enterprise Agent Platform (Agent Runtime) with automatic Agent Registry sync."""

import os
import vertexai
from google.adk.agents import Agent

PROJECT_ID = os.environ.get("PROJECT_ID", "YOUR_PROJECT_ID")
REGION = os.environ.get("REGION", "us-central1")


def lookup_support_ticket(ticket_id: str) -> str:
  """Fetches enterprise support ticket metadata by ID."""
  return f"Ticket {ticket_id}: Priority P1 - Database connection pool exhaustion."


# 1. Define the ADK Agent using the latest Gemini 3.1 Flash model
support_agent = Agent(
    name="support_agent",
    model="gemini-3.1-flash-preview",
    description="An agent that handles enterprise support tickets.",
    instruction="You triage incoming support tickets and summarize root causes.",
    tools=[lookup_support_ticket],
)


def deploy():
  client = vertexai.Client(project=PROJECT_ID, location=REGION)

  # 2. Create and deploy the agent to Agent Runtime in Gemini Enterprise Agent Platform.
  # This action AUTOMATICALLY registers the agent in Agent Registry
  # and keeps its metadata synchronized on future updates or deletions.
  remote_agent = client.agent_engines.create(
      agent=support_agent,
      config={
          "display_name": "support-agent",
          "description": "An agent that handles enterprise support tickets.",
          "requirements": [
              "google-cloud-aiplatform[agent_engines,adk]",
              "google-adk>=2.5.0",
          ],
      },
  )
  print(f"✅ Deployed to Agent Runtime & auto-registered in Agent Registry:")
  print(f"   Resource Name: {remote_agent.api_resource.name}")


if __name__ == "__main__":
  deploy()
