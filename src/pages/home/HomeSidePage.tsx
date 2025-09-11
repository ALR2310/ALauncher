import React, { useRef, useState } from 'react';
import { useContextSelector } from 'use-context-selector';

import { LauncherContext } from '~/providers/LauncherProvider';

import ModalModpack from './components/ModalModpack';
import ModpackCard from './components/ModpackCard';

export default function HomeSidePage({ className }: { className?: string }) {
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState('');
  const modalRef = useRef<HTMLDialogElement>(null!);

  // Launcher context
  const findAllInstanceQuery = useContextSelector(LauncherContext, (v) => v.findAllInstanceQuery);

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
          {findAllInstanceQuery.isLoading && <div>Loading...</div>}
          {findAllInstanceQuery.data?.length ? (
            findAllInstanceQuery.data
              .filter((i) => i.name.toLocaleLowerCase().includes(searchKey.toLocaleLowerCase()))
              .map((instance) => <ModpackCard key={instance.id} data={instance} />)
          ) : (
            <p className="text-center">
              No modpack found. <br /> Create one!
            </p>
          )}
        </div>
      </div>

      <ModalModpack ref={modalRef} instanceId={instanceId} />
    </React.Fragment>
  );
}
