// The app's own rules; Storybook's preview already carries the design system's.
import '../lab.css';
import { CompareScreen } from '@/components/CompareScreen';
import type { StripState } from '@/hooks/useDocumentMetrics';

/**
 * The compare page, with sample numbers and the two live pages drawn as the
 * design board draws them, labelled boxes. The page measures its iframes live;
 * a screenshot needs numbers and frames that hold still, and a live /before
 * inside it would bring its 660 unlabelled images into this screen's audit.
 */
const meta = {
  title: 'Screens/Web/Compare',
  component: CompareScreen,
  parameters: { screen: { routes: ['/compare'] } },
};

export default meta;

/** As measured on `next start` (2026-11-10): the numbers the page shows live. */
const BEFORE: StripState = {
  status: 'measured',
  dom: { images: 660, imagesWithoutAlt: 660, domNodes: 1529 },
  htmlBytes: 224_768,
  axe: {
    status: 'done',
    result: { violations: 1, nodes: 660, axeVersion: '4.14.0', tags: [] },
  },
};

const AFTER: StripState = {
  status: 'measured',
  dom: { images: 0, imagesWithoutAlt: 0, domNodes: 973 },
  htmlBytes: 164_045,
  axe: {
    status: 'done',
    result: { violations: 0, nodes: 0, axeVersion: '4.14.0', tags: [] },
  },
};

export const Default = {
  render: () => (
    <CompareScreen
      before={{
        label: 'Before',
        src: '/before',
        placeholder: true,
        title: 'Before: one image per star',
        state: BEFORE,
      }}
      after={{
        label: 'After',
        src: '/after',
        placeholder: true,
        title: 'After: one image per rating',
        state: AFTER,
      }}
    />
  ),
};
