import mongoose from "mongoose"

export interface IStudent {
  _id?: string
  seating_no: string
  arabic_name: string
  total_degree: number
  normalized_name: string
}

const studentSchema = new mongoose.Schema({
  seating_no: String,
  arabic_name: String,
  total_degree: Number,
  normalized_name: String, // لتسهيل البحث لاحقًا
})

export default mongoose.models.Student || mongoose.model<IStudent>("Student", studentSchema)
