import { NextRequest, NextResponse } from "next/server";
import { fetchTopicDetails } from "@/lib/topics";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const topic = await fetchTopicDetails(id);
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }
    return NextResponse.json(topic);
  } catch (e) {
    console.error(`API error fetching topic ${id}:`, e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
