import { atom, useAtom } from "jotai"

import { Integrations, integrations } from "./data"

type Config = {
  selected: Integrations["id"] | null
}

const configAtom = atom<Config>({
  selected: integrations[0].id,
})

export function useIntegrations() {
  return useAtom(configAtom)
}
