import { SensitiveDetails } from './SensitiveDetails';
import { Application, ConfigKind } from './types';

export function ConfigurationDetails({ item }: { item: Application }) {
  const secrets = item.Configurations?.filter(
    (config) => config.Data && config.Kind === ConfigKind.Secret
  )
    .flatMap((config) => Object.entries(config.Data || {}))
    .map(([key, value]) => ({ key, value }));

  if (!secrets || secrets.length === 0) {
    return null;
  }

  return (
    <>
      <div className="col-xs-12 !px-0 !py-1 text-[13px]"> Secrets </div>
      <table className="w-1/2">
        <tbody>
          <tr>
            <td>
              {secrets.map((secret) => (
                <SensitiveDetails
                  key={secret.key}
                  name={secret.key}
                  value={secret.value}
                />
              ))}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
