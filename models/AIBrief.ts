import { Schema, model, models } from 'mongoose';

const AIBriefSchema = new Schema({
  commodityId: { type: String, required: true },
  date: { type: String, required: true },
  industryMode: { type: String, required: true },
  marketSnapshot: { type: String, required: true },
  priceVerdict: { type: String, required: true },
  priceVerdictRationale: { type: String, required: true },
  keyDrivers: [{ type: String }],
  procurementDirective: { type: String, required: true },
  geographicContext: { type: String, required: true },
  industryLens: {
    specialtyChem: { type: String },
    lifeSciences: { type: String },
    energy: { type: String },
  },
  riskFlags: [
    {
      type: { type: String, required: true },
      severity: { type: String, required: true },
      text: { type: String, required: true },
    },
  ],
  confidenceScore: { type: Number, required: true },
  sources: [{ type: String }],
  generatedAt: { type: Date, required: true },
});

AIBriefSchema.index({ commodityId: 1 });
AIBriefSchema.index({ date: 1 });
AIBriefSchema.index({ commodityId: 1, date: 1, industryMode: 1 });

export const AIBrief = models.AIBrief || model('AIBrief', AIBriefSchema);
