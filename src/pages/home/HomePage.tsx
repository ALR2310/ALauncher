import { BaseDirectory, writeTextFile } from '@tauri-apps/plugin-fs';

export default function HomePage() {
  return (
    <button
      className="btn"
      onClick={async () => {
        const data = {
          name: 'anle',
          time: new Date(),
        };

        await writeTextFile('lethanhan.json', JSON.stringify(data, null, 2), {
          baseDir: BaseDirectory.AppData,
        });
      }}
    >
      Click me
    </button>
  );
}
