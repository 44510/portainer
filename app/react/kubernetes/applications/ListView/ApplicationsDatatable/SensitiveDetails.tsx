import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

import { Button, CopyButton } from '@@/buttons';

import styles from './SensitiveDetails.module.css';

export function SensitiveDetails({
  name,
  value,
}: {
  name: string;
  value: string;
}) {
  return (
    <div className={styles.sensitiveDetailsContainer}>
      <div className="text-wrap">{name}</div>
      <ShowHide value={value} useAsterisk />
      <CopyButton copyText={value} />
    </div>
  );
}

function ShowHide({
  value,
  useAsterisk,
}: {
  value: string;
  useAsterisk: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className={styles.showHideContainer}>
      <div className="small text-muted text-wrap">
        {show ? value : useAsterisk && '********'}
      </div>

      <Button
        color="link"
        type="button"
        onClick={() => setShow((show) => !show)}
        title="Show/Hide value"
        icon={show ? EyeIcon : EyeOffIcon}
      >
        {show ? 'Hide' : 'Show'}
      </Button>
    </div>
  );
}
