import { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

export interface MermaidProps {
  /** The diagram source, in Mermaid's own syntax. */
  chart: string;
}

/**
 * Mermaid's theme variables, read from the design tokens on `<html>`.
 *
 * Mermaid paints with literal colours inside the SVG it returns, so a CSS
 * custom property cannot reach it after the fact; the token's resolved value
 * is read here instead and handed over at render time. That keeps diagrams on
 * the same two palettes as everything else, and follows the toolbar's theme:
 * a fixed `neutral` theme drew dark lines and labels on the dark docs page,
 * where they disappeared.
 */
export function tokenThemeVariables(root: HTMLElement = document.documentElement) {
  const style = getComputedStyle(root);
  const token = (name: string) => style.getPropertyValue(name).trim();
  const [bg, subtle, muted, border, text, textMuted, accent] = [
    '--color-bg',
    '--color-bg-subtle',
    '--color-bg-muted',
    '--color-border-strong',
    '--color-text',
    '--color-text-muted',
    '--color-accent',
  ].map(token);

  return {
    darkMode: root.dataset.theme === 'dark',
    background: bg,
    primaryColor: subtle,
    primaryTextColor: text,
    primaryBorderColor: border,
    secondaryColor: muted,
    tertiaryColor: bg,
    mainBkg: subtle,
    nodeBorder: border,
    clusterBkg: bg,
    clusterBorder: border,
    textColor: text,
    titleColor: text,
    lineColor: textMuted,
    edgeLabelBackground: bg,
    actorBkg: subtle,
    actorBorder: border,
    actorTextColor: text,
    actorLineColor: textMuted,
    signalColor: text,
    signalTextColor: text,
    labelBoxBkgColor: subtle,
    labelBoxBorderColor: border,
    labelTextColor: text,
    loopTextColor: text,
    noteBkgColor: muted,
    noteBorderColor: accent,
    noteTextColor: text,
    activationBkgColor: muted,
    activationBorderColor: border,
  };
}

/** The `data-theme` on `<html>` the docs container writes; `light` when unset. */
const currentTheme = () => document.documentElement.dataset.theme ?? 'light';

/** Re-renders whenever the toolbar flips `data-theme` on `<html>`. */
function useDocumentTheme() {
  const [theme, setTheme] = useState(currentTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(currentTheme()));
    observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
  }, []);

  return theme;
}

/**
 * Renders a Mermaid diagram to inline SVG at doc-render time.
 *
 * Storybook's MDX pipeline has no build-time Mermaid support — a fenced
 * ```mermaid block renders as a plain code sample, not a diagram. This is the
 * doc-time equivalent: `mermaid.render()` produces the SVG string once the
 * component mounts, and the id has to be unique per instance or two diagrams
 * on the same page collide in mermaid's own internal registry. The theme is
 * part of the id, so a re-render after a theme flip never reuses the old one.
 */
export function Mermaid({ chart }: MermaidProps) {
  const reactId = useId().replace(/:/g, '');
  const theme = useDocumentTheme();
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      themeVariables: tokenThemeVariables(),
    });
    mermaid.render(`mermaid-${reactId}-${theme}`, chart).then(({ svg: rendered }) => {
      if (!cancelled) setSvg(rendered);
    });

    return () => {
      cancelled = true;
    };
  }, [chart, reactId, theme]);

  if (!svg) return null;

  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}
