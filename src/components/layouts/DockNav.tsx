import Select from '~/components/Select';

export default function DockNav() {
  return (
    <div className="flex flex-nowrap gap-4 p-3 bg-base-300">
      <input type="text" className="input flex-1" placeholder="Tên người dùng" />

      <Select
        className="flex-1"
        search={true}
        position="top"
        options={[
          {
            label: '1.21.1',
            value: '1.21.1',
          },
          {
            label: '1.20.1',
            value: '1.20.1',
          },
        ]}
      />

      <button className="btn btn-primary flex-1">Vào trò chơi</button>

      <div className="flex-1 flex">
        <button className="btn btn-ghost flex-1">
          <i className="fa-light fa-rotate-right"></i>
        </button>

        <button className="btn btn-ghost flex-1">
          <i className="fa-light fa-folder-closed"></i>
        </button>

        <button className="btn btn-ghost flex-1">
          <i className="fa-light fa-gear"></i>
        </button>
      </div>
    </div>
  );
}
