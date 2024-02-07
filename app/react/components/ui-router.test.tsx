import { UISref, UIView } from '@uirouter/react';

import { withTestRouter } from '@/react/test-utils/withRouter';
import { render, screen } from '@/react-tools/test-utils';

function RelativePathLink() {
  return (
    <UISref to=".custom" options={{}}>
      <span>Link</span>
    </UISref>
  );
}

test.todo('should render a link with relative path', () => {
  const WrappedComponent = withTestRouter(RelativePathLink, {
    stateConfig: [
      {
        name: 'parent',
        url: '/',

        component: () => (
          <>
            <div>parent</div>
            <UIView />
          </>
        ),
      },
      {
        name: 'parent.custom',
        url: 'custom',
      },
    ],
    route: 'parent.custom',
  });

  render(<WrappedComponent />);

  expect(screen.getByText('Link')).toBeInTheDocument();
});
