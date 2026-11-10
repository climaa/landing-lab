// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import {
  AUDIT_HOOK,
  AXE_TAGS,
  auditWindow,
  measureDocument,
  measureHtmlBytes,
  publishAudit,
  runAxe,
} from '@/lib/metrics';

const documentOf = (body: string) =>
  new DOMParser().parseFromString(
    `<!doctype html><html><head></head><body>${body}</body></html>`,
    'text/html',
  );

describe('measureDocument', () => {
  it('counts images, images without alt and elements', () => {
    // Arrange — html, head and body are three elements of their own.
    const doc = documentOf(
      '<main><img src="a.png"><img src="b.png" alt=""><img src="c.png" alt="C"></main>',
    );

    // Act
    const metrics = measureDocument(doc);

    // Assert — alt="" is a decorative image, not a missing alt.
    expect(metrics).toEqual({ images: 3, imagesWithoutAlt: 1, domNodes: 7 });
  });

  it('counts a nested ignored region once', () => {
    // Arrange
    const doc = documentOf(
      '<div data-metrics-ignore><section data-metrics-ignore><img src="x.png"></section></div><p>x</p>',
    );

    // Act
    const metrics = measureDocument(doc);

    // Assert — html, head, body, p.
    expect(metrics).toEqual({ images: 0, imagesWithoutAlt: 0, domNodes: 4 });
  });

  it('leaves out whatever is marked as the metrics strip itself', () => {
    // Arrange
    const doc = documentOf(
      '<div data-metrics-ignore><img src="x.png"><span>1</span></div><main><img src="a.png"></main>',
    );

    // Act
    const metrics = measureDocument(doc);

    // Assert — the strip measures the page, not itself: html, head, body, main, img.
    expect(metrics).toEqual({ images: 1, imagesWithoutAlt: 1, domNodes: 5 });
  });
});

describe('measureHtmlBytes', () => {
  it('counts bytes of the document, not characters', async () => {
    // Arrange — "é" is one character and two bytes in UTF-8.
    const fetchImpl = vi.fn(async () => new Response('<p>é</p>'));

    // Act
    const bytes = await measureHtmlBytes('/before', fetchImpl);

    // Assert
    expect(bytes).toBe(9);
    expect(fetchImpl).toHaveBeenCalledWith('/before', { cache: 'no-store' });
  });

  it('refuses an answer that is not 200 rather than measuring an error page', async () => {
    // Arrange
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 404 }));

    // Act + Assert
    await expect(measureHtmlBytes('/missing', fetchImpl)).rejects.toThrow(/404/);
  });
});

describe('runAxe', () => {
  it('runs axe on the document, with the four WCAG tags, and reports its version', async () => {
    // Arrange
    const run = vi.fn(async () => ({
      violations: [{ nodes: [{}, {}] }, { nodes: [{}] }],
      testEngine: { version: '4.14.0' },
    }));
    const doc = {} as Document;

    // Act
    const result = await runAxe({ run }, doc);

    // Assert
    expect(run).toHaveBeenCalledWith(doc, { runOnly: { type: 'tag', values: AXE_TAGS } });
    expect(result).toEqual({
      violations: 2,
      nodes: 3,
      axeVersion: '4.14.0',
      tags: AXE_TAGS,
    });
  });
});

describe('auditWindow', () => {
  it('asks an embedded page for its own audit, since axe audits its own window', async () => {
    // Arrange
    const result = { violations: 1, nodes: 5, axeVersion: '4.14.0', tags: AXE_TAGS };
    const frame = { [AUDIT_HOOK]: vi.fn(async () => result) } as unknown as Window;

    // Act
    const audited = await auditWindow(frame, {} as Window);

    // Assert
    expect(audited).toBe(result);
  });

  it('fails plainly when the embedded page published no audit', async () => {
    // Arrange
    const frame = {} as Window;

    // Act + Assert
    await expect(auditWindow(frame, {} as Window)).rejects.toThrow(/publishes no audit/);
  });

  it('withdraws a published audit when asked', () => {
    // Arrange
    const win = { document: {} } as unknown as Window;

    // Act
    const withdraw = publishAudit(win);
    const published = AUDIT_HOOK in win;
    withdraw();

    // Assert
    expect(published).toBe(true);
    expect(AUDIT_HOOK in win).toBe(false);
  });
});
