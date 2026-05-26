# Magic Venia PWA

Adobe/Magento PWA Studio Venia storefront connected to:

```bash
MAGENTO_BACKEND_URL=http://magic.local/
MAGENTO_BACKEND_EDITION=MOS
```

## Runtime

Use the local Node 20 runtime and Yarn 1:

```bash
export PATH="$HOME/.local/node-v20.19.5-linux-x64/bin:$PATH"
```

## Commands

```bash
cd /var/www/html/magic/pwa
yarn install
yarn watch
yarn build
```

`yarn watch` is configured to bind to:

```bash
http://0.0.0.0:8081/
```

Open it from the same machine as:

```bash
http://localhost:8081/
```

The previous Vite-based PWA was moved to the backup directory recorded in:

```bash
/var/www/html/magic/.last_pwa_backup
```
