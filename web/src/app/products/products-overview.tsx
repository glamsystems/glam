import {
  DataTable,
  unstable_Pagination as Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch
} from "@carbon/react";
import { useEffect, useMemo, useState } from "react";

import { CustomPagination } from "../ui/Pagination";
import { formatDateFromTimestamp } from "../utils/format-number";
import { useGlamProgram } from "../glam/glam-data-access";
import { useNavigate } from "react-router-dom";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* Sort funds by inception data (last created first)
   and by symbol if funds have the same inception date */
const sortFunds = (a: any, b: any) => {
  if (a.inception === b.inception) {
    return a.symbol <= b.symbol ? -1 : 1;
  }
  return a.inception < b.inception ? 1 : -1;
};

export default function ProductsOverview() {
  const { accounts } = useGlamProgram();
  const navigate = useNavigate();

  const allRows = (accounts.data || [])
    .map((account) => {
      const fund = account.account;
      const imageKey =
        fund.shareClasses[0].toBase58() || "11111111111111111111111111111111";
      return {
        imageURL: `https://api.glam.systems/image/${imageKey}.png`,
        id: account.publicKey.toBase58(),
        name: fund.name,
        symbol: fund.symbol,
        share_classes_len: fund.shareClassesLen,
        assets_len: fund.assetsLen,
        fees_management: fund.shareClassesMetadata[0].feeManagement / 10_000.0,
        fees_performance:
          fund.shareClassesMetadata[0].feePerformance / 10_000.0,
        inception: new Date(
          Date.parse(fund.shareClassesMetadata[0].launchDate)
        ),
        status: capitalize(fund.shareClassesMetadata[0].lifecycle),
        shareClassAsset: fund.shareClassesMetadata[0].shareClassAsset,
        policyDistribution: capitalize(
          fund.shareClassesMetadata[0].policyDistribution
        )
      };
    })
    .sort(sortFunds);

  // State for managing current page and page size
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(30);

  // Calculate the rows to display based on the current page and rows per page
  const indexOfLastRow = useMemo(
    () => currentPage * rowsPerPage,
    [currentPage, rowsPerPage]
  );
  const indexOfFirstRow = useMemo(
    () => indexOfLastRow - rowsPerPage,
    [indexOfLastRow, rowsPerPage]
  );
  const currentRows = allRows.slice(indexOfFirstRow, indexOfLastRow);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Dynamically adjust the headers based on the window width
  const headers = [
    ...(windowWidth >= 1000 ? [{ key: "imageURL", header: "" }] : []),
    { key: "name", header: "Name" },
    { key: "symbol", header: "Symbol" },
    { key: "shareClassAsset", header: "Share Class Asset" },
    { key: "policyDistribution", header: "Distribution Policy" },
    { key: "fees_management", header: "MGMT (%)" },
    { key: "fees_performance", header: "PERF (%)" },
    { key: "inception", header: "Inception" },
    { key: "status", header: "Status" }
  ];

  return (
    <div className="flex flex-col h-full items-center">
      <DataTable rows={currentRows} headers={headers}>
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <TableContainer className="w-full max-w-[1500px] p-8 ">
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    // @ts-expect-error FIXME: No overload matches this call.
                    <TableHeader {...getHeaderProps({ header })}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    {...getRowProps({ row })}
                    style={{
                      cursor: "pointer"
                    }}
                    onClick={() => navigate(`/products/${row.id}`)}
                  >
                    {row.cells.map((cell) => {
                      if (cell.info.header === "inception") {
                        return (
                          <TableCell key={cell.id}>
                            {cell.value.toISOString().split("T")[0]}
                          </TableCell>
                        );
                      } else if (cell.info.header === "aum") {
                        return (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        );
                      }
                      // don't display the image column if the screen is too small
                      else if (cell.info.header === "imageURL") {
                        return (
                          <TableCell key={cell.id}>
                            <img
                              src={cell.value}
                              alt="Fund"
                              style={{
                                marginBottom: "2px",
                                maxHeight: "36px"
                              }}
                            />
                          </TableCell>
                        );
                      } else {
                        return (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        );
                      }
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <CustomPagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              pageSize={rowsPerPage}
              totalItems={allRows.length}
            />
          </TableContainer>
        )}
      </DataTable>
    </div>
  );
}
