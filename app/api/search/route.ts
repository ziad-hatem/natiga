import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import { normalizeArabicText } from "@/lib/arabic-normalizer";
import SearchQuery from "@/models/SearchQuery";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    await dbConnect();

    let searchQuery = {};

    if (query && query.trim()) {
      // Log the search query in the backend
      try {
        await SearchQuery.create({ term: query.trim() });
      } catch (e) {
        console.error("Failed to log search query:", e);
      }
      const normalizedQuery = normalizeArabicText(query.trim());

      searchQuery = {
        $or: [
          { seating_no: { $regex: query.trim(), $options: "i" } },
          { normalized_name: { $regex: normalizedQuery, $options: "i" } },
          { arabic_name: { $regex: query.trim(), $options: "i" } },
        ],
      };
    }

    const results = await Student.find(searchQuery)
      .sort({ seating_no: 1 })
      .limit(50)
      .lean();

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
