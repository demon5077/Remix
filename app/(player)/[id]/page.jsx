import { getSongsById } from "@/lib/fetch";
import Player from "../_components/Player";
import Recomandation from "../_components/Recomandation";
import AdvanceSearch from "../_components/AdvanceSearch";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ params }) => {
  try {
    const res  = await getSongsById(params.id);
    if (!res) return { title: "Arise — Now Playing" };
    const data = await res.json();
    const song = data?.data?.[0];
    if (!song) return { title: "Arise — Now Playing" };
    return {
      title: `${song.name} — Arise`,
      description: `Listen to "${song.name}" by ${song.artists?.primary?.[0]?.name || "Unknown"} on Arise.`,
      openGraph: {
        title: `${song.name} — Arise`,
        description: `Stream "${song.name}" by ${song.artists?.primary?.[0]?.name || "Unknown"}.`,
        type: "music.song",
        url: song.url,
        images: [
          {
            url: song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url,
            width: 1200,
            height: 630,
            alt: song.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${song.name} — Arise`,
        description: `Stream "${song.name}" by ${song.artists?.primary?.[0]?.name || "Unknown"}.`,
        images: song.image?.[0]?.url,
      },
    };
  } catch {
    return { title: "Arise — Now Playing" };
  }
};

export default function Page({ params }) {
  return (
    <div>
      <AdvanceSearch />
      <Player id={params.id} />
      <Recomandation id={params.id} />
    </div>
  );
}
