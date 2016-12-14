# TFS Code Review Extensions

Improve your productivity with the set of extensions for the TFS Pull Requests interface.

---

## Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Pack before publish

1. Generate `key.pem` once using `ssh-keygen` command

Create `*.crx` and `*.zip` packages

```bash
gulp pack
```
