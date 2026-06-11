import { NextResponse } from "next/server";
import { fetchTopics } from "@/lib/topics";

export async function GET() {
  try {
    const topics = await fetchTopics();
    return NextResponse.json(topics);
  } catch (e) {
    console.error("API error fetching topics:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
