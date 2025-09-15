import React from 'react';
import { useContextSelector } from 'use-context-selector';

import { LauncherContext } from '~/providers/LauncherProvider';

import HomeLoadingPage from './HomeLoadingPage';
import HomeNotePage from './HomeNotePage';
import HomeSidePage from './HomeSidePage';

export default function HomePage() {
  const findReleaseNotesQuery = useContextSelector(LauncherContext, (v) => v.findReleaseNotesQuery);
  const findAllVersionQuery = useContextSelector(LauncherContext, (v) => v.findAllVersionQuery);
  const findAllInstanceQuery = useContextSelector(LauncherContext, (v) => v.findAllInstanceQuery);

  const isLoading = findReleaseNotesQuery.isLoading || findAllVersionQuery.isLoading || findAllInstanceQuery.isLoading;

  return (
    <div className="flex h-full">
      {isLoading ? (
        <HomeLoadingPage />
      ) : (
        <React.Fragment>
          <HomeSidePage className="flex-1/4" />
          <HomeNotePage className="flex-3/4" />
        </React.Fragment>
      )}
    </div>
  );
}
