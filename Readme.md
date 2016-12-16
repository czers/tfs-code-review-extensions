# TFS Code Review Extensions

Improve your productivity with the set of extensions for the TFS Pull Requests interface.

---

![](screenshots/tfs-cloud-screenshot-2.png)

---

## Functionality

- Ability to mark each file as `Approved`, `Waiting` or `Rejected`
- Works for TFS Cloud and TFS on-premises

## Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Pack before publish

1. Generate `key.pem` once using `npm run keygen` command
1. Execute `gulp pack` command

- You can use `*.crx` file like a custom build. Just drag&drop on `chrome://extensions` page.
- Zip archive is used to upload new version to Chrome Store.