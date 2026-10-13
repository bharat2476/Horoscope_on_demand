import { type ReactElement } from 'react';
import { render } from '@testing-library/react-native';

import { AppProvider } from '@/providers/app-provider';

export function renderWithApp(ui: ReactElement) {
  return render(<AppProvider>{ui}</AppProvider>);
}
