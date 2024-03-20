import { Navigate, useRoutes } from 'react-router-dom';

import { lazy } from 'react';

const AccountListFeature = lazy(() => import('./account/account-list-feature'));
const AccountDetailFeature = lazy(
  () => import('./account/account-detail-feature')
);
const ClusterFeature = lazy(() => import('./cluster/cluster-feature'));

const GlamFeature = lazy(() => import('./glam/glam-feature'));
const ProductPage = lazy(() => import('./products/product-page'));

const ProductsOverview = lazy(() => import('./products/products-overview'));

export function AppRoutes() {
  return useRoutes([
    { index: true, element: <Navigate to={'/dashboard'} replace={true} /> },
    { path: '/account/', element: <AccountListFeature /> },
    { path: '/account/:address', element: <AccountDetailFeature /> },
    { path: '/manage', element: <ClusterFeature /> },

    { path: '/glam', element: <GlamFeature /> },

    { path: '/products', element: <ProductsOverview /> },
    { path: '/products/:id', element: <ProductPage /> },
    { path: '*', element: <Navigate to={'/dashboard'} replace={true} /> },
  ]);
}
