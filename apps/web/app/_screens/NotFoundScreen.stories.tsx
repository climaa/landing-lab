// The app's own rules; Storybook's preview already carries the design system's.
import '../lab.css';
import NotFound from '../not-found';

/** Every address the app does not serve. A screen with no route of its own. */
const meta = {
  title: 'Screens/Web/NotFound',
  component: NotFound,
  parameters: { screen: { routes: [] } },
};

export default meta;

export const Default = {};
