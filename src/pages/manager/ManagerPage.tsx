export default function ManagerPage() {
  return (
    <div className="flex flex-nowrap justify-between p-3 bg-base-300">
      <div className="flex">
        <a href="#" className="btn btn-ghost px-2">
          Mods (0)
        </a>
        <div className="divider divider-horizontal m-0"></div>
        <a href="#" className="btn btn-ghost px-2">
          Data Packs (0)
        </a>
        <div className="divider divider-horizontal m-0"></div>
        <a href="#" className="btn btn-ghost px-2">
          Resource Packs (0)
        </a>
        <div className="divider divider-horizontal m-0"></div>
        <a href="#" className="btn btn-ghost px-2">
          Shader Packs (0)
        </a>
        <div className="divider divider-horizontal m-0"></div>
        <a href="#" className="btn btn-ghost px-2">
          World (0)
        </a>
      </div>

      <button className="btn btn-soft">
        <i className="fa-light fa-plus"></i>
        Thêm nội dung
      </button>
    </div>
  );
}
