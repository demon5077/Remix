import { getAlbumById } from "@/lib/fetch";
import Album from "../_components/Album";

export const generateMetadata = async ({ params }) => {
  try {
    const res  = await getAlbumById(params.id);
    if (!res) return { title: "Arise — Album" };
    const data = await res.json();
    return {
      title: `${data.data.name} — Arise`,
      description: `Stream the album "${data.data.name}" on Arise.`,
    };
  } catch {
    return { title: "Album — Arise" };
  }
};

export default function Page({ params }) {
  return <Album id={params.id} />;
}
