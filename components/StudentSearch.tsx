"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Users } from "lucide-react";
import type { IStudentResult } from "@/models/StudentResult";
import { useToast } from "@/hooks/use-toast";

interface SearchResponse {
  results: IStudentResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

function highlightMatch(text: string | undefined, term: string) {
  if (!text || !term) return text;
  // Escape special regex characters in the term
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedTerm})`, "gi");
  const highlighted = text.replace(
    regex,
    '<mark style="background: #fde047; color: #000; border-radius: 0.25rem; padding: 0 0.2em;">$1</mark>'
  );
  console.log("highlightMatch:", { text, term, highlighted });
  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
}

export default function StudentSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<IStudentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const { toast } = useToast();

  const searchStudents = useCallback(async (query: string, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: "20",
      });

      const response = await fetch(`/api/search?${params}`);
      const data: SearchResponse = await response.json();

      if (response.ok) {
        setResults(data.results);
        setPagination(data.pagination);
      } else {
        console.error("Search failed:", (data as any)?.error);
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    searchStudents("");
  }, [searchStudents]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchStudents(searchTerm, 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchStudents]);

  const handlePageChange = (newPage: number) => {
    searchStudents(searchTerm, newPage);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            البحث في نتائج الطلاب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative flex gap-2 items-center">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="ابحث باسم الطالب أو المادة أو رقم الطالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-right"
              dir="rtl"
            />
            <Button
              variant="outline"
              onClick={async () => {
                if (searchTerm.trim()) {
                  try {
                    const res = await fetch("/api/log-search", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ term: searchTerm }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      toast({
                        title: "تم تسجيل البحث",
                        description: `تم تسجيل البحث: ${searchTerm}`,
                      });
                      console.log("Search query logged:", data);
                    } else {
                      toast({
                        title: "فشل تسجيل البحث",
                        description: data?.error || "حدث خطأ أثناء تسجيل البحث",
                        variant: "destructive",
                      });
                      console.error("Failed to log search query:", data);
                    }
                  } catch (err) {
                    toast({
                      title: "خطأ في الاتصال",
                      description: "حدث خطأ في الاتصال بالخادم",
                      variant: "destructive",
                    });
                    console.error("Error logging search query:", err);
                  }
                }
              }}
            >
              سجل البحث
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>النتائج</CardTitle>
            <Badge variant="secondary">{pagination.total} نتيجة</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="mr-2">جاري البحث...</span>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اسم الطالب</TableHead>
                      <TableHead className="text-right">رقم الطالب</TableHead>
                      <TableHead className="text-right">المادة</TableHead>
                      <TableHead className="text-right">الدرجة</TableHead>
                      <TableHead className="text-right">الفصل</TableHead>
                      <TableHead className="text-right">السنة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          لا توجد نتائج
                        </TableCell>
                      </TableRow>
                    ) : (
                      results.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell className="text-right font-medium">
                            {highlightMatch(student.studentName, searchTerm)}
                          </TableCell>
                          <TableCell className="text-right">
                            {highlightMatch(student.studentId, searchTerm) ||
                              "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {highlightMatch(student.subject, searchTerm) || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {student.grade !== undefined ? (
                              <Badge
                                variant={
                                  student.grade >= 60
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {student.grade}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {highlightMatch(student.semester, searchTerm) ||
                              "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {highlightMatch(student.year, searchTerm) || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    السابق
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, pagination.pages) },
                      (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={
                              pageNum === pagination.page
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                  >
                    التالي
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
