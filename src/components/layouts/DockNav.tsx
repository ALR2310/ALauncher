import { useState } from 'react';

import Select from '~/components/Select';
import { useVersion } from '~/hook/useVersion';
import { useWS } from '~/hook/useWS';

export default function DockNav() {
  const { send, on } = useWS();

  const { version, setVersion } = useVersion();
  const [username, setUsername] = useState('');

  on('username', (data) => {
    console.log('Nhận từ server:', data);
  });

  return (
    <div className="flex flex-nowrap gap-4 p-3 bg-base-300">
      <input
        type="text"
        className="input flex-1"
        placeholder="Tên người dùng"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          send('username', e.target.value);
        }}
      />

      <Select
        className="flex-1"
        search={true}
        position="top"
        value={version}
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
        onChange={(value) => setVersion(value)}
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
