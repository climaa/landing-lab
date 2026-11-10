// The app's own rules; Storybook's preview already carries the design system's.
import '../lab.css';
import { CategoryScreen } from '@/components/CategoryScreen';
import { CATEGORY } from '@/data/garden-designers';

/**
 * The fixed category page, as /after, its Irish alternate and its old address
 * draw it: one rating image per rating, initials instead of avatar images. The
 * three routes differ only in their head links, which a screenshot cannot see.
 * Baselined at both viewports, as a screen is.
 */
const meta = {
  title: 'Screens/Web/After',
  component: CategoryScreen,
  parameters: { screen: { routes: ['/after', '/ie/after', '/garden-designers'] } },
};

export default meta;

export const Default = {
  render: () => <CategoryScreen category={CATEGORY} variant="after" path="/after" />,
};
