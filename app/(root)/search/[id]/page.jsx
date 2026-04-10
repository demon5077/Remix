import Search from "../_components/Search";

export const generateMetadata = ({ params }) => {
  const q = decodeURIComponent(params.id);
  return {
    title: `"${q.toUpperCase()}" — RemiX Search`,
    description: `Search results for ${q} on RemiX.`,
  };
};

export default function Page({ params }) {
  return <Search params={params} />;
}
