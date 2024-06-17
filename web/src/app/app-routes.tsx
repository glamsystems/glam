import { Navigate, useRoutes } from "react-router-dom";

import AccountDetailFeature from "./account/account-detail-feature";
import AccountListFeature from "./account/account-list-feature";
import CreateProduct from "./manage/CreateProduct";
import Manage from "./manage/Manage";
import ProductPage from "./products/product-page";
import ProductsOverview from "./products/products-overview";

import GlamFeature from "./glam/glam-feature";
import ClusterFeature from "./cluster/cluster-feature";

export function AppRoutes() {
  return useRoutes([
    { index: true, element: <Navigate to={"/products"} replace={true} /> },
    { path: "/account/", element: <AccountListFeature /> },
    { path: "/account/:address", element: <AccountDetailFeature /> },
    { path: "/manage", element: <Manage /> },
    { path: "/create-product", element: <CreateProduct /> },

    { path: "/glam", element: <GlamFeature /> },
    { path: "/cluster", element: <ClusterFeature /> },

    { path: "/products", element: <ProductsOverview /> },
    { path: "/products/:id", element: <ProductPage /> },
    { path: "*", element: <Navigate to={"/products"} replace={true} /> },
  ]);
}
