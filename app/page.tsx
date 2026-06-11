import { fetchTopics } from "@/lib/topics";
import HomeClient from "./HomeClient";

// Opt out of static rendering to always load fresh topics
export const revalidate = 0;

export default async function Home() {
  const topics = await fetchTopics();
  return <HomeClient initialTopics={topics} />;
}
