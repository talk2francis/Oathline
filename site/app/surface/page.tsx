import { PageIntro } from "../../components/PageIntro";
import { SurfaceTable } from "../../components/SurfaceTable";

export default function SurfacePage() {
  return <div className="page"><PageIntro eyebrow="Observed Agent OS surface" title="What we observed."><p>This is not a complete manifest and is not presented as a first public tool list. Each row records the client, version, date, method, classification, and shapes available during our observation.</p></PageIntro><SurfaceTable /></div>;
}
