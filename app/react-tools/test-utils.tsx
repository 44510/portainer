import 'vitest-dom/extend-expect';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

function customRender(ui: ReactElement, options?: RenderOptions) {
  return render(ui, options);
}

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
