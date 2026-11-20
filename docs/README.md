# RAUDEV developer docs

How the site works today and how to change it safely. Start with the [root README](../README.md) to get it running locally.

| Doc | Read it when you want to… |
|---|---|
| [Architecture](architecture.md) | understand how the pieces fit: monorepo, request flow, routing, data loading, auth |
| [Features](features.md) | know what each feature does and where its code lives |
| [API reference](api.md) | call or change a backend endpoint |
| [Data model](data-model.md) | read or change the database schema |
| [Development guide](development.md) | add a page, endpoint or content type; follow the project conventions; test a change |
| [Deployment](deployment.md) | ship to production and know what each release needs |
| [Content packs](../content/README.md) | add lessons, practice and quizzes as files and load them into a site |
| [Changelog](../CHANGELOG.md) | see what changed and when |

## Keeping these docs current

Docs that drift are worse than none. When a change affects what's described here, update the doc **in the same commit**:

- New or changed endpoint → [api.md](api.md)
- Schema change → [data-model.md](data-model.md), and a "Deploy notes" line in the [changelog](../CHANGELOG.md)
- New feature or changed behaviour → [features.md](features.md)
- New convention or pattern → [development.md](development.md)
- Every user-visible change → an entry under **Unreleased** in the [changelog](../CHANGELOG.md)
