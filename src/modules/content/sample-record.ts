import { type RitualDocument } from '@/modules/content/types';

/**
 * Unpublished sample for editors. It is not a real observance, contains no quotation,
 * and cannot be published while its reuse right is not-cleared.
 */
export const SAMPLE_RITUAL_DRAFT: RitualDocument = {
  kind: 'ritual',
  id: 'sample-home-lamp',
  title: { en: 'Sample home lamp observance' },
  category: 'home',
  language: 'en',
  observance: 'Replace this sentence with the observance an editor is actually documenting.',
  tradition: 'Sample tradition label',
  regionId: 'gj',
  materials: ['Replace with materials from the cited source.'],
  preparation: ['Replace with preparation from the cited source.'],
  steps: [{ order: 1, text: 'Replace this step with reviewer-approved instructions.' }],
  mantras: [],
  sources: [
    {
      id: 'sample-source',
      kind: 'regional-custom',
      title: 'Unpublished editorial placeholder',
      citation: 'No external quotation. Replace this with a documented source before review.',
      reuse: 'not-cleared',
      notes: 'This sample is not a real ritual and must not be published.',
    },
  ],
  review: {
    status: 'draft',
    createdBy: 'sample-editor',
    reviewerId: null,
    reviewDate: null,
    publishedAt: null,
    history: [
      {
        revision: 1,
        at: '2026-10-14T00:00:00Z',
        actorId: 'sample-editor',
        action: 'create',
        note: null,
      },
    ],
  },
};
