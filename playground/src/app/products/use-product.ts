import { atom, useAtom } from "jotai"

import { Products, products } from "./data"

type Config = {
  selected: Products["id"] | null
}

const configAtom = atom<Config>({
  selected: products[0].id,
})

export function useProducts() {
  return useAtom(configAtom)
}
