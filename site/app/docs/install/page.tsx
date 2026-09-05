import { CodeBlock } from "../../../components/CodeBlock";
import { PageIntro } from "../../../components/PageIntro";

export default function InstallPage() {
  return <div className="page"><PageIntro eyebrow="Install · observed client status" title="Start from the repository."><p>The npm package is not published. These instructions use the shipped source and do not ask for a Binance API key.</p></PageIntro><div className="stack">
    <CodeBlock label="1 · Install and verify">{"git clone https://github.com/talk2francis/Oathline.git\ncd Oathline\ncorepack enable\npnpm install --frozen-lockfile\npnpm build\npnpm test"}</CodeBlock>
    <CodeBlock label="2 · Connect official Agent OS">{"codex mcp add binance-agentic --url https://agent.binance.com/mcp/agentic\ncodex mcp login binance-agentic\n\nGrant Market data + Account + Spot Trade only.\nLeave Transfer and Futures off. Do not create an API key."}</CodeBlock>
    <CodeBlock label="3 · Initialize and arm">{"pnpm oathline init\n# Edit ~/.oathline/oathline.toml — expires_at is required\npnpm oathline arm\npnpm oathline status"}</CodeBlock>
    <table className="data-table"><thead><tr><th>Client</th><th>Status</th><th>Observed evidence</th></tr></thead><tbody>
      <tr><td><code>Codex CLI 0.153.3</code></td><td><span className="status valid">ENFORCED · EXPERIMENTAL ADAPTER</span></td><td>Personally observed honoring a `spot.newOrder` denial. This claim is version-specific.</td></tr>
      <tr><td><code>Claude Code</code></td><td><span className="status attention">UNTESTED</span></td><td>No Claude Code runtime observation ships in this repository.</td></tr>
      <tr><td><code>Other MCP clients</code></td><td><span className="status attention">ADVISORY AT MOST</span></td><td>No enforcement claim until that exact client and version is observed honoring a denial.</td></tr>
    </tbody></table>
    <div className="note">Oathline holds no Binance credential. Binance authentication remains in the official OAuth connection, and Binance Emergency Stop remains the real kill switch.</div>
  </div></div>;
}
