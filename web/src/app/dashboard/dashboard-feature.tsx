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

export default function DashboardFeature() {
  const rows = [
    {
      id: 'a',
      symbol: 'BTC',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: 'b',
      symbol: 'ETH',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: 'c',
      symbol: 'SOL',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: 'd',
      symbol: 'USDC',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: 'e',
      symbol: 'USDT',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: 'f',
      symbol: 'AVAX',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: 'g',
      symbol: 'AAVE',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: 'h',
      symbol: 'GMX',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: 'i',
      symbol: 'BONK',
      nav: 100,
      aum: 100,
      '24': 100,
      sharpe: 100,
      volatility: 100,
      track: 100,
      status: 'Disabled',
    },
    {
      id: 'j',
      symbol: 'LINK',
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

  return (
    <div style={{ width: '80vw', margin: 'auto' }}>
      <DataTable rows={rows} headers={headers}>
        {({
          rows,
          headers,
          getTableProps,
          getHeaderProps,
          getRowProps,
          getToolbarProps,
        }) => (
          <TableContainer>
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
                  <TableRow {...getRowProps({ row })}>
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
