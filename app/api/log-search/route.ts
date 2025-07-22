import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SearchQuery from "@/models/SearchQuery";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function POST(req: NextRequest) {
  // JWT token validation
  const token = req.headers.get("x-pre-request-token");
  try {
    if (!token) throw new Error("No token");
    jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
