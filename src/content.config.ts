import { defineCollection } from 'astro:content';
import {
  actorFrontmatterAstroSchema,
  eventFrontmatterAstroSchema,
  pageFrontmatterAstroSchema,
  placeFrontmatterAstroSchema
} from './lib/data/schemas';

const events = defineCollection({
  type: 'content',
  schema: eventFrontmatterAstroSchema
});

const actors = defineCollection({
  type: 'content',
  schema: actorFrontmatterAstroSchema
});

const places = defineCollection({
  type: 'content',
  schema: placeFrontmatterAstroSchema
});

const pages = defineCollection({
  type: 'content',
  schema: pageFrontmatterAstroSchema
});

export const collections = {
  events,
  actors,
  places,
  pages
};
