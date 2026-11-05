## What and why
<!-- One focused change. Link the issue: Closes #123 -->

## How I verified it
<!-- Commands run; device or emulator + Android version for anything under android/ -->

## Checklist
- [ ] I self-reviewed this diff on GitHub before requesting review
- [ ] Single-purpose (if the description needs "and also", split the PR)
- [ ] `npm test` passes locally
- [ ] Release build type still has `debuggable false`, `minifyEnabled true`, `shrinkResources true`
- [ ] No keystores, passwords, `local.properties` or machine-specific paths added
- [ ] Any new `<uses-permission>` is justified above and reflected in `PRIVACY.md`
- [ ] Release PR only: `versionCode` incremented and `versionName` equals the tag to be pushed
