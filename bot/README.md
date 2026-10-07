# Learning Assistant: first Teams reply bot

A minimal authenticated Teams SDK bot. It supports `hello`, `help`, and `status` in a personal chat. Other requests receive an honest explanation that business actions are not connected. No AI calls, application APIs, database, or administrator notifications are implemented yet.

The existing website at the repository root stays on GitHub Pages. GitHub Pages cannot run this bot; deploy its container to Azure Container Apps.

## Configuration

Set these at runtime, not in the container image:

| Variable | Value / meaning |
|---|---|
| `CLIENT_ID` | `25e90648-686c-45ce-964d-faa3428732b7` — existing Azure Bot Microsoft App ID |
| `TENANT_ID` | `6c7df0de-c240-4c62-8043-9f999faca940` — directory containing that bot registration |
| `CLIENT_SECRET` | Secret value from that app registration; configure as an Azure Container App secret reference |
| `ALLOWED_TEAMS_TENANT_ID` | `146f3da1-43b2-4c64-82ab-86916a2bcae5` — organization for `sharmagaurav1985.onmicrosoft.com`, verified from Microsoft's public OpenID discovery metadata |
| `PORT` | `3978` |

The Azure Bot home directory differs from the Microsoft 365 organization. Do not replace the bot's `TENANT_ID` with the Teams organization ID: it identifies where the credential is issued. The allowed Teams tenant is a separate filter. Verify installation and messaging across these directories before adding user SSO. If distribution or sign-in fails, inspect the Teams app's Entra/SSO configuration and organization policies; do not blindly change IDs or disable authentication.

## Create a client secret

1. Azure Bot > Configuration > Microsoft App ID > Manage, or Microsoft Entra ID > App registrations > All applications; search for the exact `CLIENT_ID` above.
2. Switch Azure directories if needed to find the app in `6c7df0de-c240-4c62-8043-9f999faca940`.
3. Certificates & secrets > New client secret. Use a short suitable expiry and record its expiry date.
4. Copy the **Value**, not the Secret ID, into a password manager. It is only shown once. Never commit it, put it in the Teams app package, or post it in chat.
5. Store it as `bot-client-secret` under the Container App's secrets; reference that secret from `CLIENT_SECRET`.

## Container build

The repository's **Build bot image** action tests and builds on changes under `bot/`, or can be started manually under Actions. It needs no Azure credentials or bot secret. It publishes a container to:

`ghcr.io/sharmagaurav1985/learning-assistant-bot:latest`

Prefer the immutable commit tag shown in a successful workflow's summary when deploying.

GitHub container packages start private. For anonymous Azure image pulls, open your GitHub profile > Packages > learning-assistant-bot > Package settings > Change visibility > Public. This exposes the code image, not any runtime secrets. Alternatively use a properly scoped registry credential in Azure. Do not assume a public repository makes the image public.

## Deploy in Azure Portal

1. Create a **Container App** in a dedicated learning resource group. Use a **Consumption** workload profile and a region available to your subscription. Use the image above, or its immutable commit tag.
2. Choose **0.25 vCPU / 0.5 GiB** as an initial learning allocation; increase only if actual memory use requires it.
3. Add the runtime variables above and the secret reference. Do not start with an empty `CLIENT_SECRET`; this app deliberately refuses to start without it.
4. Enable external HTTP ingress with **target port 3978**, HTTPS only. Do not enable separate platform sign-in on the messaging endpoint: Microsoft Bot Service must reach it, and the Teams SDK validates incoming service tokens itself.
5. Set **minimum replicas 0 / maximum replicas 1**. If configuring an HTTP scale rule, a concurrency threshold of 10 is sufficient for this simple test. The first request after sleep may be delayed.
6. Configure startup/readiness/liveness HTTP probes on `/healthz`, port 3978, if adding probes through the portal. Health checks must not use `/api/messages`.
7. Review any logging, registry, or storage resources and their costs. The container free allowance is not a spending cap; budget alerts do not stop charges.
8. After deployment, open `https://<container-app-host>/healthz`. Expect `{"status":"ok"}`. This proves process health only, not correct bot credentials or Teams connectivity.
9. Azure Bot > Configuration > Messaging endpoint: `https://<container-app-host>/api/messages`. Save. Ensure the Microsoft Teams channel is enabled.
10. In Teams Developer Portal, keep the Bot feature connected to `CLIENT_ID`, with Personal scope. Install the app in the test organization and send `hello`, `help`, and `status` from desktop and mobile.

Do not use the GitHub Pages URL as the messaging endpoint.

## Verification and limitations

`npm ci --ignore-scripts && npm test` (Node 22.12+).

Tests verify startup fails without a secret, cross-organization/shared-chat activities do not produce replies, unsupported actions are not reported as complete, the health route works, and unsigned or invalidly signed HTTP requests are rejected. Handler tests simulate an already authenticated Teams turn; they do not bypass production authentication.

The SDK authenticates Bot Service traffic. This is not user SSO or application authorization. Before adding business APIs, implement account mapping, backend permission checks, action confirmations where appropriate, and audit handling.

Message text is processed in memory for a reply. This code adds no transcript database or message-content logging. Teams and hosting providers have separate data handling. Health and negative authentication tests cannot establish that the supplied secret works or that a real Teams reply succeeds; those require the final hosted smoke test.

## References

- https://learn.microsoft.com/en-us/microsoftteams/platform/teams-sdk/essentials/app-authentication/overview
- https://learn.microsoft.com/en-us/microsoftteams/platform/teams-sdk/teams/azure-configuration
- https://learn.microsoft.com/en-us/azure/container-apps/environment-variables
