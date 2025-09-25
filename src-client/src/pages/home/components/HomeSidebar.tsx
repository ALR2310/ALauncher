import React, { useRef, useState } from 'react';

import { useFindAllInstanceQuery } from '~/hooks/api/useInstance';

import InstanceCard from './sidebar/InstanceCard';
import InstanceModal from './sidebar/InstanceModal';

interface HomeSidebarProps {
  className?: string;
}

export default function HomeSidebar({ className }: HomeSidebarProps) {
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState('');
  const modalRef = useRef<HTMLDialogElement>(null!);

  const { data, isLoading } = useFindAllInstanceQuery();

  return (
    <React.Fragment>
      <div className={`${className} space-y-3 p-3 flex flex-col`}>
        <button
          className="btn btn-soft btn-primary w-full"
          onClick={() => {
            setInstanceId(null);
            modalRef.current?.showModal();
          }}
        >
          <i className="fa-light fa-plus"></i>
          Create Modpack
        </button>

        <label className="input">
          <i className="fa-light fa-magnifying-glass text-base-content/60"></i>
          <input
            type="search"
            className="grow"
            placeholder="Search..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
          />
        </label>

        {/* Modpack List */}
        <div className="flex-1 space-y-3 overflow-auto no-scrollbar">
          {isLoading && <div>Loading...</div>}
          {data?.length ? (
            data
              .filter((i) => i.name.toLocaleLowerCase().includes(searchKey.toLocaleLowerCase()))
              .map((instance) => <InstanceCard key={instance.id} data={instance} />)
          ) : (
            <p className="text-center">
              No modpack found. <br /> Create one!
            </p>
          )}
        </div>
      </div>

      <InstanceModal ref={modalRef} instanceId={instanceId} />
    </React.Fragment>
  );
}
