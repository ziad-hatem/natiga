"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileUploadProps {
  onUploadSuccess: () => void
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setMessage(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: "error", text: "يرجى اختيار ملف Excel أولاً" })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: result.message })
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById("file-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""
        onUploadSuccess()
      } else {
        setMessage({ type: "error", text: result.error || "حدث خطأ أثناء رفع الملف" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى." })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          رفع ملف نتائج الطلاب
        </CardTitle>
        <CardDescription>اختر ملف Excel (.xlsx) يحتوي على بيانات نتائج الطلاب باللغة العربية</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">ملف Excel</Label>
          <Input id="file-upload" type="file" accept=".xlsx,.xls" onChange={handleFileChange} disabled={uploading} />
        </div>

        {file && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="w-4 h-4" />
            <span>{file.name}</span>
            <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
        )}

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              جاري الرفع...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              رفع الملف
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• يجب أن يحتوي الملف على عمود واحد على الأقل لأسماء الطلاب</p>
          <p>• الأعمدة المتوقعة: اسم الطالب، رقم الطالب، المادة، الدرجة، الفصل، السنة</p>
          <p>• الحد الأقصى لحجم الملف: 10 ميجابايت</p>
        </div>
      </CardContent>
    </Card>
  )
}
