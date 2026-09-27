---
slug: webuild-pox-employee
title: WE BUILD Power of X (PoX) employee authorisation workflow
summary: >-
  Authorise an employee to act for their company and have a notary office rely on it, on
  the EUDI trust framework and with the employee using an EUDI wallet. The company — which
  holds its own EBWOID — first requests a PID presentation from the employee, checks it
  against its HR record, and then issues a WE BUILD Power of X (PoX) SD-JWT VC whose proxy
  details are copied from the verified PID. The notary office requests the PID and the PoX
  together in one DCQL presentation, and binds the two by checking that the person on the
  PID is the proxy named in the PoX, that the PoX was issued by the company it claims to
  represent, and that the granted powers cover the notarial act.
questions:
  - id: role
    prompt: Which role are you acting in?
    required: true
    options: [company, notary, employee]
    hint: >-
      "company" = the economic operator granting the power; it holds an EBWOID, verifies the
      employee's PID and issues the PoX. "notary" = the notary office relying on the PoX; it
      verifies the PID and the PoX together and checks they describe the same person.
      "employee" = the person receiving the PoX into an EUDI wallet and presenting it.
  - id: employee_record
    prompt: "Company: who is the employee — given name, family name and date of birth as held in your HR record?"
    required: false
    hint: >-
      The PID proves who is holding the wallet; the HR record is what says that person is
      your employee. The PoX is only issued if the two match. Say where the record comes
      from.
  - id: pox_scope
    prompt: "Company: what power is granted — PoX type, faculties, constraints, geographical scope, grant and expiration date, and which relying parties or services it covers?"
    required: false
    hint: >-
      Default type is power_of_attorney (authority_source proxy_power_scope). Faculties are
      the business areas (e.g. CONTRACTS, FINANCIAL, TAX), constraints are free-text
      operational or economic limits (e.g. "Maximum transaction amount EUR 50000"),
      geographical_scope is a list of ISO 3166-1 alpha-2 codes. Name the notary office in
      service_access if the power is meant for it specifically.
  - id: mandator
    prompt: "Company: who grants the power on the company's behalf — given name, family name, date of birth and position?"
    required: false
    hint: >-
      The PoA mandator is the natural person with authority to delegate — typically a
      managing director. It is written into the PoX as `proxy_power_scope.mandator`.
  - id: expected_company
    prompt: "Notary: which company does the employee claim to represent — its EBWOID identifier (EUID) and legal name — and how do you know it?"
    required: false
    hint: >-
      Take it from the deed, the client file or the business register — never from the PoX
      being checked. It is compared both against the PoX's represented_economic_operator
      and against the certificate that signed the PoX.
  - id: notarial_act
    prompt: "Notary: which act is the employee performing on the company's behalf, in which country, and of what value?"
    required: false
    hint: >-
      Used to decide whether the PoX's faculty, constraints, geographical_scope and
      service_access actually cover this act. A valid PoX with the wrong scope is a refusal.
---

# WE BUILD Power of X (PoX) employee authorisation workflow

An employee needs to act for their company before a notary office — sign a deed, file a
declaration, accept a service. The company states in a verifiable credential that the
employee may do so, and the notary office checks that statement together with the
employee's own identity. There are three parties and two interactions:

1. **Company → employee: PID presentation, then PoX issuance.** The company's wallet asks
   the employee's EUDI wallet for a PID, checks it against the HR record, and issues a
   WE BUILD **Power of X** credential whose proxy details are copied from that verified
   PID.
2. **Employee → notary office: PID + PoX presentation.** The notary office asks for both
   credentials in one request and checks that they describe the same person, that the PoX
   really comes from the company it names, and that the powers cover the act at hand.

