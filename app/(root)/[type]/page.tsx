import React from "react";
import Sort from "@/components/Sort";
import { platformStorageService } from "@/lib/services/platform/platform-storage.service";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { getFileTypesParams } from "@/lib/utils";
import FileList from "@/components/FileList";
import { File as MyFile } from "@/types/file";

const Page = async ({ searchParams, params }: SearchParamProps) => {
  const type = ((await params)?.type as string) || "";
  const searchText = ((await searchParams)?.query as string) || "";
  const sort = ((await searchParams)?.sort as string) || "";

  const types = getFileTypesParams(type) as FileType[];
  const currentUser = await getCurrentUser();

  // Get initial files for Platform mode (will be overridden by client component if S3 mode)
  let files: { documents: MyFile[]; total: number } = { documents: [], total: 0 };
  if (currentUser) {
    files = await platformStorageService.getFiles({
      userId: currentUser.id,
      types,
      searchText,
      sort
    });
  }

  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1 capitalize">{type}</h1>

        <div className="total-size-section">
          <p className="body-1">
            Total: <span className="h5">0 MB</span>
          </p>

          <div className="sort-container">
            <p className="body-1 hidden text-light-200 sm:block">Sort by:</p>

            <Sort />
          </div>
        </div>
      </section>

      {/* Render the files */}
      <FileList
        types={types}
        searchText={searchText}
        sort={sort}
        initialFiles={files as any}
        currentUser={currentUser as any}
      />
    </div>
  );
};

export default Page;
