import { ENV } from '@shared/enums/general.enum';

export default function Img(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  if (import.meta.env.VITE_ENV === ENV.Office && props.src) {
    return <img {...props} src="https://i.imgur.com/4b1k0aH.png" />;
  }

  return <img {...props} />;
}
