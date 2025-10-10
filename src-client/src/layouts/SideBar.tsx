import { Compass, House, Library, Plus, Settings } from 'lucide-react';

export default function SideBar() {
  return (
    <div className="flex flex-col justify-between bg-base-300/80">
      <div>
        <ul className="menu rounded-box">
          <li>
            <a className="tooltip tooltip-right py-4" data-tip="Home">
              <House />
            </a>
          </li>
          <li>
            <a className="tooltip tooltip-right py-4" data-tip="Discover">
              <Compass />
            </a>
          </li>
          <li>
            <a className="tooltip tooltip-right py-4" data-tip="Library">
              <Library />
            </a>
          </li>
        </ul>

        <div className="divider m-0 p-2"></div>

        <ul className="menu rounded-box">
          <li>
            <a className="tooltip tooltip-right py-4" data-tip="Create">
              <Plus />
            </a>
          </li>
        </ul>
      </div>

      <ul className="menu rounded-box">
        <li>
          <a className="tooltip tooltip-right py-4" data-tip="Setting">
            <Settings />
          </a>
        </li>
      </ul>
    </div>
  );
}
