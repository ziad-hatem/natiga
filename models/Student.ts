import mongoose from "mongoose";

export interface IStudent {
  _id?: string;
  seating_no: string;
  arabic_name: string;
  total_degree: number;
}

const studentSchema = new mongoose.Schema({
  seating_no: String,
  arabic_name: String,
  total_degree: Number,
});

export default mongoose.models.Student ||
  mongoose.model<IStudent>("Student", studentSchema);
