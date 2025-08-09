export default function ManagerPage() {
  return (
    <div className="flex flex-nowrap justify-between p-4 bg-base-300">
      <div className="flex">
        <a href="#" className="btn btn-ghost">
          Mods (0)
        </a>
        <a href="#" className="btn btn-ghost">
          Data Packs (0)
        </a>
        <a href="#" className="btn btn-ghost">
          Resource Packs (0)
        </a>
        <a href="#" className="btn btn-ghost">
          Shader Packs (0)
        </a>
        <a href="#" className="btn btn-ghost">
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
