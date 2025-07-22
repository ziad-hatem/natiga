import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import dbConnect from "@/lib/mongodb"
import StudentResult from "@/models/StudentResult"
import { normalizeArabicText } from "@/lib/arabic-normalizer"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json({ error: "Please upload an Excel file (.xlsx or .xls)" }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size too large. Maximum 10MB allowed." }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (jsonData.length < 2) {
      return NextResponse.json(
        { error: "Excel file must contain at least a header row and one data row" },
        { status: 400 },
      )
    }

    // Get headers (first row)
    const headers = jsonData[0] as string[]
    const dataRows = jsonData.slice(1) as any[][]

    // Connect to database
    await dbConnect()

    // Process and save data
    const studentsData = []

    for (const row of dataRows) {
      if (row.length === 0 || !row[0]) continue // Skip empty rows

      const studentData: any = {}

      // Map headers to data
      headers.forEach((header, index) => {
        if (row[index] !== undefined && row[index] !== null && row[index] !== "") {
          studentData[header] = row[index]
        }
      })

      // Extract common fields (adjust based on your Excel structure)
      const studentName = studentData["اسم الطالب"] || studentData["الاسم"] || studentData["Student Name"] || row[0]
      const studentId = studentData["رقم الطالب"] || studentData["الرقم"] || studentData["Student ID"] || row[1]
      const subject = studentData["المادة"] || studentData["Subject"] || row[2]
      const grade = studentData["الدرجة"] || studentData["Grade"] || row[3]
      const semester = studentData["الفصل"] || studentData["Semester"] || row[4]
      const year = studentData["السنة"] || studentData["Year"] || row[5]

      if (studentName) {
        studentsData.push({
          studentName: String(studentName).trim(),
          studentNameNormalized: normalizeArabicText(String(studentName)),
          studentId: studentId ? String(studentId).trim() : undefined,
          subject: subject ? String(subject).trim() : undefined,
          subjectNormalized: subject ? normalizeArabicText(String(subject)) : undefined,
          grade: grade ? Number(grade) : undefined,
          semester: semester ? String(semester).trim() : undefined,
          year: year ? String(year).trim() : undefined,
        })
      }
    }

    if (studentsData.length === 0) {
      return NextResponse.json({ error: "No valid student data found in the Excel file" }, { status: 400 })
    }

    // Save to database
    const result = await StudentResult.insertMany(studentsData)

    return NextResponse.json({
      message: `Successfully uploaded ${result.length} student records`,
      count: result.length,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to process file. Please check the file format and try again.",
      },
      { status: 500 },
    )
  }
}
