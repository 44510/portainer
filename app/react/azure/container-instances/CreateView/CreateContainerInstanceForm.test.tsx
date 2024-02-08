import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';

import { UserViewModel } from '@/portainer/models/user';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { CreateContainerInstanceForm } from './CreateContainerInstanceForm';

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 5 },
  })),
}));

test('submit button should be disabled when name or image is missing', async () => {
  const user = new UserViewModel({ Username: 'user' });
  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(CreateContainerInstanceForm), user)
  );
  const { findByText, getByText, getByLabelText } = render(<Wrapped />);

  await expect(findByText(/Azure settings/)).resolves.toBeVisible();

  const button = getByText(/Deploy the container/);
  expect(button).toBeVisible();
  expect(button).toBeDisabled();

  const nameInput = getByLabelText(/name/i);
  await userEvent.type(nameInput, 'name');

  const imageInput = getByLabelText(/image/i);
  await userEvent.type(imageInput, 'image');

  await expect(findByText(/Deploy the container/)).resolves.toBeEnabled();

  expect(nameInput).toHaveValue('name');
  await userEvent.clear(nameInput);

  await expect(findByText(/Deploy the container/)).resolves.toBeDisabled();
});
