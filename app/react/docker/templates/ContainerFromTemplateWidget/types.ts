import { AccessControlFormData } from '@/react/portainer/access-control/types';

import { PortMapping } from '../../containers/CreateView/BaseForm/PortsMappingField';
import { VolumesTabValues } from '../../containers/CreateView/VolumesTab';
import { LabelsTabValues } from '../../containers/CreateView/LabelsTab';

export interface FormValues {
  name: string;
  network: string;
  accessControl: AccessControlFormData;
  ports: Array<PortMapping>;
  volumes: VolumesTabValues;
  hosts: Array<string>;
  labels: LabelsTabValues;
  hostname: string;
  envVars: Record<string, string>;
}
