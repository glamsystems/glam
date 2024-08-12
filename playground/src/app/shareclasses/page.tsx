"use client";

import React, { useState } from 'react';
import ProductFormSchema from './data/shareClassFormSchema.json'
import {JsonForms} from "@jsonforms/react";
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';

const initialData = {};

export default function ShareClasses() {
  const [data, setData] = useState(initialData);

  return (
    <div>
      <p>Share Classes</p>
      <JsonForms
        schema={ProductFormSchema}
        data={initialData}
        renderers={vanillaRenderers}
        cells={vanillaCells}
      />
    </div>
  );
}
