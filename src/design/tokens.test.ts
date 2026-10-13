import { touchTarget, typeScale } from '@/design/tokens';

describe('design tokens', () => {
  it('keeps body text readable and touch targets large enough for a phone', () => {
    expect(typeScale.body.fontSize).toBeGreaterThanOrEqual(16);
    expect(typeScale.caption.fontSize).toBeGreaterThanOrEqual(14);
    expect(typeScale.body.lineHeight).toBeGreaterThan(typeScale.body.fontSize);
    expect(typeScale.title.fontSize).toBeGreaterThanOrEqual(typeScale.section.fontSize);
    expect(touchTarget).toBeGreaterThanOrEqual(48);
  });
});
