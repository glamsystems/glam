"use client";

import { z } from "zod"

const testSchema = z.object({ "x-id": z.any().optional(), "title": z.any().optional(), "description": z.any().optional(), "type": z.any().optional(), "x-component": z.any().optional() });

export default function Products() {
    return (
        <div>
            <p>Products</p>
        </div>
    );
}
