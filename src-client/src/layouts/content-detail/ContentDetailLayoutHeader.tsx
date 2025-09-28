import type { DetailContentResponseDto } from '@shared/dtos/content.dto';
import { categoryMap } from '@shared/mappings/general.mapping';

interface ContentDetailLayoutHeaderProps {
  content?: DetailContentResponseDto;
}

export default function ContentDetailLayoutHeader({ content }: ContentDetailLayoutHeaderProps) {
  const leadingAuthor = content?.authors?.[0];

  return (
    <div className="flex justify-between p-3 gap-3 bg-base-100 rounded">
      <div className="flex gap-3">
        <div className="w-20">
          <img
            src={content?.logo.url}
            alt={content?.logo.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-semibold text-2xl">{content?.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <span>By</span>
            {leadingAuthor ? (
              <div className="badge badge-soft">
                <img src={leadingAuthor.avatarUrl} alt={leadingAuthor.name} className="w-4 h-4 rounded-full" />
                {leadingAuthor.name}
              </div>
            ) : (
              <div className="badge badge-soft">Unknown</div>
            )}
            <div className="divider divider-horizontal"></div>
            <button className="btn btn-outline btn-sm">
              {content?.classId ? categoryMap.idToText[content.classId] : 'Unknown'}
            </button>
          </div>
        </div>
      </div>

      <button className="btn btn-soft btn-primary w-[20%]">Install</button>
    </div>
  );
}
