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

import { PublicKey } from "@solana/web3.js";

import { useNavigate } from "react-router-dom";

import {
  useGlamProgramAccount,
  useFundPerfChartData
} from "../glam/glam-data-access";
import { TextAlignCenter } from "@carbon/icons-react";

export default function ProductsOverview() {
  const defaultFund = "AdXkDnJpFKqZeoUygLvm5dp2b5JGVPz3rEWfGCtB5Kc2";
  const rows = [
    {
      id: defaultFund,
      name: "Glam Investment Fund",
      symbol: "GBS",
      /*nav: 100.1,
      aum: 13796.12,*/
      share_classes_len: 1,
      assets_len: 3,
      fees_management: 1.5,
      fees_performance: 10,
      inception: 1712189348,
      status: "Active"
    }
  ];

  const headers = [
    {
      key: "",
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
    {
      key: "share_classes_len",
      header: "Share Classes"
    },
    {
      key: "assets_len",
      header: "Assets"
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

  const navigate = useNavigate();

  class FundModel {
    key: PublicKey;
    data: any;

    constructor(key: PublicKey, data: any) {
      this.key = key;
      this.data = data || {};
    }

    getImageUrl() {
      const pubkey =
        this.data?.shareClasses[0].toBase58() ||
        "1111111111111111111111111111111111";
      return `https://api.glam.systems/image/${pubkey}.png`;
    }

    getManagementFee() {
      return this.data?.shareClassesMetadata[0].feeManagement / 1_000_000.0;
    }
    getPerformanceFee() {
      return this.data?.shareClassesMetadata[0].feePerformance / 1_000_000.0;
    }
  }

  let id = "AdXkDnJpFKqZeoUygLvm5dp2b5JGVPz3rEWfGCtB5Kc2";

  let fundKey = new PublicKey(defaultFund);
  try {
    fundKey = new PublicKey(id || defaultFund);
  } catch (_e) {
    // pass
  }
  const fundId = fundKey.toString();

  const { account } = useGlamProgramAccount({ fundKey });
  if (account.isLoading) {
    return ""; //spinner
  }

  const fundModel = new FundModel(fundKey, account.data);

  function formatNumber(value: number): string {
    return new Intl.NumberFormat("en-US").format(value);
  }

  function formatDateFromTimestamp(timestampStr: string): string {
    const date = new Date(Number(timestampStr) * 1000);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

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
                    // @ts-ignore
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
                            {formatDateFromTimestamp(cell.value)}
                          </TableCell>
                        );
                      } else if (cell.info.header === "aum") {
                        return (
                          <TableCell key={cell.id}>
                            {formatNumber(cell.value)}
                          </TableCell>
                        );
                      } else if (cell.info.header === "") {
                        return (
                          <TableCell key={cell.id}>
                            <img
                              src={fundModel.getImageUrl()}
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
            <Pagination
              page={1}
              pageSize={10}
              pageSizes={[10, 20, 30, 40, 50]}
              totalItems={rows.length}
              onChange={() => console.log("change")}
              itemsPerPageText={null}
            />
          </TableContainer>
        )}
      </DataTable>
    </div>
  );
}
