import mongoose from "mongoose"

export interface IStudentResult {
  _id?: string
  studentName: string
  studentNameNormalized: string
  studentId?: string
  subject?: string
  subjectNormalized?: string
  grade?: number
  semester?: string
  year?: string
  createdAt?: Date
  updatedAt?: Date
}

const StudentResultSchema = new mongoose.Schema<IStudentResult>(
  {
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentNameNormalized: {
      type: String,
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    subjectNormalized: {
      type: String,
      index: true,
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
    },
    semester: {
      type: String,
      trim: true,
    },
    year: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

// Create compound index for better search performance
StudentResultSchema.index({
  studentNameNormalized: "text",
  subjectNormalized: "text",
})

export default mongoose.models.StudentResult || mongoose.model<IStudentResult>("StudentResult", StudentResultSchema)
