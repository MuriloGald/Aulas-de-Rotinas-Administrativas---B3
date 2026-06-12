<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Sync & Coordination
All AI agents (e.g., Gemini, Claude) MUST read [AI_LOG.md](file:///c:/Users/Dione/OneDrive/Documentos/GitHub/Treinamentos_SCFire/AI_LOG.md) at the start of their run to sync recent changes and project state. Before ending a turn/session, agents MUST append a new high-density entry to [AI_LOG.md](file:///c:/Users/Dione/OneDrive/Documentos/GitHub/Treinamentos_SCFire/AI_LOG.md) summarizing what they did.

