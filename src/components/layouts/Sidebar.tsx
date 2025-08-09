import modpackLogo from '~/assets/imgs/modpack-logo.webp';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  return (
    <div className={`p-4 space-y-3 overflow-auto ${className}`}>
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
        <div className="absolute top-0 right-0 bg-base-300/60 m-1 p-1 rounded-box">
          <i className="fa-light fa-gamepad-modern"></i>
          1.21.1
        </div>

        {/* Info */}
        <div
          className="absolute left-0 right-0 bottom-0 p-4 bg-base-300/60 space-y-4 transform transition-transform duration-300
               translate-y-[calc(100%-48px)] group-hover:translate-y-0 group-focus:translate-y-0"
        >
          <p className="font-semibold">Tên modpack</p>
          <button className="btn btn-primary w-full">Tải về</button>
        </div>
      </div>
    </div>
  );
}
