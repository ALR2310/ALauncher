import { Box, Compass, House, Library, Plus, Settings } from 'lucide-react';
import { Link, NavLink } from 'react-router';

import { ROUTES } from '~/constants/routes';
import { useInstancesQuery } from '~/hooks/api/useInstanceApi';
import { useLibraryModal } from '~/hooks/app/useLibraryModal';

export default function SideLeftBar() {
  const { open } = useLibraryModal();
  const { data: instances } = useInstancesQuery({ sortBy: 'lastPlayed', sortDir: 'desc' });

  return (
    <div id="side-left-bar" className="flex flex-col justify-between">
      <div>
        <ul className="menu menu-sm rounded-box">
          <li>
            <NavLink
              to={ROUTES.HOME}
              end
              className={({ isActive }) =>
                `tooltip z-10 tooltip-right py-4 transition-transform duration-300 hover:scale-95 ${
                  isActive ? 'bg-success/10 text-success' : ''
                }`
              }
              data-tip="Home"
            >
              <House size={20} />
            </NavLink>
          </li>
          <li>
            <NavLink
              to={ROUTES.DISCOVER}
              className={({ isActive }) =>
                `tooltip z-10 tooltip-right py-4 transition-transform duration-300 hover:scale-95 ${
                  isActive ? 'bg-success/10 text-success' : ''
                }`
              }
              data-tip="Discover"
            >
              <Compass size={20} />
            </NavLink>
          </li>
          <li>
            <NavLink
              to={ROUTES.LIBRARY}
              className={({ isActive }) =>
                `tooltip z-10 tooltip-right py-4 transition-transform duration-300 hover:scale-95 ${
                  isActive ? 'bg-success/10 text-success' : ''
                }`
              }
              data-tip="Library"
            >
              <Library size={20} />
            </NavLink>
          </li>
        </ul>

        <div className="divider m-0 p-2" />

        <ul className="menu menu-sm rounded-box">
          {instances && instances.length && (
            <li>
              <Link
                to={ROUTES.LIBRARY_DETAIL(instances[0].id)}
                className={`tooltip z-10 tooltip-right py-4 transition-transform duration-300 hover:scale-95`}
                data-tip={instances[0].name}
              >
                <Box size={20} />
              </Link>
            </li>
          )}

          <li>
            <a
              className={`tooltip z-10 tooltip-right py-4 transition-transform duration-300 hover:scale-95`}
              data-tip="Create"
              onClick={() => open()}
            >
              <Plus size={20} />
            </a>
          </li>
        </ul>
      </div>

      <ul className="menu menu-sm rounded-box">
        <li>
          <a
            className={`tooltip z-10 tooltip-right py-4 transition-transform duration-300 hover:scale-95`}
            data-tip="Setting"
          >
            <Settings size={20} />
          </a>
        </li>
      </ul>
    </div>
  );
}
