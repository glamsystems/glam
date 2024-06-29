"use client";

import { useEffect, useState } from "react";
import JupiterStrict from "./data/jupiterStrict";

export default function Tokens() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const result = await JupiterStrict();
      // @ts-ignore
      setData(result);
    }

    fetchData();
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex w-full">
        <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
