"use client";

import DynamicForm from '@/components/DynamicForm';
import schema from './data/shareClassFormSchema.json';

export default function Page() {
  return (
    <div>
      <h1>Share Class Form</h1>
      <DynamicForm schema={schema} />
    </div>
  );
}
