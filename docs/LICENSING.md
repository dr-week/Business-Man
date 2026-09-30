# Licensing status

No root `LICENSE` is present. The repository is public, but GitHub's viewing/forking permission is not a general grant to reuse, distribute, or modify the code. `package.json`'s `private` flag prevents npm publication; it does not license the source.

## Dependency audit

The current lockfile has 944 installed package records, each with license metadata. Most report MIT; the dependency tree also includes Apache, BSD, ISC, MPL-2.0, LGPL-3.0-or-later, CC-BY-4.0, and combined expressions. This is a metadata inventory, not a compatibility or shipped-bundle audit. In particular, review MPL/LGPL package use and any modified files before distribution. Regenerate the inventory from the release lockfile, inspect included packages' license texts, and include required notices. The bundled upstream plugin notice lives at `build/sites-vite-plugin.LICENSE`.

Provider terms, datasets, logos, fonts, and other non-package assets need separate review. API access does not automatically grant rights to redistribute collected data.

## Decide before granting reuse rights

- **MIT**: permissive reuse with copyright/license notice retention; little reciprocity.
- **Apache-2.0**: permissive reuse with an express patent grant and additional notice requirements.
- **AGPL-3.0**: copyleft; modified network services must offer corresponding source to remote users.
- **Proprietary/custom**: no general reuse grant; use only after confirming ownership and contributor rights. This is not an OSI open-source license.

Choose based on intended reuse and service model. Confirm copyright owners and obtain rights for all existing contributions before adding a license. For future outside contributions, adopt a DCO or CLA before accepting them if relicensing may be needed. Do not describe JWT entitlement checks as software licensing or copy protection.

References: [GitHub repository licensing](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository), [GitHub contribution ownership guidance](https://github.com/github/opensource.guide/blob/main/_articles/legal.md), [GNU AGPL FAQ](https://www.gnu.org/licenses/gpl-faq.en.html), [OSI approved licenses](https://opensource.org/licenses).
