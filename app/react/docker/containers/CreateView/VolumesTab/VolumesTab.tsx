import { useMemo } from 'react';

import { useIsEnvironmentAdmin } from '@/react/hooks/useUser';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';

import { InputList } from '@@/form-components/InputList';
import { ArrayError } from '@@/form-components/InputList/InputList';

import { Values, Volume } from './types';
import { InputContext } from './context';
import { Item } from './Item';

export function VolumesTab({
  onChange,
  values,
  errors,
  allowAuto = false,
}: {
  onChange: (values: Values) => void;
  values: Values;
  errors?: ArrayError<Values>;
  allowAuto?: boolean;
}) {
  const isEnvironmentAdmin = useIsEnvironmentAdmin();
  const envQuery = useCurrentEnvironment();

  const allowBindMounts = !!(
    isEnvironmentAdmin ||
    envQuery.data?.SecuritySettings.allowBindMountsForRegularUsers
  );

  const inputContext = useMemo(
    () => ({ allowBindMounts, allowAuto }),
    [allowAuto, allowBindMounts]
  );

  return (
    <InputContext.Provider value={inputContext}>
      <InputList<Volume>
        errors={Array.isArray(errors) ? errors : []}
        label="Volume mapping"
        onChange={(volumes) => handleChange(volumes)}
        value={values}
        addLabel="map additional volume"
        item={Item}
        itemBuilder={() => ({
          containerPath: '',
          type: 'volume',
          name: '',
          readOnly: false,
        })}
      />
    </InputContext.Provider>
  );

  function handleChange(newValues: Values) {
    onChange(newValues);
  }
}
