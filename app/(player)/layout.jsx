import NextProvider from "@/components/providers/next-provider";
export default function PlayerLayout({ children }) {
  return <NextProvider>{children}</NextProvider>;
}
