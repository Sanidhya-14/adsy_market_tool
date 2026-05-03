import { Schema, model, models } from 'mongoose';

const NewsArticleSchema = new Schema({
  urlHash: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  source: { type: String, required: true },
  sourceCountry: { type: String, default: null },
  publishedAt: { type: Date, required: true },
  ingestedAt: { type: Date, required: true },
  commodityIds: [{ type: String }],
  isGeographicallyRelevant: { type: Boolean, required: true },
});

NewsArticleSchema.index({ commodityIds: 1 });
NewsArticleSchema.index({ publishedAt: -1 });

export const NewsArticle = models.NewsArticle || model('NewsArticle', NewsArticleSchema);
