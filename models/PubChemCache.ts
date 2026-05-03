import { Schema, model, models } from 'mongoose';
import type { PubChemIdentity } from '@/lib/pubchem';

const PubChemCacheSchema = new Schema({
  commodityId: { type: String, required: true, unique: true },
  cid: { type: Number, required: true },
  identity: { type: Schema.Types.Mixed, required: true },
  fetchedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});

PubChemCacheSchema.index({ cid: 1 });

export interface IPubChemCache {
  commodityId: string;
  cid: number;
  identity: PubChemIdentity;
  fetchedAt: Date;
  expiresAt: Date;
}

export const PubChemCache = models.PubChemCache || model<IPubChemCache>('PubChemCache', PubChemCacheSchema);
