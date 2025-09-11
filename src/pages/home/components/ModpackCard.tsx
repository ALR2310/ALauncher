import { InstanceDto } from '@shared/dtos/instance.dto';
import { useNavigate } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import { toast } from '~/hooks/useToast';
import { LauncherContext } from '~/providers/LauncherProvider';

// import modpackLogo from '~/assets/imgs/modpack-logo.webp';

const modpackLogo = 'https://i.imgur.com/4b1k0aH.png';

interface ModpackCardProps {
  data: InstanceDto;
}

export default function ModpackCard({ data }: ModpackCardProps) {
  const navigate = useNavigate();

  const deleteInstanceMutation = useContextSelector(LauncherContext, (v) => v.deleteInstanceMutation);
  const findAllInstanceQuery = useContextSelector(LauncherContext, (v) => v.findAllInstanceQuery);

  const handleDeleteInstance = () => {
    deleteInstanceMutation.mutateAsync(data.id!).then(() => {
      findAllInstanceQuery.refetch();
      toast.success('Instance deleted successfully');
    });
  };

  return (
    <div
      className="relative w-full h-[40%] group overflow-hidden"
      style={{
        backgroundImage: `url(${modpackLogo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      tabIndex={0}
    >
      {/* Version */}
      <div className="absolute top-0 right-0 bg-base-300/60 m-1 p-1 rounded-box text-sm">
        <i className="fa-light fa-gamepad-modern"></i>
        {`${data.loader.type} ${data.loader.version}`}
      </div>

      {/* Button action */}
      <div className="absolute top-0 left-0">
        <button className="btn btn-sm btn-ghost btn-circle" onClick={handleDeleteInstance}>
          <i className="fa-light fa-trash-can"></i>
        </button>
      </div>

      {/* Info */}
      <div className="absolute left-0 right-0 bottom-0 w-full p-2 bg-base-300/60 space-y-3 transform transition-transform duration-300 translate-y-[calc(100%-40px)] group-hover:translate-y-0 group-focus:translate-y-0">
        <p className="font-semibold">{data.name}</p>
        <div className="join flex">
          <button className="btn btn-primary join-item flex-1" onClick={() => navigate(`/manager/${data.id}`)}>
            Customize
          </button>
        </div>
      </div>
    </div>
  );
}
