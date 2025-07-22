import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import {
  normalizeArabicText,
  generateArabicNameVariations,
  createFlexibleArabicPattern,
} from "@/lib/arabic-normalizer";
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

      const trimmedQuery = query.trim();

      // Check if query is numeric (for seating_no)
      const isNumeric = /^\d+$/.test(trimmedQuery);

      if (isNumeric) {
        // If it's a number, search only seating_no
        searchQuery = {
          seating_no: { $regex: trimmedQuery, $options: "i" },
        };
      } else {
        // For text searches, use Arabic normalization
        try {
          // Generate Arabic variations for the search term
          const arabicVariations = generateArabicNameVariations(trimmedQuery);

          // Create flexible regex patterns for Arabic text
          const arabicPatterns = arabicVariations.map((variation) => {
            try {
              return createFlexibleArabicPattern(variation);
            } catch (error) {
              // Fallback to simple escaped pattern
              return variation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            }
          });

          // Build the search query with multiple Arabic variations
          const arabicSearchConditions = arabicPatterns.map((pattern) => ({
            arabic_name: { $regex: pattern, $options: "i" },
          }));

          searchQuery = {
            $or: [
              // Original query for seating_no (in case it contains letters)
              { seating_no: { $regex: trimmedQuery, $options: "i" } },
              // Original Arabic name search
              { arabic_name: { $regex: trimmedQuery, $options: "i" } },
              // Normalized Arabic name search
              {
                arabic_name: {
                  $regex: normalizeArabicText(trimmedQuery),
                  $options: "i",
                },
              },
              // All Arabic variations
              ...arabicSearchConditions,
            ],
          };
        } catch (normalizationError) {
          console.warn(
            "Arabic normalization failed, using fallback search:",
            normalizationError
          );

          // Fallback to basic search if normalization fails
          searchQuery = {
            $or: [
              { seating_no: { $regex: trimmedQuery, $options: "i" } },
              { arabic_name: { $regex: trimmedQuery, $options: "i" } },
            ],
          };
        }
      }
    }

    const results = await Student.find(searchQuery)
      .sort({ seating_no: 1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      results,
      searchInfo: {
        query: query?.trim(),
        totalResults: results.length,
        isNumericSearch: query ? /^\d+$/.test(query.trim()) : false,
      },
    });
  } catch (error) {
    console.error("Search error:", error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Search failed",
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Alternative simpler version if the above is too complex
export async function GET_SIMPLE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    await dbConnect();

    let searchQuery = {};

    if (query && query.trim()) {
      // Log the search query
      try {
        await SearchQuery.create({ term: query.trim() });
      } catch (e) {
        console.error("Failed to log search query:", e);
      }

      const trimmedQuery = query.trim();
      const normalizedQuery = normalizeArabicText(trimmedQuery);

      searchQuery = {
        $or: [
          // Seating number search
          { seating_no: { $regex: trimmedQuery, $options: "i" } },
          // Original Arabic name
          { arabic_name: { $regex: trimmedQuery, $options: "i" } },
          // Normalized Arabic name
          { arabic_name: { $regex: normalizedQuery, $options: "i" } },
          // Basic Arabic variations
          {
            arabic_name: {
              $regex: trimmedQuery.replace(/أ|إ|آ/g, "ا"),
              $options: "i",
            },
          },
          {
            arabic_name: {
              $regex: trimmedQuery.replace(/ى/g, "ي"),
              $options: "i",
            },
          },
          {
            arabic_name: {
              $regex: trimmedQuery.replace(/ة/g, "ه"),
              $options: "i",
            },
          },
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
