import { atom, useAtom } from "jotai"

import { ShareClasses, shareClasses } from "./data"

type Config = {
  selected: ShareClasses["id"] | null
}

const configAtom = atom<Config>({
  selected: shareClasses[0].id,
})

export function useShareClasses() {
  return useAtom(configAtom)
}
