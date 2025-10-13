import { Compass, House, Library, Plus, Settings } from 'lucide-react';
import { NavLink } from 'react-router';

export default function SideLeftBar() {
  return (
    <div id="side-left-bar" className="flex flex-col justify-between">
      <div>
        <ul className="menu menu-sm rounded-box">
          <li>
            <NavLink
              to="/"
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
              to="/discover"
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
              to="/library"
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
          <li>
            <NavLink
              to="/create"
              className={({ isActive }) =>
                `tooltip z-10 tooltip-right py-4 transition-transform duration-300 hover:scale-95 ${
                  isActive ? 'bg-success/10 text-success' : ''
                }`
              }
              data-tip="Create"
            >
              <Plus size={20} />
            </NavLink>
          </li>
        </ul>
      </div>

      <ul className="menu menu-sm rounded-box">
        <li>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `tooltip z-10 tooltip-right py-4 transition-transform duration-300 hover:scale-95 ${
                isActive ? 'bg-success/10 text-success' : ''
              }`
            }
            data-tip="Setting"
          >
            <Settings size={20} />
          </NavLink>
        </li>
      </ul>
    </div>
  );
}