| Credential | Issued by | Held by | Format | Presented to |
|---|---|---|---|---|
| EBWOID | Business-register authority / QTSP | Company | `sd_jwt_vc`, `vct: uri:eu.ebw.oid.1` | — (source of the company's identity in the PoX) |
| PID | PID provider (Member State) | Employee (EUDI wallet) | `dc+sd-jwt`, `vct: urn:eudi:pid:1` | Company, notary office |
| PoX | Company (self-issued EAA) | Employee (EUDI wallet) | `dc+sd-jwt`, `vct: https://credentials.webuild.eu/power-of-x/v7` | Notary office |

## Why the notary has to bind PID and PoX itself

The PoX names its proxy by personal data — given name, family name, date of birth — not by
a key the notary can check against the PID. The EUDI wallet generates a fresh key for each
credential it receives, so the PoX's `cnf` key and the PID's `cnf` key are **different**,
and nothing cryptographic says they belong to one person. What makes the pair trustworthy
is:

- both are presented in **one** response to **one** request, each with a valid key-binding
  proof, so both are under the control of the wallet answering that request; and
- the person data in the PoX was **copied from a verified PID** by the company, so it
  matches the PID claim for claim.

The notary's binding check is therefore an exact comparison of the proxy data in the PoX
with the PID. That comparison is the reason the company must copy PID values verbatim and
never retype them from the HR record.

## Credential types

- **PID** — EUDI Person Identification Data, SD-JWT VC encoding. Base type `urn:eudi:pid:1`
  (ARF Annex 2, PID_14); domestic types extend it within the `urn:eudi:pid:` namespace.
  Claim names used here: `given_name`, `family_name`, `birthdate`, `nationalities` (array),
  and optionally `place_of_birth` (object with `country`/`region`/`locality`) and
  `personal_administrative_number`. Rulebook:
  <https://github.com/webuild-consortium/webuild-attestation-rulebooks-catalog/tree/main/rulebooks/rb-pid>.
- **EBWOID** — European Business Wallet Owner Identification Data, `vct: uri:eu.ebw.oid.1`.
  `id` is the EUID (e.g. `NOFOR.123456789`), `name` the official legal name. The company
  already holds it; this workflow only reads it.
- **PoX** — WE BUILD Power of X, canonical model v7, `vct:
  https://credentials.webuild.eu/power-of-x/v7`, SD-JWT VC only (the rulebook excludes W3C
  VCDM; mdoc is deferred). Rulebook:
  <https://github.com/webuild-consortium/webuild-attestation-rulebooks-catalog/blob/main/rulebooks/rb-poa-pox/README.md>.
  It has four domains:
  - `credential` — `type` (`power_of_attorney` / `power_of_representation`) and
    `legal_category`. A company self-issuing it is not a QTSP and is not backed by an
    authentic source, so `legal_category` is **`non-qualified-EAA`** — never `QEAA`.
  - `represented_economic_operator` — `identifier {scheme, value}` and `legal_name`. Filled
    from the company's EBWOID: `scheme: "EBWOID"`, `value` = EBWOID `id`, `legal_name` =
    EBWOID `name`.
  - `proxy` — `entity_type: "natural_entity"` and `natural_entity_proxy` with
    `given_name`, `family_name`, `birth_date`, `birth_place`, `nationality` (array),
    `personal_administrative_number`. Filled from the verified PID.
  - `authority` — exactly one of `proxy_position` (PoR), `proxy_power_scope` (PoA) or
    `proxy_employee_authorisation` (PoE), named by `authority_source`.

  **Power of Employee is not usable yet.** The rulebook reserves
  `proxy_employee_authorisation` but leaves it undefined, and states PoE is out of the
  MVP pilots. An employee authorisation is therefore issued as a **Power of Attorney**:
  `credential.type: "power_of_attorney"`, `authority_source: "proxy_power_scope"`, with the
  managing director as `mandator`. Power of Representation is not appropriate either — it
  attests an organic position from the business register (e.g. Sole Administrator), which
  a company cannot self-attest for an ordinary employee.

Mind the name mismatches between the two credentials — the binding check depends on them:

| Person attribute | PID claim | PoX claim |
|---|---|---|
| Given name | `given_name` | `proxy.natural_entity_proxy.given_name` |
| Family name | `family_name` | `proxy.natural_entity_proxy.family_name` |
| Date of birth | `birthdate` | `proxy.natural_entity_proxy.birth_date` |
| Nationality | `nationalities` (array) | `proxy.natural_entity_proxy.nationality` (array) |
| Place of birth | `place_of_birth` (object) | `proxy.natural_entity_proxy.birth_place` (string) |
| Personal admin. number | `personal_administrative_number` | `proxy.natural_entity_proxy.personal_administrative_number` |

## EUDI wallet compatibility

The employee's EUDI wallet (the EUDI Reference Wallet or one built to the ARF) constrains
both Triveria wallets:

- Credentials are `sd_jwt_vc` (presented as `dc+sd-jwt`); W3C VCDM is not supported.
- `oidcRevision` is OIDC4VCI `Draft15` and OIDC4VP `Draft23` — the API defaults will not
  interoperate.
- Issuers and verifiers sign with `x509`, and that certificate must be a valid **Wallet
  Relying Party Access Certificate** (WRPAC) under the WE BUILD trust list.
- Verifiers use **DCQL**, not DIF Presentation Exchange.
- The EUDI wallet has no DID and does not support the OpenID authorization extension, so:
  - **No pre-authorized offer.** `IssuerInitiatePreauthOffer` needs the holder's DID
    (`clientId`) or an ID-token request, and the EUDI wallet can provide neither. The PoX
    goes out as an **in-time authorized** offer (`IssuerInitiateAuthOffer`).
  - **No `VPDriven` / `CredentialRequirements`.** Those gate issuance on a presentation
    inside the offer, which the EUDI wallet only supports through a custom authentication
    provider. This workflow instead runs the PID verification as a separate, earlier step
    and issues from its result through the `IssuanceQueue`.
  - `authorization` is `oauthNoAuth` for testing (a mock server that authorises every
    caller) and `oauthCustom` with an `authnProviderUrl` in production. `openid` and
    `openidCustom` do not work.

## Wallet configuration

Worked snippets to adapt, not load verbatim. Both wallets use the EUDI trust framework
with the WE BUILD MVP List of Trusted Lists; the PID provider's and the company's
certificates are validated against it.

| Role | `credentialIssuers` | `credentialVerifiers` |
|---|---|---|
| Company | `webuild_pox` | `pid_for_pox_issuance` |
| Notary office | none | `pid_and_pox` |
| Employee | EUDI wallet — no Triveria configuration | |

### Company wallet — PID verifier and PoX issuer

The PID query asks only for what goes into the PoX. Every claim listed in a DCQL query is
required, so `place_of_birth` and `personal_administrative_number` are left out — not every
PID carries them. Add them if your employees' PIDs do and you want them in the PoX.

The PoX's `disclosableClaims` follow the rulebook's type metadata: `credential`,
`proxy.entity_type`, `authority.authority_source` and `credential_metadata` are
`sd: never` and stay in the clear; the rest is selectively disclosable, down to each
proxy attribute, so a relying party can ask for the name and date of birth without the
personal administrative number.

```json
{
  "name": "PoX Company Wallet",
  "description": "Verifies employee PIDs and issues WE BUILD Power of X credentials to EUDI wallets.",
  "config": {
    "trustFramework": "EUDI",
    "walletKeyIdentifier": "x509",
    "EUDI": {
      "etsiLotlUrl": "https://webuild-consortium.github.io/wp4-trust-group/list_of_trusted_lists.xml",
      "trustedLotlCertificates": [
        "MIIBsjCCAVmgAwIBAgITPvPF+X8GhViy0ozkLPO7+1YNITAKBggqhkjOPQQDAjAwMQswCQYDVQQGEwJFVTEhMB8GA1UECgwYV1A0IFRydXN0IFJlZ2lzdHJ5IEdyb3VwMB4XDTI2MDMyMDEzMjgyNVoXDTI5MDMxOTEzMjgyNVowMDELMAkGA1UEBhMCRVUxITAfBgNVBAoMGFdQNCBUcnVzdCBSZWdpc3RyeSBHcm91cDBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABJoI9e3meFI++UhQAG3clpKkbSTL2YIuhGZ/4C4kbPjjEgbL8hKywQUlCN6TXUipD8SMjceZ3PnB52qZgAK9Qh2jUjBQMA4GA1UdDwEB/wQEAwIGwDARBgNVHSUECjAIBgYEAJE3AwAwDAYDVR0TAQH/BAIwADAdBgNVHQ4EFgQUh78bCQwjCQICwxtn6FHEQAktn7YwCgYIKoZIzj0EAwIDRwAwRAIgfbkN22wQzj8kfoAgvYk1u86n/jHDB1FEXJA7aH4VuRECIHulljT498YiqnCgRU7UlRXSF/MpC02r1V1DjAue5lYF"
      ]
    },
    "credentialVerifiers": [
      {
        "id": "pid_for_pox_issuance",
        "name": "Employee PID",
        "toVerify": ["verifyExpiration", "verifyStatus", "verifyKeyBinding"],
        "dcqlQuery": {
          "credentials": [
            {
              "id": "pid",
              "format": "dc+sd-jwt",
              "meta": { "vct_values": ["urn:eudi:pid:1"] },
              "claims": [
                { "id": "given_name", "path": ["given_name"] },
                { "id": "family_name", "path": ["family_name"] },
                { "id": "birthdate", "path": ["birthdate"] },
                { "id": "nationalities", "path": ["nationalities"] }
              ]
            }
          ]
        }
      }
    ],
    "credentialIssuers": [
      {
        "id": "webuild_pox",
        "name": "WE BUILD Power of X",
        "signingKeyIdentifier": "x509",
        "authorization": "oauthNoAuth",
        "credentialFormat": "sd_jwt_vc",
        "credentialIssuer": "IssuanceQueue",
        "credentialType": "https://credentials.webuild.eu/power-of-x/v7",
        "disclosableClaims": [
          "$.represented_economic_operator.identifier.value",
          "$.represented_economic_operator.legal_name",
          "$.proxy.natural_entity_proxy.given_name",
          "$.proxy.natural_entity_proxy.family_name",
          "$.proxy.natural_entity_proxy.birth_date",
          "$.proxy.natural_entity_proxy.birth_place",
          "$.proxy.natural_entity_proxy.nationality",
          "$.proxy.natural_entity_proxy.personal_administrative_number",
          "$.authority.proxy_power_scope"
        ]
      }
    ],
    "oidcRevision": { "oidc4vci": "Draft15", "oidc4vp": "Draft23" }
  }
}
```

For production replace `"authorization": "oauthNoAuth"` with `"oauthCustom"` plus an
`authnProviderUrl` — with `oauthNoAuth`, whoever opens the offer URL gets the credential.
If your EUDI wallets still hold older PIDs, add their type to `vct_values`
(e.g. `"eu.europa.ec.eudi.pid.1"`) and check which date-of-birth claim name they use.

### Notary office wallet — PID and PoX verifier

One query, two credentials, both required. Requesting them together is what ties them to
one wallet session. The PoX request asks for the proxy's name and date of birth — the
binding attributes — and the power, but not the personal administrative number.

```json
{
  "name": "PoX Notary Wallet",
  "description": "Verifies an employee's PID together with the WE BUILD Power of X issued by their company.",
  "config": {
    "trustFramework": "EUDI",
    "walletKeyIdentifier": "x509",
    "EUDI": {
      "etsiLotlUrl": "https://webuild-consortium.github.io/wp4-trust-group/list_of_trusted_lists.xml",
      "trustedLotlCertificates": [
        "MIIBsjCCAVmgAwIBAgITPvPF+X8GhViy0ozkLPO7+1YNITAKBggqhkjOPQQDAjAwMQswCQYDVQQGEwJFVTEhMB8GA1UECgwYV1A0IFRydXN0IFJlZ2lzdHJ5IEdyb3VwMB4XDTI2MDMyMDEzMjgyNVoXDTI5MDMxOTEzMjgyNVowMDELMAkGA1UEBhMCRVUxITAfBgNVBAoMGFdQNCBUcnVzdCBSZWdpc3RyeSBHcm91cDBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABJoI9e3meFI++UhQAG3clpKkbSTL2YIuhGZ/4C4kbPjjEgbL8hKywQUlCN6TXUipD8SMjceZ3PnB52qZgAK9Qh2jUjBQMA4GA1UdDwEB/wQEAwIGwDARBgNVHSUECjAIBgYEAJE3AwAwDAYDVR0TAQH/BAIwADAdBgNVHQ4EFgQUh78bCQwjCQICwxtn6FHEQAktn7YwCgYIKoZIzj0EAwIDRwAwRAIgfbkN22wQzj8kfoAgvYk1u86n/jHDB1FEXJA7aH4VuRECIHulljT498YiqnCgRU7UlRXSF/MpC02r1V1DjAue5lYF"
      ]
    },
    "credentialVerifiers": [
      {
        "id": "pid_and_pox",
        "name": "Employee PID and Power of X",
        "toVerify": ["verifyExpiration", "verifyStatus", "verifyKeyBinding"],
        "dcqlQuery": {
          "credentials": [
            {
              "id": "pid",
              "format": "dc+sd-jwt",
              "meta": { "vct_values": ["urn:eudi:pid:1"] },
              "claims": [
                { "id": "given_name", "path": ["given_name"] },
                { "id": "family_name", "path": ["family_name"] },
                { "id": "birthdate", "path": ["birthdate"] }
              ]
            },
            {
              "id": "pox",
              "format": "dc+sd-jwt",
              "meta": { "vct_values": ["https://credentials.webuild.eu/power-of-x/v7"] },
              "claims": [
                { "id": "pox_type", "path": ["credential", "type"] },
                { "id": "legal_category", "path": ["credential", "legal_category"] },
                { "id": "eo_identifier", "path": ["represented_economic_operator", "identifier", "value"] },
                { "id": "eo_legal_name", "path": ["represented_economic_operator", "legal_name"] },
                { "id": "proxy_entity_type", "path": ["proxy", "entity_type"] },
                { "id": "proxy_given_name", "path": ["proxy", "natural_entity_proxy", "given_name"] },
                { "id": "proxy_family_name", "path": ["proxy", "natural_entity_proxy", "family_name"] },
                { "id": "proxy_birth_date", "path": ["proxy", "natural_entity_proxy", "birth_date"] },
                { "id": "authority_source", "path": ["authority", "authority_source"] },
                { "id": "power_scope", "path": ["authority", "proxy_power_scope"] }
              ]
            }
          ]
        }
      }
    ],
    "oidcRevision": { "oidc4vci": "Draft15", "oidc4vp": "Draft23" }
  }
}
```

## Prerequisites

### Company and notary office

- A wallet configured as above, with `trustFramework: "EUDI"` and
  `walletKeyIdentifier: "x509"`. Confirm with `WalletConfigurationVerify`.
- A WRPAC imported into the wallet: `WalletX509CSRCreate`, have the CSR signed by the
  WE BUILD access-certificate CA, then `WalletX509CertificateImport`. Check it with
  `WalletX509CertificateGet`. Without it the EUDI wallet refuses the request.
- **Company only:** for the notary's issuer check to work, the certificate's subject must
  identify the company — its organisation name and identifier should match the EBWOID's
  `name` and `id`.

### Company only

- The wallet holds a valid EBWOID (`CredentialList`, look for `vct: uri:eu.ebw.oid.1`;
  `CredentialGet` for its claims). If it is missing or expired, stop — the PoX's
  `represented_economic_operator` must come from it and nowhere else.

### Employee

- An EUDI wallet holding a PID of type `urn:eudi:pid:1` (or a domestic type extending it).

## Company — verifying the PID and issuing the PoX

Run steps 2–7 in one sitting with the employee present (in person or in an authenticated
session): the offer produced in step 5 must reach the same person whose PID was checked in
step 3.

### 1. Prepare

1. Read the EBWOID: note `id` and `name`, and confirm it is not expired.
2. Gather `employee_record`, `pox_scope` and `mandator`. Ask for anything missing — do not
   default faculties, limits or expiry. Check the mandator actually has authority to
   delegate (e.g. is a managing director) and say how you know.
3. Confirm `webuild_pox` and `pid_for_pox_issuance` exist with `IssuerCredentialTypesList`
   and `WalletGet`.

### 2. Request the PID

1. `VerifierInitUrlCreate` with `verifierId: "pid_for_pox_issuance"` and
   `createUrl: true`. Note the returned `state`.
2. Show the returned URL to the employee as a QR code (or a deep link on their device).
   Do not send it over WMP — the EUDI wallet is not a WMP peer.
3. Wait for `vp.verified` or `vp.invalid` on that state with `WalletNotifications`. On
   `vp.invalid`, report the reason and stop.

### 3. Check the PID

Read the result with `WalletVerifiedCredentialsByState(state)` and check, in order:

1. `vct` is `urn:eudi:pid:1` or within the `urn:eudi:pid:` namespace.
2. The signature chained to a PID provider on the trusted list, the credential is neither
   expired nor revoked, and the key-binding proof is valid — all covered by `vp.verified`
   with the `toVerify` above; confirm none of those checks was skipped.
3. `given_name`, `family_name` and `birthdate` match `employee_record`. On any mismatch,
   stop and report it — do not issue. A spelling or diacritic difference is for a human to
   resolve against the HR record, not for the workflow to paper over.

### 4. Build the PoX

Assemble the `credentialSubject`. Person data is copied from the **PID result**, byte for
byte — not from the HR record, even where they agree:

```json
{
  "credential": {
    "type": "power_of_attorney",
    "legal_category": "non-qualified-EAA"
  },
  "represented_economic_operator": {
    "identifier": { "scheme": "EBWOID", "value": "<EBWOID id>" },
    "legal_name": "<EBWOID name>"
  },
  "proxy": {
    "entity_type": "natural_entity",
    "natural_entity_proxy": {
      "given_name": "<PID given_name>",
      "family_name": "<PID family_name>",
      "birth_date": "<PID birthdate>",
      "nationality": ["<PID nationalities…>"]
    }
  },
  "authority": {
    "authority_source": "proxy_power_scope",
    "proxy_power_scope": {
      "type": "voluntary_representation",
      "grant_date": "<YYYY-MM-DD>",
      "expiration_date": "<YYYY-MM-DD>",
      "limitation": true,
      "faculty": ["<e.g. CONTRACTS>"],
      "cardinality": 1,
      "constraints": [
        { "type": "Economic", "description": "<e.g. Maximum transaction amount EUR 50000>" }
      ],
      "geographical_scope": ["<ISO 3166-1 alpha-2>"],
      "mandator": {
        "given_name": "<mandator given name>",
        "family_name": "<mandator family name>",
        "birth_date": "<YYYY-MM-DD>"
      },
      "service_access": [
        {
          "relying_party_name": "<notary office, if named>",
          "relying_party_id": "<its identifier>",
          "relying_party_services": ["<e.g. Notarial deed signing>"]
        }
      ],
      "evidence": {
        "uri": "<internal reference to the authorisation decision>",
        "description": "<e.g. Board resolution 2026-07>"
      },
      "assurance_level": "SUBSTANTIAL"
    }
  },
  "credential_metadata": {
    "binding": { "cryptographically_bound_to": "urn:eudi:pid:1" },
    "schema": {
      "id": "https://schemas.webuild.eu/power-of-x/v7",
      "version": "7.0.0"
    },
    "display": { "language": "en", "name": "WE BUILD Power of Attorney" },
    "policies": ["https://webuild.eu/policies/pox"]
  }
}
```

- Set `limitation: false` and omit `constraints` only for a general, unrestricted power —
  and confirm that is really intended.
- Leave `service_access` out if the power is not tied to particular relying parties.
- If `place_of_birth` or `personal_administrative_number` were requested and disclosed,
  copy them too (`birth_place` as the locality, or country if no locality is given).
- Do not set `iss`, `iat`, `exp`, `cnf`, `status` or `vct` — the wallet sets them.
  `authority.proxy_power_scope.expiration_date` and the draft's `expirationDate` must
  agree.
- Check the rulebook's integrity rules before issuing: one represented economic operator,
  one proxy, exactly one authority source.

### 5. Issue the PoX

1. `CredentialCreate` with `credentialDraftMetadata` `{ type:
   "https://credentials.webuild.eu/power-of-x/v7", format: "sd_jwt_vc", name: "WE BUILD
   Power of Attorney", expirationDate }` and the subject from step 4 → `credentialId`.
2. `CredentialIssuanceInit(credentialId, { issuerId: "webuild_pox" })` — **no `clientId`**;
   the EUDI wallet has no DID → `issuanceQueueItemId`.
3. `IssuerInitiateAuthOffer({ issuerId: "webuild_pox", issuanceQueueItemId })` → `offer`,
   `offerId`.
4. Show `offer` to the employee as a QR code straight away. Until redeemed it is a bearer
   token for the credential — do not email it or leave it lying in a chat.

### 6. Confirm

1. Wait for `offer.processed` on `offerId` with `WalletNotificationGetByState`.
2. Record, for audit, the PoX `credentialId` together with the PID verification `state` it
   was built from.
3. Decide with the user whether to keep the PID verification data
   (`WalletVerifiedCredentialsDeleteByState` removes it once the audit record exists).

### 7. Report

State who the PoX was issued to (from the PID), what power, until when, and that it is a
self-issued, non-qualified EAA signed with the company's access certificate.

### Revoking a PoX

When the employee leaves or the power is withdrawn, `CredentialRevoke` the PoX. The
notary's `verifyStatus` check then fails it. Do this before the expiration date, not
instead of setting one.

## Employee — receiving and presenting the PoX

Everything happens in the EUDI wallet; there are no Triveria tool calls on this side.

1. Scan the company's PID request QR and consent to sharing the listed PID attributes.
2. Scan the PoX offer QR and accept the credential. Check the wallet shows your name and
   the company correctly.
3. At the notary office, scan the notary's request QR. The wallet asks for **both** the PID
   and the PoX — consent to both in the same response. Refusing either fails the request.

## Notary office — verifying the PID and PoX together

### 1. Prepare

1. Establish `expected_company` from the deed, client file or business register. If the
   user cannot say which company the employee is supposed to represent, stop — there is
   nothing to check the PoX against.
2. Gather `notarial_act`.

### 2. Request the presentation

1. `VerifierInitUrlCreate` with `verifierId: "pid_and_pox"`. Note the `state`.
2. Show the URL to the employee as a QR code.
3. Wait for `vp.verified` or `vp.invalid` on that state via `WalletNotifications`. On
   `vp.invalid`, report which credential failed and stop.

### 3. Check

Read both credentials with `WalletVerifiedCredentialsByState(state)` and check, in this
order. Any failure is a refusal; report which check failed.

1. **Both present, both valid.** Both a PID and a PoX came back in this one response, each
   passed expiry, status (revocation) and key-binding checks. A PoX without a PID in the
   same response proves nothing about who is standing in front of you.
2. **PID issuer.** The PID chained to a PID provider on the trusted list and its `vct` is
   in the `urn:eudi:pid:` namespace.
3. **PoX issuer is the represented company.** This is the whole trust decision for a
   self-issued PoX:
   1. `represented_economic_operator.identifier.value` and `legal_name` equal
      `expected_company`.
   2. The access certificate that signed the PoX chained to the trusted list, and its
      subject identifies the **same** company. A PoX signed by any other organisation's
      certificate is not a power granted by the company, however well-formed. If the
      verification result does not expose the signer's certificate subject, report the
      issuer as **unconfirmed** — do not assume it.
   3. `legal_category` is `non-qualified-EAA` (or, if a QTSP issued it, `QEAA` — then
      check the issuer is that QTSP instead).
4. **Binding — same person.** Compare exactly, after nothing more than Unicode NFC
   normalisation:

   | PID | PoX |
   |---|---|
   | `given_name` | `proxy.natural_entity_proxy.given_name` |
   | `family_name` | `proxy.natural_entity_proxy.family_name` |
   | `birthdate` | `proxy.natural_entity_proxy.birth_date` |

   Also `proxy.entity_type` must be `natural_entity`. Any mismatch — including case,
   diacritics, an extra middle name — fails the binding. The company copied these values
   from a PID, so a mismatch means a different person or a PoX issued outside this
   workflow; it is for the notary to resolve by other means, not to accept.
5. **Scope.** `credential.type` is `power_of_attorney` with `authority_source:
   proxy_power_scope`, and the power covers `notarial_act`:
   1. Today is between `grant_date` and `expiration_date`.
   2. `faculty` covers the kind of act.
   3. Every entry in `constraints` is satisfied (e.g. value below the stated maximum).
   4. The act's country is in `geographical_scope`.
   5. If `service_access` is non-empty, this notary office is listed in it.
   6. If `limitation` is `false`, say explicitly that the power is general.

### 4. Report

- **Who** — the person, from the PID, and which PID provider attested them.
- **For whom** — the company, its EBWOID identifier, how `expected_company` was
  established, and whether the PoX signer's certificate matched it.
- **Binding** — the three attributes compared and the result.
- **What they may do** — type, faculties, constraints, geography and validity, and whether
  that covers the act at hand.
- **Caveat** — the PoX is a self-issued, non-qualified EAA: it proves the company's own
  statement, signed by the company, not an entry in a public register. Where national law
  requires a registered or notarial power of attorney for this act, the PoX alone is not
  sufficient.
