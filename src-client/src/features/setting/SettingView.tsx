import { X } from 'lucide-react';

export default function SettingView() {
  return (
    <div>
      <div className="divider">Game</div>
      <div className="grid grid-cols-3 gap-2 items-center">
        <label>Resolution: </label>
        <div className="col-span-2 flex items-center justify-around">
          <input type="text" className="input" />
          <X size={40} strokeWidth={3} />
          <input type="text" className="input" />
        </div>

        <label>Fullscreen:</label>
        <select className="select col-span-2">
          <option value="true">On</option>
          <option value="false">Off</option>
        </select>
      </div>
    </div>
  );
}
