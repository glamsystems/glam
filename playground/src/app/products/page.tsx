"use client";

import DynamicForm from '@/components/DynamicForm';
import schema from './data/productFormSchema.json';

export default function Page() {
    return (
        <div>
            <h1>Product Form</h1>
            <DynamicForm schema={schema} />
        </div>
    );
}
