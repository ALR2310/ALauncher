import steveFace from '~/assets/images/steve-face.png';

export default function SideRightBar() {
  return (
    <div className="flex flex-col w-3xs p-3">
      <div className="flex gap-2 p-3 bg-base-100 rounded-xl border border-base-content/10">
        <img src={steveFace} alt="Steve Face" className="w-10 border border-base-content/30 rounded-lg" />

        <div className="flex flex-col">
          <input
            type="text"
            placeholder="Your name"
            className="input border-t-0 border-l-0 border-r-0 focus:outline-none rounded-none"
          />
        </div>
      </div>
    </div>
  );
}
