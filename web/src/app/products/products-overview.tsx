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
  TableToolbarSearch,
} from '@carbon/react';

import { useNavigate } from 'react-router-dom';

export default function ProductsOverview() {
  const defaultFund = 'Cprd9VcMpAuGAonDEsHpxiuzLG6dzt5xR6mpyeq2EiN1';
  const rows = [
    {
      id: defaultFund,
      symbol: 'GLAM-A-USDC',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: defaultFund,
      symbol: 'GLAM-A-USDC',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: defaultFund,
      symbol: 'GLAM-A-USDC',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: defaultFund,
      symbol: 'GLAM-A-USDC',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: defaultFund,
      symbol: 'GLAM-A-USDC',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: defaultFund,
      symbol: 'GLAM-A-USDC',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: defaultFund,
      symbol: 'GLAM-A-USDC',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: defaultFund,
      symbol: 'GLAM-A-USDC',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: defaultFund,
      symbol: 'GLAM-A-USDC',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: defaultFund,
      symbol: 'GLAM-A-USDC',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
  ];

  const headers = [
    {
      key: 'symbol',
      header: 'Symbol',
    },
    {
      key: 'nav',
      header: 'NAV',
    },
    {
      key: 'aum',
      header: 'AUM',
    },
    {
      key: '24',
      header: '24',
    },
    {
      key: 'sharpe',
      header: 'Sharpe',
    },
    {
      key: 'volatility',
      header: 'Volatility',
    },
    {
      key: 'track',
      header: 'Track',
    },
    {
      key: 'status',
      header: 'Status',
    },
  ];

  const navigate = useNavigate();

  return (
    <div className="flex justify-center h-full items-center">
      <DataTable rows={rows} headers={headers}>
        {({
          rows,
          headers,
          getTableProps,
          getHeaderProps,
          getRowProps,
          getToolbarProps,
        }) => (
          <TableContainer className="w-[80vw]">
            <TableToolbar {...getToolbarProps()}>
              <TableToolbarContent>
                <TableToolbarSearch onChange={() => console.log('change')} />
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
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/products/${row.id}`)}
                  >
                    {row.cells.map((cell) => (
                      <TableCell key={cell.id}>{cell.value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={1}
              pageSize={10}
              pageSizes={[10, 20, 30, 40, 50]}
              totalItems={rows.length}
              onChange={() => console.log('change')}
              itemsPerPageText={null}
            />
          </TableContainer>
        )}
      </DataTable>
    </div>
  );
}
