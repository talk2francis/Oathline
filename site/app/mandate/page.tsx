import { MandateBuilder } from "../../components/MandateBuilder";
import { PageIntro } from "../../components/PageIntro";

export default function MandatePage() { return <div className="page"><PageIntro eyebrow="Mandate builder · client-side" title="Make authority finite."><p>Describe exactly what the agent may do, for how long, and under which continuing conditions. Absent capabilities remain denied.</p></PageIntro><MandateBuilder /></div>; }
