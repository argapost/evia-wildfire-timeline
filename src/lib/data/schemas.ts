import { z } from 'zod';

export const categoryValues = [
  'wildfire',
  'fire-season',
  'suppression',
  'evacuation',
  'weather',
  'flood',
  'forestry-policy',
  'legislation',
  'spatial-planning',
  'reconstruction-governance',
  'contract',
  'donation',
  'municipal-action',
  'state-agency-action',
  'civil-society-action',
  'protest',
  'election',
  'private-actor',
  'study-report',
  'infrastructure',
  'major-political-event',
  'forestry-works'
] as const;

export const actorTypeValues = [
  'person',
  'state-agency',
  'ministry',
  'municipality',
  'regional-authority',
  'civil-society-organization',
  'ngo',
  'company',
  'committee',
  'consultant',
  'donor',
  'collective'
] as const;

export const placeTypeValues = [
  'region',
  'municipality',
  'settlement',
  'island',
  'forest-area',
  'administrative-unit',
  'country'
] as const;

export const datePrecisionValues = ['year', 'month', 'day', 'approximate'] as const;
export const confidenceValues = ['low', 'medium', 'high'] as const;
export const verificationStatusValues = ['unverified', 'partially-verified', 'verified', 'disputed'] as const;

export const categorySchema = z.enum(categoryValues);
export const datePrecisionSchema = z.enum(datePrecisionValues);
export const confidenceSchema = z.enum(confidenceValues);
export const verificationStatusSchema = z.enum(verificationStatusValues);

export const isoLikeDateSchema = z
  .string()
  .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'Dates must be YYYY, YYYY-MM, or YYYY-MM-DD.');

const coordinateSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90)
]);

const lineStringCoordinatesSchema = z.array(coordinateSchema).min(2);

const polygonRingSchema = z
  .array(coordinateSchema)
  .min(4)
  .refine(
    (ring) => {
      const first = ring[0];
      const last = ring[ring.length - 1];
      return first[0] === last[0] && first[1] === last[1];
    },
    { message: 'Polygon rings must be closed (first and last coordinates must match).' }
  );

export const geometrySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('Point'),
    coordinates: coordinateSchema
  }),
  z.object({
    type: z.literal('LineString'),
    coordinates: lineStringCoordinatesSchema
  }),
  z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(polygonRingSchema).min(1)
  }),
  z.object({
    type: z.literal('MultiPolygon'),
    coordinates: z.array(z.array(polygonRingSchema).min(1)).min(1)
  })
]);

export const mapViewportSchema = z.object({
  center: coordinateSchema,
  zoom: z.number().min(0).max(22)
});

const sourceReferenceIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'Reference ids must be lowercase slug-like values.');

const eventFrontmatterBaseSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  start: isoLikeDateSchema,
  end: isoLikeDateSchema.optional().nullable(),
  datePrecision: datePrecisionSchema,
  isOngoing: z.boolean().default(false),
  summary: z.string().min(1),
  category: categorySchema,
  actors: z.array(z.string().min(1)).min(1),
  places: z.array(z.string().min(1)).min(1),
  body: z.string().optional(),
  commentary: z.string().optional(),
  tags: z.array(z.string().min(1)).default([]),
  sourceRefs: z.array(sourceReferenceIdSchema).default([]),
  imageRefs: z.array(sourceReferenceIdSchema).default([]),
  coverImage: sourceReferenceIdSchema.optional().nullable(),
  geometry: geometrySchema.optional(),
  mapViewport: mapViewportSchema.optional(),
  confidence: confidenceSchema.optional().nullable().or(z.literal('')),
  verificationStatus: verificationStatusSchema.optional().nullable().or(z.literal('')),
  relatedEvents: z.array(z.string().min(1)).default([]),
  featured: z.boolean().default(false)
});

type EventConstraintTarget = {
  end?: string | null;
  isOngoing: boolean;
  datePrecision: z.infer<typeof datePrecisionSchema>;
};

const eventConstraints = (value: EventConstraintTarget, ctx: z.RefinementCtx) => {
  if (!value.end && !value.isOngoing && value.datePrecision === 'approximate') {
    return;
  }

  if (!value.end && value.isOngoing) {
    return;
  }

  if (value.end && value.isOngoing) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Events cannot define both end and isOngoing=true.',
      path: ['isOngoing']
    });
  }
};

export const eventFrontmatterSchema = eventFrontmatterBaseSchema.superRefine(eventConstraints);
export const eventFrontmatterAstroSchema = eventFrontmatterBaseSchema
  .omit({ slug: true })
  .extend({
    slug: z.string().optional().nullable()
  })
  .superRefine(eventConstraints);

export const actorFrontmatterSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(actorTypeValues),
  aliases: z.array(z.string().min(1)).default([]),
  parentActors: z.array(z.string().min(1)).default([]),
  summary: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  website: z.string().url().optional().nullable().or(z.literal(''))
});
export const actorFrontmatterAstroSchema = actorFrontmatterSchema.omit({ slug: true }).extend({
  slug: z.string().optional().nullable()
});

export const placeFrontmatterSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(placeTypeValues),
  center: coordinateSchema,
  bbox: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
    z.number().min(-180).max(180),
    z.number().min(-90).max(90)
  ]),
  geometry: geometrySchema.optional(),
  parentPlace: z.string().min(1).optional().nullable().or(z.literal('')),
  notes: z.string().optional()
});
export const placeFrontmatterAstroSchema = placeFrontmatterSchema.omit({ slug: true }).extend({
  slug: z.string().optional().nullable()
});

export const pageFrontmatterSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  updatedAt: z.string().datetime().optional()
});
export const pageFrontmatterAstroSchema = pageFrontmatterSchema.omit({ slug: true }).extend({
  slug: z.string().optional().nullable()
});

export const sourceReferenceSchema = z.object({
  id: sourceReferenceIdSchema,
  title: z.string().min(1),
  type: z.string().min(1),
  publisher: z.string().min(1),
  date: isoLikeDateSchema.optional(),
  url: z.string().url(),
  accessDate: isoLikeDateSchema,
  archiveUrl: z.string().url().optional().or(z.literal('')),
  language: z.string().min(2).max(12),
  notes: z.string().optional()
});

export const mediaReferenceSchema = z.object({
  id: sourceReferenceIdSchema,
  type: z.enum(['image', 'video', 'document']),
  file: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().min(1),
  credit: z.string().min(1),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  license: z.string().optional(),
  focalPoint: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]).optional()
});

export type EventFrontmatter = z.infer<typeof eventFrontmatterSchema>;
export type ActorFrontmatter = z.infer<typeof actorFrontmatterSchema>;
export type PlaceFrontmatter = z.infer<typeof placeFrontmatterSchema>;
export type PageFrontmatter = z.infer<typeof pageFrontmatterSchema>;
export type Geometry = z.infer<typeof geometrySchema>;
export type SourceReference = z.infer<typeof sourceReferenceSchema>;
export type MediaReference = z.infer<typeof mediaReferenceSchema>;
