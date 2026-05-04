import { Schema, model, models } from 'mongoose';

const AIBriefSchema = new Schema({
  commodityId:           { type: String,  required: true },
  date:                  { type: String,  required: true },
  industryMode:          { type: String,  required: true },
  generatedAt:           { type: Date,    required: true },
  modelUsed:             { type: String,  required: true },
  marketSnapshot:        { type: String,  default: null },
  priceVerdict:          { type: String,  default: null },
  priceVerdictRationale: { type: String,  default: null },
  keyDrivers:            [{ type: String }],
  procurementDirective:  { type: String,  default: null },
  geographicContext:     { type: String,  default: null },
  industryLens:          { type: String,  default: null },
  riskFlags:             [{ type: String }],
  confidenceScore:       { type: Number,  default: null },
  sources:               [{ type: String }],
  isFallback:            { type: Boolean, required: true, default: false },
  fallbackReason:        { type: String,  default: null },
});

AIBriefSchema.index({ commodityId: 1, date: 1, industryMode: 1 }, { unique: true });

export const AIBrief = models.AIBrief || model('AIBrief', AIBriefSchema);
