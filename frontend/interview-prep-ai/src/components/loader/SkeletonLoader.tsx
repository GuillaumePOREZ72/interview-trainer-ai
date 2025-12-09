import React from "react";

const SkeletonLoader = () => {
  return (
    <div className="w-full animate-pulse space-y-4 mt-4 p-1">
      {/* Titre simulé */}
      <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>

      {/* Paragraphes simulés */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-11/12"></div>
        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>

      {/* Bloc de code simulé */}
      <div className="mt-4 h-20 bg-gray-100 rounded border border-gray-200"></div>
    </div>
  );
};

export default SkeletonLoader;
