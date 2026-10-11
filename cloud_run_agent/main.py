import os
from fastapi import FastAPI
from google.adk.agents import Agent

app = FastAPI(title="Billing Triage Agent (Cloud Run + Agent Registry)")

# Define the ADK Agent using Gemini 3 Flash series
billing_agent = Agent(
    name="billing_triage_agent",
    model="gemini-3-flash-preview",
    description="Autonomous billing support agent that audits invoice anomalies and refunds.",
    instruction=(
        "You are an enterprise billing triage agent. Analyze invoice disputes "
        "and recommend resolution actions."
    ),
)


@app.get("/.well-known/agent-card.json")
def get_agent_card():
  """Exposes the Agent2Agent (A2A) Agent Card for Agent Registry introspection."""
  return {
      "schemaVersion": "v1",
      "displayName": "Billing Triage Agent",
      "description": "Cloud Run A2A agent that triages enterprise billing anomalies.",
      "skills": [
          {
              "name": "audit_invoice_dispute",
              "description": "Inspects invoice line items for duplicate charges or SLA credits.",
          },
          {
              "name": "issue_credit_memo",
              "description": "Generates an approved credit memo for verified billing discrepancies.",
          },
      ],
  }


@app.get("/healthz")
def healthz():
  return {"status": "healthy", "agent": billing_agent.name}


if __name__ == "__main__":
  import uvicorn

  port = int(os.environ.get("PORT", "8080"))
  uvicorn.run(app, host="0.0.0.0", port=port)
