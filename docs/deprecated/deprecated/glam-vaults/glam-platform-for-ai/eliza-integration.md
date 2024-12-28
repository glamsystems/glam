# Eliza Integration

We developed a GLAM plugin for the [Eliza](https://github.com/elizaOS/eliza) framework. Check out the `glam_plugin` branch of GLAM's [eliza fork](https://github.com/glamsystems/eliza).

To start the GLAM agent, run:

```bash
pnpm run dev  --characters=\"characters/glam.character.json\"
```

A glam-cli docker image will be pulled from ghcr.io (github container registry). The glam-cli requires the following setup in order to interact with a GLAM vault.

```bash
$ ls $HOME/.glam-cli-docker
config.json  keypair.json

$ cat $HOME/.glam-cli-docker/config.json
{
  "helius_api_key": "[redacted]",
  "keypair_path": "/workspace/keypair.json",
  "priority_fee_level": "Low",
  "fund": "[redacted]"
}
```

