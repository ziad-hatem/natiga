import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SearchQuery from "@/models/SearchQuery";

export async function POST(req: NextRequest) {
  console.log("[log-search] Received request");
  await dbConnect();
  const { term } = await req.json();
  console.log("[log-search] Term to log:", term);
  if (!term || typeof term !== "string") {
    console.log("[log-search] Invalid search term");
    return NextResponse.json({ error: "Invalid search term" }, { status: 400 });
  }
  try {
    const searchQuery = await SearchQuery.create({ term });
    console.log("[log-search] Successfully logged:", searchQuery);
    return NextResponse.json({ success: true, searchQuery });
  } catch (err) {
    console.error("[log-search] Error logging search:", err);
    return NextResponse.json(
      { error: "Failed to log search" },
      { status: 500 }
    );
  }
}
