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

import { formatDateFromTimestamp } from "../utils/format-number";
import { useGlamProgram } from "../glam/glam-data-access";
import { useNavigate } from "react-router-dom";

const capitalize = (s: string) => (
  s.charAt(0).toUpperCase() + s.slice(1)
);

/* Sort funds by inception data (last created first)
   and by symbol if funds have the same inception date */
const sortFunds = (a: any, b: any) => {
  if (a.inception == b.inception) {
    return (a.symbol <= b.symbol) ? -1 : 1;
  }
  return (a.inception < b.inception) ? 1 : -1;
}

export default function ProductsOverview() {
  const { accounts } = useGlamProgram();
  const navigate = useNavigate();

  let rows = (accounts.data || []).map((account) => {
      const fund = account.account;
      const imageKey =
        fund.shareClasses[0].toBase58() || "1111111111111111111111111111111111";
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
        inception: new Date(Date.parse(
          fund.shareClassesMetadata[0].launchDate
        )),
        status: capitalize(fund.shareClassesMetadata[0].lifecycle),
        shareClassAsset: fund.shareClassesMetadata[0].shareClassAsset,
        policyDistribution: capitalize(fund.shareClassesMetadata[0].policyDistribution),
      };
  }).sort(sortFunds);

  const headers = [
    {
      key: "imageURL",
      header: ""
    },
    {
      key: "name",
      header: "Name"
    },
    {
      key: "symbol",
      header: "Symbol"
    },
    /*{
      key: "nav",
      header: "NAV"
    },
    {
      key: "aum",
      header: "AUM"
    },*/
    /*{
      key: "share_classes_len",
      header: "Share Classes"
    },
    {
      key: "assets_len",
      header: "Assets"
    },*/
    {
      key: "shareClassAsset",
      header: "Share Class Asset"
    },
    {
      key: "policyDistribution",
      header: "Policy Distribution"
    },
    {
      key: "fees_management",
      header: "MGMT (%)"
    },
    {
      key: "fees_performance",
      header: "PERF (%)"
    },
    {
      key: "inception",
      header: "Inception"
    },
    {
      key: "status",
      header: "Status"
    }
  ];

  return (
    <div className="flex justify-center h-full items-center">
      <DataTable rows={rows} headers={headers}>
        {({
          rows,
          headers,
          getTableProps,
          getHeaderProps,
          getRowProps,
          getToolbarProps
        }) => (
          <TableContainer className="w-[80vw]">
            <TableToolbar {...getToolbarProps()}>
              <TableToolbarContent>
                <TableToolbarSearch onChange={() => console.log("change")} />
              </TableToolbarContent>
            </TableToolbar>
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
                      } else if (cell.info.header === "imageURL") {
                        return (
                          <TableCell key={cell.id}>
                            <img
                              src={cell.value}
                              alt="Fund"
                              style={{
                                marginBottom: "2px",
                                height: "36px"
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
            {/*
            <Pagination
              page={1}
              pageSize={10}
              pageSizes={[10, 20, 30, 40, 50]}
              totalItems={rows.length}
              onChange={() => console.log("change")}
              itemsPerPageText={null}
            />*/}
          </TableContainer>
        )}
      </DataTable>
    </div>
  );
}
