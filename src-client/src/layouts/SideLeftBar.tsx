import { Compass, House, Library, Plus, Settings } from 'lucide-react';

export default function SideLeftBar() {
  return (
    <div id="side-left-bar" className="flex flex-col justify-between">
      <div>
        <ul className="menu menu-sm rounded-box">
          <li>
            <a
              className="tooltip z-10 tooltip-right py-4 transition-transform duration-300 hover:scale-95"
              data-tip="Home"
            >
              <House size={20} />
            </a>
          </li>
          <li>
            <a
              className="tooltip z-10 tooltip-right py-4 transition-transform duration-300 hover:scale-95"
              data-tip="Discover"
            >
              <Compass size={20} />
            </a>
          </li>
          <li>
            <a
              className="tooltip z-10 tooltip-right py-4 transition-transform duration-300 hover:scale-95"
              data-tip="Library"
            >
              <Library size={20} />
            </a>
          </li>
        </ul>

        <div className="divider m-0 p-2"></div>

        <ul className="menu menu-sm rounded-box">
          <li>
            <a
              className="tooltip z-10 tooltip-right py-4 transition-transform duration-300 hover:scale-95"
              data-tip="Create"
            >
              <Plus size={20} />
            </a>
          </li>
        </ul>
      </div>

      <ul className="menu menu-sm rounded-box">
        <li>
          <a
            className="tooltip z-10 tooltip-right py-4 transition-transform duration-300 hover:scale-95"
            data-tip="Setting"
          >
            <Settings size={20} />
          </a>
        </li>
      </ul>
    </div>
  );
}
