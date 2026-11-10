// The app's own rules; Storybook's preview already carries the design system's.
import '../lab.css';
import { CategoryScreen } from '@/components/CategoryScreen';
import { CATEGORY } from '@/data/garden-designers';

/**
 * The before page: five star images per rating and an avatar image each, none
 * with alt. It claims its route, as every page must, but it is not baselined:
 * it is the antipattern on purpose, the page /after is measured against, and a
 * regression on it would be a change to a page that is meant to stay broken.
 * The one screen kept out of the corpus; the reason is its tag's reason.
 */
const meta = {
  title: 'Screens/Web/Before',
  component: CategoryScreen,
  tags: ['visual-diff:skip'],
  parameters: { screen: { routes: ['/before'] } },
};

export default meta;

export const Default = {
  render: () => <CategoryScreen category={CATEGORY} variant="before" path="/before" />,
};
