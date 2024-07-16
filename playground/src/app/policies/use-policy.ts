import { atom, useAtom } from "jotai"

import { Policies, policies } from "./data"

type Config = {
  selected: Policies["id"] | null
}

const configAtom = atom<Config>({
  selected: policies[0].id,
})

export function usePolicies() {
  return useAtom(configAtom)
}
