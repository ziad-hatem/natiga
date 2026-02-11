"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Users, GraduationCap } from "lucide-react";
import type { IStudent } from "@/models/Student";
import {
  normalizeArabicText,
  generateArabicNameVariations,
  arabicTextMatches,
} from "@/lib/arabic-normalizer";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<IStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Fetch a new JWT token
  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch("/api/token");
      const data = await res.json();
      setToken(data.token);
      return data.token;
    } catch {
      setToken(null);
      return null;
    }
  }, []);

  // Optionally fetch token on mount
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const searchStudents = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      let jwtToken = token;
      if (!jwtToken) {
        jwtToken = await fetchToken();
      }
      
      const params = new URLSearchParams({ q: query });
      const response = await fetch(`/api/search?${params}`, {
        headers: {
          "x-pre-request-token": jwtToken || "",
        },
      });

      // If unauthorized, try to refresh token and retry once
      if (response.status === 401) {
        jwtToken = await fetchToken();
        const retryResponse = await fetch(`/api/search?${params}`, {
          headers: {
            "x-pre-request-token": jwtToken || "",
          },
        });
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          setResults(retryData.results);
        } else {
          setResults([]);
        }
        setLoading(false);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Arabic-aware highlight function
  function highlightMatch(text: string | undefined, term: string) {
    if (!text || !term) return text;

    try {
      // For numeric searches (seating_no), use simple highlighting
      if (/^\d+$/.test(term.trim())) {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escapedTerm})`, "gi");
        const highlighted = text.replace(
          regex,
          '<mark style="background: #fde047; color: #000; border-radius: 0.25rem; padding: 0 0.2em;">$1</mark>'
        );
        return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
      }

      // For Arabic text, use normalized matching
      const normalizedText = normalizeArabicText(text);
      const normalizedTerm = normalizeArabicText(term);

      // If no match with normalized text, return original
      if (!normalizedText.includes(normalizedTerm)) {
        // Try with Arabic variations
        const variations = generateArabicNameVariations(term);
        let hasMatch = false;

        for (const variation of variations) {
          const normalizedVariation = normalizeArabicText(variation);
          if (normalizedText.includes(normalizedVariation)) {
            hasMatch = true;
            break;
          }
        }

        if (!hasMatch) {
          return text;
        }
      }

      // Create a flexible pattern for highlighting
      let highlighted = text;

      // Try to highlight the original term first
      const escapedOriginal = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let regex = new RegExp(`(${escapedOriginal})`, "gi");
      highlighted = highlighted.replace(
        regex,
        '<mark style="background: #fde047; color: #000; border-radius: 0.25rem; padding: 0 0.2em;">$1</mark>'
      );

      // If original term didn't match, try Arabic variations
      if (!highlighted.includes("<mark>")) {
        const variations = generateArabicNameVariations(term);

        for (const variation of variations) {
          if (variation !== term) {
            // Skip the original term we already tried
            const escaped = variation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            regex = new RegExp(`(${escaped})`, "gi");
            highlighted = highlighted.replace(
              regex,
              '<mark style="background: #fde047; color: #000; border-radius: 0.25rem; padding: 0 0.2em;">$1</mark>'
            );

            // If we found a match, break
            if (highlighted.includes("<mark>")) {
              break;
            }
          }
        }
      }

      // If still no highlight, try character-by-character fuzzy matching for Arabic
      if (!highlighted.includes("<mark>") && /[\u0600-\u06FF]/.test(text)) {
        // Create a more flexible Arabic pattern
        const arabicPattern = normalizedTerm
          .replace(/ا/g, "[اأإآ]")
          .replace(/ي/g, "[يى]")
          .replace(/ه/g, "[هة]")
          .replace(/\s+/g, "\\s*");

        try {
          regex = new RegExp(`(${arabicPattern})`, "gi");
          highlighted = text.replace(
            regex,
            '<mark style="background: #fde047; color: #000; border-radius: 0.25rem; padding: 0 0.2em;">$1</mark>'
          );
        } catch (regexError) {
          // If regex fails, just return the original text
          console.warn("Regex pattern failed:", regexError);
        }
      }

      return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
    } catch (error) {
      console.warn("Highlighting failed, using fallback:", error);
      // Fallback to simple highlighting
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escapedTerm})`, "gi");
      const highlighted = text.replace(
        regex,
        '<mark style="background: #fde047; color: #000; border-radius: 0.25rem; padding: 0 0.2em;">$1</mark>'
      );
      return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
    }
  }

  // Handle search on Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchStudents(searchTerm);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              البحث في نتائج الطلاب
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            ابحث عن الطلاب باستخدام رقم الجلوس أو الاسم
          </p>
        </div>

        {/* Search Input */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative flex gap-2 items-center">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="ابحث برقم الجلوس أو اسم الطالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                className="pl-12 pr-4 text-right text-lg h-12"
                dir="rtl"
              />
              <button
                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => searchStudents(searchTerm)}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "بحث"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                النتائج
              </CardTitle>
              {results.length > 0 && (
                <Badge variant="secondary">{results.length} طالب</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-muted-foreground">جاري البحث...</p>
                </div>
              </div>
            ) : !hasSearched ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground text-lg">
                  ابدأ بكتابة رقم الجلوس أو اسم الطالب للبحث
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  يمكنك البحث بأشكال مختلفة للأحرف العربية (أ، إ، آ، ا)
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground text-lg">
                  لا توجد نتائج مطابقة للبحث
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  جرب البحث بكلمات مختلفة أو تأكد من صحة رقم الجلوس
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {results.map((student) => (
                  <Card
                    key={student._id}
                    className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <Badge
                              variant="outline"
                              className="text-sm font-mono"
                            >
                              رقم الجلوس:{" "}
                              {highlightMatch(student.seating_no, searchTerm)}
                            </Badge>
                          </div>
                          <h3
                            className="text-xl font-semibold text-right mb-2"
                            dir="rtl"
                          >
                            {highlightMatch(student.arabic_name, searchTerm)}
                          </h3>
                        </div>
                        <div className="text-left">
                          <div className="text-sm text-muted-foreground mb-1">
                            المجموع الكلي
                          </div>
                          <Badge
                            variant={"default"}
                            className="text-lg px-3 py-1 text-white"
                          >
                            {student.total_degree}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
