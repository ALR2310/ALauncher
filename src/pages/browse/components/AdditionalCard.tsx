import { AdditionalResponse } from '@shared/schema/additional.schema';
import { abbreviateNumber } from '@shared/utils/general.utils';

const categoryTitleMap = {
  'mc-mods': 'Mods',
  'data-packs': 'Data Packs',
  'texture-packs': 'Resource Packs',
  shaders: 'Shaders',
  worlds: 'Worlds',
};

const loaderTypeMap = {
  0: '',
  1: 'Forge',
  4: 'Fabric',
  5: 'Quilt',
  6: 'NeoForge',
};

interface AdditionalCardProps {
  data: AdditionalResponse['data'][number];
  categoryType: string;
  versionSelected: string;
  loaderType: string;
}

export default function AdditionalCard({ data, categoryType, versionSelected, loaderType }: AdditionalCardProps) {
  return (
    <div className="h-[120px] flex bg-base-100 p-3 rounded gap-4">
      <div className="flex justify-center items-center">
        <img src={data.logoUrl} alt="mod img" loading="lazy" className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="flex">
          <div className="flex-1">
            <div className="flex items-center font-semibold">
              <h3 className="text-base-content text-ellipsis-1">{data.name}</h3>
              <div className="divider divider-horizontal"></div>
              <p className="text-base-content/60 text-nowrap">by {data.authors[0].name}</p>
            </div>

            <p className="text-sm text-base-content/80 text-ellipsis-1 overflow-hidden">{data.summary}</p>
          </div>

          <div className="w-[15%]">
            <button className="btn btn-soft btn-primary w-full">Install</button>
          </div>
        </div>

        <div className="divider m-0"></div>

        <div className="flex justify-between text-xs text-base-content/70">
          <div className="flex items-center gap-2">
            <button className="btn btn-outline btn-xs">{categoryTitleMap[categoryType]}</button>
            <div className="flex gap-2 overflow-hidden text-ellipsis-1 w-[50%]">
              {data.categories.map((cat, idx) => (
                <a href="#" key={idx} className=" hover:underline">
                  {cat.name}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-nowrap">
            <p>
              <i className="fa-light fa-download"></i> {abbreviateNumber(data.downloadCount)}
            </p>
            <p>
              <i className="fa-light fa-clock-three"></i> {new Date(data.dateModified).toLocaleDateString()}
            </p>
            <p>
              <i className="fa-light fa-database"></i> {data.fileSize}
            </p>
            <p>
              <i className="fa-light fa-gamepad-modern"></i> {versionSelected}
            </p>
            <p>{loaderTypeMap[loaderType]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
