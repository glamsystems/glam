'use client';

import {DataTable} from "./components/data-table";
import {columns} from "./components/columns";
import React from "react";
import {z} from "zod";

const products = [
    {
        address: "Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc",
        name: "GLAM Alpha",
        symbol: "GLAM",
        baseAsset: "SOL",
        inception: "2024-01-01",
        status: "active"
    }
]

export default function Products() {
    return (<div className="flex w-2/3 mt-16 self-center">
        <DataTable data={products} columns={columns}/>
    </div>)
}
