import { describe, it, expect } from 'vitest';
import { ASPECT_RATIOS, OUTPUT_ASPECT_RATIOS, type AspectRatio, type OutputAspectRatio } from '../aspect-ratios';

describe('Aspect Ratios Data', () => {
  describe('ASPECT_RATIOS', () => {
    it('should exist and be an array', () => {
      expect(Array.isArray(ASPECT_RATIOS)).toBe(true);
    });

    it('should have multiple aspect ratio options', () => {
      expect(ASPECT_RATIOS.length).toBeGreaterThan(0);
    });

    it('should have at least 8 aspect ratios', () => {
      expect(ASPECT_RATIOS.length).toBeGreaterThanOrEqual(8);
    });

    it('should have unique IDs', () => {
      const ids = ASPECT_RATIOS.map(ar => ar.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ASPECT_RATIOS.length);
    });

    it('should have unique names', () => {
      const names = ASPECT_RATIOS.map(ar => ar.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(ASPECT_RATIOS.length);
    });

    it('should have Free option first', () => {
      expect(ASPECT_RATIOS[0].id).toBe('free');
      expect(ASPECT_RATIOS[0].ratio).toBeNull();
    });
  });

  describe('AspectRatio Structure', () => {
    it('should have all required properties', () => {
      ASPECT_RATIOS.forEach(aspectRatio => {
        expect(aspectRatio).toHaveProperty('id');
        expect(aspectRatio).toHaveProperty('name');
        expect(aspectRatio).toHaveProperty('ratio');
      });
    });

    it('should have valid ID format', () => {
      ASPECT_RATIOS.forEach(aspectRatio => {
        expect(typeof aspectRatio.id).toBe('string');
        expect(aspectRatio.id.length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty names', () => {
      ASPECT_RATIOS.forEach(aspectRatio => {
        expect(aspectRatio.name.length).toBeGreaterThan(0);
      });
    });

    it('should have valid ratio values', () => {
      ASPECT_RATIOS.forEach(aspectRatio => {
        if (aspectRatio.ratio !== null) {
          expect(typeof aspectRatio.ratio).toBe('number');
          expect(aspectRatio.ratio).toBeGreaterThan(0);
        }
      });
    });

    it('should match AspectRatio interface', () => {
      ASPECT_RATIOS.forEach(aspectRatio => {
        const ar: AspectRatio = aspectRatio;
        expect(ar.id).toBeDefined();
        expect(ar.name).toBeDefined();
        expect(ar.ratio).toBeDefined();
      });
    });
  });

  describe('Specific Aspect Ratios', () => {
    it('should have Free (freeform) option', () => {
      const free = ASPECT_RATIOS.find(ar => ar.id === 'free');
      expect(free).toBeDefined();
      expect(free?.ratio).toBeNull();
      expect(free?.name).toBe('Free');
    });

    it('should have 1:1 Square ratio', () => {
      const square = ASPECT_RATIOS.find(ar => ar.id === '1:1');
      expect(square).toBeDefined();
      expect(square?.ratio).toBe(1);
      expect(square?.name).toMatch(/Square|1:1/i);
    });

    it('should have 4:3 ratio', () => {
      const ratio4_3 = ASPECT_RATIOS.find(ar => ar.id === '4:3');
      expect(ratio4_3).toBeDefined();
      expect(ratio4_3?.ratio).toBe(4 / 3);
      expect(ratio4_3?.name).toMatch(/4:3/);
    });

    it('should have 3:2 ratio', () => {
      const ratio3_2 = ASPECT_RATIOS.find(ar => ar.id === '3:2');
      expect(ratio3_2).toBeDefined();
      expect(ratio3_2?.ratio).toBe(3 / 2);
      expect(ratio3_2?.name).toMatch(/3:2/);
    });

    it('should have 16:9 Widescreen ratio', () => {
      const widescreen = ASPECT_RATIOS.find(ar => ar.id === '16:9');
      expect(widescreen).toBeDefined();
      expect(widescreen?.ratio).toBe(16 / 9);
      expect(widescreen?.name).toMatch(/16:9|Widescreen/i);
    });

    it('should have 21:9 Ultrawide ratio', () => {
      const ultrawide = ASPECT_RATIOS.find(ar => ar.id === '21:9');
      expect(ultrawide).toBeDefined();
      expect(ultrawide?.ratio).toBe(21 / 9);
      expect(ultrawide?.name).toMatch(/21:9|Ultrawide/i);
    });

    it('should have 9:16 Portrait ratio', () => {
      const portrait = ASPECT_RATIOS.find(ar => ar.id === '9:16');
      expect(portrait).toBeDefined();
      expect(portrait?.ratio).toBe(9 / 16);
      expect(portrait?.name).toMatch(/9:16|Portrait/i);
    });

    it('should have 3:4 Portrait ratio', () => {
      const portrait3_4 = ASPECT_RATIOS.find(ar => ar.id === '3:4');
      expect(portrait3_4).toBeDefined();
      expect(portrait3_4?.ratio).toBe(3 / 4);
      expect(portrait3_4?.name).toMatch(/3:4|Portrait/i);
    });
  });

  describe('Common Aspect Ratio Values', () => {
    it('1:1 should equal 1', () => {
      const square = ASPECT_RATIOS.find(ar => ar.id === '1:1');
      expect(square?.ratio).toBe(1);
    });

    it('4:3 should equal approximately 1.333', () => {
      const ratio4_3 = ASPECT_RATIOS.find(ar => ar.id === '4:3');
      expect(ratio4_3?.ratio).toBeCloseTo(4 / 3, 5);
    });

    it('3:2 should equal 1.5', () => {
      const ratio3_2 = ASPECT_RATIOS.find(ar => ar.id === '3:2');
      expect(ratio3_2?.ratio).toBeCloseTo(3 / 2, 5);
    });

    it('16:9 should equal approximately 1.777', () => {
      const ratio16_9 = ASPECT_RATIOS.find(ar => ar.id === '16:9');
      expect(ratio16_9?.ratio).toBeCloseTo(16 / 9, 5);
    });

    it('21:9 should equal approximately 2.333', () => {
      const ratio21_9 = ASPECT_RATIOS.find(ar => ar.id === '21:9');
      expect(ratio21_9?.ratio).toBeCloseTo(21 / 9, 5);
    });

    it('9:16 should equal approximately 0.5625', () => {
      const ratio9_16 = ASPECT_RATIOS.find(ar => ar.id === '9:16');
      expect(ratio9_16?.ratio).toBeCloseTo(9 / 16, 5);
    });

    it('3:4 should equal 0.75', () => {
      const ratio3_4 = ASPECT_RATIOS.find(ar => ar.id === '3:4');
      expect(ratio3_4?.ratio).toBeCloseTo(3 / 4, 5);
    });
  });

  describe('Aspect Ratio Categories', () => {
    it('should have landscape ratios', () => {
      const landscape = ASPECT_RATIOS.filter(ar => ar.ratio && ar.ratio > 1);
      expect(landscape.length).toBeGreaterThan(0);
      landscape.forEach(ar => {
        expect(ar.ratio).toBeGreaterThan(1);
      });
    });

    it('should have portrait ratios', () => {
      const portrait = ASPECT_RATIOS.filter(ar => ar.ratio && ar.ratio < 1);
      expect(portrait.length).toBeGreaterThan(0);
      portrait.forEach(ar => {
        expect(ar.ratio).toBeLessThan(1);
      });
    });

    it('should have square ratio', () => {
      const square = ASPECT_RATIOS.find(ar => ar.ratio === 1);
      expect(square).toBeDefined();
    });

    it('should have freeform option', () => {
      const freeform = ASPECT_RATIOS.find(ar => ar.ratio === null);
      expect(freeform).toBeDefined();
    });
  });

  describe('Ratio Calculations', () => {
    it('all landscape ratios should be > 1', () => {
      const landscapeRatios = [
        4 / 3,
        3 / 2,
        16 / 9,
        21 / 9,
      ];

      landscapeRatios.forEach(expected => {
        expect(expected).toBeGreaterThan(1);
      });
    });

    it('all portrait ratios should be < 1', () => {
      const portraitRatios = [
        9 / 16,
        3 / 4,
      ];

      portraitRatios.forEach(expected => {
        expect(expected).toBeLessThan(1);
      });
    });

    it('should support common calculation patterns', () => {
      // Test that ratios are correctly calculated for use
      const widescreen = ASPECT_RATIOS.find(ar => ar.id === '16:9');
      if (widescreen?.ratio) {
        // If width is 1920, height should be 1080
        const height = 1920 / widescreen.ratio;
        expect(height).toBeCloseTo(1080, 0);
      }
    });
  });

  describe('Missing or Unexpected Ratios', () => {
    it('should not have duplicate ratio values', () => {
      const ratios = ASPECT_RATIOS
        .filter(ar => ar.ratio !== null)
        .map(ar => ar.ratio);
      const uniqueRatios = new Set(ratios);
      expect(uniqueRatios.size).toBe(ratios.length);
    });

    it('should only have one freeform ratio', () => {
      const freeform = ASPECT_RATIOS.filter(ar => ar.ratio === null);
      expect(freeform.length).toBe(1);
    });
  });

  describe('Interface Compliance', () => {
    it('all items should match AspectRatio interface', () => {
      ASPECT_RATIOS.forEach(item => {
        const aspectRatio: AspectRatio = {
          id: item.id,
          name: item.name,
          ratio: item.ratio,
        };
        expect(aspectRatio.id).toBe(item.id);
        expect(aspectRatio.name).toBe(item.name);
        expect(aspectRatio.ratio).toBe(item.ratio);
      });
    });
  });
});

describe('Output Aspect Ratios Data', () => {
  describe('OUTPUT_ASPECT_RATIOS', () => {
    it('should exist and be an array', () => {
      expect(Array.isArray(OUTPUT_ASPECT_RATIOS)).toBe(true);
    });

    it('should have multiple output aspect ratio options', () => {
      expect(OUTPUT_ASPECT_RATIOS.length).toBeGreaterThan(0);
    });

    it('should have at least 8 aspect ratios', () => {
      expect(OUTPUT_ASPECT_RATIOS.length).toBeGreaterThanOrEqual(8);
    });

    it('should have unique IDs', () => {
      const ids = OUTPUT_ASPECT_RATIOS.map(ar => ar.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(OUTPUT_ASPECT_RATIOS.length);
    });

    it('should have Auto option first', () => {
      expect(OUTPUT_ASPECT_RATIOS[0].id).toBe('auto');
      expect(OUTPUT_ASPECT_RATIOS[0].ratio).toBeNull();
    });
  });

  describe('OutputAspectRatio Structure', () => {
    it('should have all required properties', () => {
      OUTPUT_ASPECT_RATIOS.forEach(aspectRatio => {
        expect(aspectRatio).toHaveProperty('id');
        expect(aspectRatio).toHaveProperty('name');
        expect(aspectRatio).toHaveProperty('ratio');
      });
    });

    it('should have valid ratio values', () => {
      OUTPUT_ASPECT_RATIOS.forEach(aspectRatio => {
        if (aspectRatio.ratio !== null) {
          expect(typeof aspectRatio.ratio).toBe('number');
          expect(aspectRatio.ratio).toBeGreaterThan(0);
        }
      });
    });

    it('should match OutputAspectRatio interface', () => {
      OUTPUT_ASPECT_RATIOS.forEach(aspectRatio => {
        const ar: OutputAspectRatio = aspectRatio;
        expect(ar.id).toBeDefined();
        expect(ar.name).toBeDefined();
      });
    });
  });

  describe('Social Media Aspect Ratios', () => {
    it('should have Auto (match screenshot) option', () => {
      const auto = OUTPUT_ASPECT_RATIOS.find(ar => ar.id === 'auto');
      expect(auto).toBeDefined();
      expect(auto?.ratio).toBeNull();
    });

    it('should have 1:1 Square ratio', () => {
      const square = OUTPUT_ASPECT_RATIOS.find(ar => ar.id === '1:1');
      expect(square).toBeDefined();
      expect(square?.ratio).toBe(1);
    });

    it('should have 4:5 Instagram ratio', () => {
      const instagram = OUTPUT_ASPECT_RATIOS.find(ar => ar.id === '4:5');
      expect(instagram).toBeDefined();
      expect(instagram?.ratio).toBeCloseTo(4 / 5, 5);
    });

    it('should have 9:16 Stories ratio', () => {
      const stories = OUTPUT_ASPECT_RATIOS.find(ar => ar.id === '9:16');
      expect(stories).toBeDefined();
      expect(stories?.ratio).toBeCloseTo(9 / 16, 5);
    });

    it('should have 16:9 YouTube ratio', () => {
      const youtube = OUTPUT_ASPECT_RATIOS.find(ar => ar.id === '16:9');
      expect(youtube).toBeDefined();
      expect(youtube?.ratio).toBeCloseTo(16 / 9, 5);
    });

    it('should have 2:1 Twitter ratio', () => {
      const twitter = OUTPUT_ASPECT_RATIOS.find(ar => ar.id === '2:1');
      expect(twitter).toBeDefined();
      expect(twitter?.ratio).toBe(2);
    });

    it('should have 1.91:1 Facebook ratio', () => {
      const facebook = OUTPUT_ASPECT_RATIOS.find(ar => ar.id === '1.91:1');
      expect(facebook).toBeDefined();
      expect(facebook?.ratio).toBeCloseTo(1.91, 5);
    });

    it('should have 3:4 Pinterest ratio', () => {
      const pinterest = OUTPUT_ASPECT_RATIOS.find(ar => ar.id === '3:4');
      expect(pinterest).toBeDefined();
      expect(pinterest?.ratio).toBeCloseTo(3 / 4, 5);
    });
  });
});
