import { z } from 'zod';

export const VenueLayoutEnum = z.enum(['banquet', 'cocktail', 'theater', 'gala']);
export type VenueLayout = z.infer<typeof VenueLayoutEnum>;

export const LightingPresetEnum = z.enum([
  'romantic_violet',
  'cyber_cyan',
  'golden_warmth',
  'midnight_elegance'
]);
export type LightingPreset = z.infer<typeof LightingPresetEnum>;

export const VenueStudioConfigSchema = z.object({
  layout: VenueLayoutEnum.default('banquet'),
  lighting: LightingPresetEnum.default('romantic_violet'),
  tableCount: z.number().int().min(2).max(24).default(8),
  stageSize: z.enum(['small', 'medium', 'large']).default('medium'),
  hasDanceFloor: z.boolean().default(true),
  hasPhotoBooth: z.boolean().default(true),
  themeColor: z.string().default('#8B5CF6'),
  accentColor: z.string().default('#06B6D4'),
  ambientLightIntensity: z.number().min(0.1).max(2.0).default(0.8),
  spotlightIntensity: z.number().min(0).max(3.0).default(1.5),
});

export type VenueStudioConfig = z.infer<typeof VenueStudioConfigSchema>;
