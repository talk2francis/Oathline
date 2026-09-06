import { PageIntro } from "../../components/PageIntro";
import { Verifier } from "../../components/Verifier";

export default function VerifyPage() {
  return <div className="page"><PageIntro eyebrow="Client-side chain verifier" title="Trust the links, not the page."><p>Drop any Oathline JSONL receipt chain. This browser recreates canonical JSON, checks every SHA-256 hash and `prev` link, and names the first mismatched sequence.</p></PageIntro><Verifier /><div className="note" style={{ marginTop: 24 }}>The shipped example contains the real demo execution and reconciliation. Change one character in a downloaded copy and upload it again; the original remains unchanged.</div></div>;
}
