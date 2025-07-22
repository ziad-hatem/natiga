import mongoose, { Schema, Document } from "mongoose";

export interface ISearchQuery extends Document {
  term: string;
  createdAt: Date;
}

const SearchQuerySchema = new Schema<ISearchQuery>({
  term: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.SearchQuery ||
  mongoose.model<ISearchQuery>("SearchQuery", SearchQuerySchema);
