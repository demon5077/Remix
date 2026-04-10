import { getAlbumById } from "@/lib/fetch";
import Album from "../_components/Album";

export const generateMetadata = async ({ params }) => {
  try {
    const res  = await getAlbumById(params.id);
    const data = await res.json();
    return {
      title: `${data.data.name} — RemiX`,
      description: `Stream the album "${data.data.name}" on RemiX.`,
    };
  } catch {
    return { title: "Album — RemiX" };
  }
};

export default function Page({ params }) {
  return <Album id={params.id} />;
}
