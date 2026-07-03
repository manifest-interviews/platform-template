# infra/

This directory contains a **simplified Pulumi TypeScript stack** that sketches
how the Booking API might run on AWS (a container service in front of a managed
PostgreSQL database).

> ⚠️ This is a **review artifact only**. It is not wired up, not deployed, and
> is not expected to `pulumi up` cleanly. Do not create real cloud resources
> from it. Its purpose is to give something concrete to read and critique during
> a platform/IaC discussion.

## Contents

- `pulumi/index.ts` — the stack definition.
- `pulumi/Pulumi.yaml` — project file.
- `pulumi/config.example.yaml` — example configuration.

## How to use it in the interview

Read `pulumi/index.ts` and consider what you would change before adopting this
pattern more broadly: security, reliability, cost, environment separation,
secrets, tagging, ownership, and how product engineers would interact with it.
