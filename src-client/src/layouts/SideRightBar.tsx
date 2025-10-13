import steveFace from '~/assets/images/steve-face.png';
import { Img } from '~/components/Img';

export default function SideRightBar() {
  return (
    <div className="flex flex-col p-3 w-64 lg:w-72">
      <div className="flex gap-2 p-3 bg-base-100 rounded-xl border border-base-content/10">
        <Img src={steveFace} alt="Steve Face" className="w-10 border border-base-content/30 rounded-lg" />

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
