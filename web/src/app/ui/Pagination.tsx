import { QBarrier } from "@carbon/icons-react";

interface CustomPaginationProps {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  totalItems: number;
}

export const CustomPagination = ({
  currentPage,
  setCurrentPage,
  pageSize,
  totalItems,
}: CustomPaginationProps) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  const goToNextPage = () => {
    setCurrentPage((currentPage) => Math.min(currentPage + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((currentPage) => Math.max(currentPage - 1, 1));
  };

  return (
    <div className="flex justify-between items-center w-full bg-[#f4f4f4] pl-4 pr-4 pt-2 pb-2">
      <div className="flex space-x-2">
        <p className="text-[#525252] ">
          1-{pageSize} of {totalItems} items
        </p>
      </div>

      <div className="flex space-x-2 items-center">
        <p className="text-[#525252] ">
          {currentPage} of {totalPages} pages
        </p>
        <QBarrier size={20} />
        <div className="flex space-x-2 items-center">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            style={{
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              color: currentPage === 1 ? "#525252" : "black",
            }}
          >
            Prev
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            style={{
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              color: currentPage === totalPages ? "#525252" : "black",
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
