"use client";

import React, { useState } from 'react';
import ProductFormSchema from './data/productFormSchema.json'
import {JsonForms} from "@jsonforms/react";
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';

const initialData = {};

export default function Products() {
    const [data, setData] = useState(initialData);

    return (
        <div>
            <p>Products</p>
            <JsonForms
                schema={ProductFormSchema}
                data={initialData}
                renderers={vanillaRenderers}
                cells={vanillaCells}
            />
        </div>
    );
}
