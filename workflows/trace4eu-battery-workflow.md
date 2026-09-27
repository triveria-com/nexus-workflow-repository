---
slug: trace4eu-battery-traceability
title: TRACE4EU battery materials traceability workflow
summary: >-
  Run the EBSI TRACE4EU battery materials traceability pilot end to end on the EBSI trust
  framework. An onboarding service provider issues the battery manufacturer a Catena-X
  Membership and Data Exchange Governance credential, and a Local Operating Unit issues its
  Legal Entity Identifier. The manufacturer presents all three to its Tier-1 supplier, which
  checks them before it releases anything. The supplier then presents a Catena-X PCF
  (urn:samm:io.catenax.pcf:9.0.0) credential that an accredited PCF auditor issued for its
  product. A certification body issues a Responsible Mining Certification to the mine, and
  the manufacturer verifies it directly with the mine. A due diligence provider issues a
  supply chain due diligence report. Finally the manufacturer issues a Battery Passport
  (Catena-X Battery Pass 5.0.0) for a battery serial number, referencing the evidence
  behind it, and any supply chain actor or consumer can verify it. Every issuer is an
  accredited Trusted Issuer in the EBSI Trusted Issuers Registry, and its accreditation is
  scoped to the one credential type it is allowed to issue.
questions:
  - id: role
    prompt: Which role are you acting in?
    required: true
    options: [manufacturer, supplier, mine, issuer, tao, passport_verifier]
    hint: >-
      "manufacturer" = the battery maker (ElectroVolt in the pilot). It holds its Catena-X
      and LEI credentials, verifies supplier PCFs and mining certifications, and issues the
      Battery Passport. "supplier" = the Tier-1 material supplier. It checks the
      manufacturer before releasing data and holds the audited PCF for its product. "mine"
      = the raw-material source that holds a Responsible Mining Certification. "issuer" =
      one of the accredited third parties (onboarding service provider, LEI issuer, PCF
      auditor, mining certification body, due diligence provider). "tao" = an accreditation
      organisation that accredits those issuers on EBSI. "passport_verifier" = a customer,
      recycler, market surveillance authority or consumer checking a Battery Passport.
  - id: credential_to_issue
    prompt: "Issuer or TAO: which credential do you issue, or accredit others to issue?"
    required: false
    options: [membership, data-exchange-governance, lei, pcf, rmc, due-diligence-report, battery-passport]
    hint: >-
      membership and data-exchange-governance = onboarding service provider (Catena-X).
      lei = Local Operating Unit (Bundesanzeiger Verlag in the pilot). pcf = PCF auditor
      (August&Sons). rmc = mining certification body (BIMA). due-diligence-report = due
      diligence provider (RCS Global). battery-passport = only a TAO accrediting a
      manufacturer asks this; the manufacturer issues passports under its own role.
  - id: network
    prompt: Which EBSI network are you on — pilot or conformance?
    required: false
    options: [pilot, conformance]
    hint: >-
      The registry URLs differ. On conformance the Root TAO gets its authorisation from the
      EBSI issuer mock. On pilot, EBSI support provides it as a signed JWT.
  - id: counterparty
    prompt: "Who are you exchanging with — their DID, BPNL, and a WMP connection or invitation URL?"
    required: false
    hint: >-
      Every business-to-business exchange here runs over WMP. The DID is the one the
      counterparty registered in the EBSI DID Registry. Get it from them through a channel
      other than the credential you are about to check, such as a contract, an onboarding
      pack or their website.
  - id: battery
    prompt: "Manufacturer: which battery is the passport for — serial number, model, chemistry, category, rated capacity (kWh), manufacturing plant and date?"
    required: false
    hint: >-
      The serial number is the passport's identifying claim. It is what the QR code on the
      battery resolves to and what a consumer checks. Give the plant as a BPNS/BPNA if you
      have one.
  - id: supply_chain
    prompt: "Manufacturer: which supplier parts go into this battery, and from which mines — for each part, the supplier's DID, part IDs, quantity per battery, and the mine's DID?"
    required: false
    hint: >-
      One PCF is requested per supplier part and one RMC per mine. The quantity per
      battery is needed to turn a supplier PCF (per declared unit) into a share of the
      battery's footprint. Do not guess it.
  - id: pcf_values
    prompt: "PCF auditor: what are the audited PCF figures and methodology — product, declared unit, PCF excluding/including biogenic uptake, fossil GHG, carbon content, reference period, standards, primary data share and data quality ratings?"
    required: false
    hint: >-
      These map onto the Catena-X PCF aspect model v9.0.0 (PCF Rulebook v4). Everything is
      per declared unit. Also give the attestation you are issuing it under: type (e.g.
      "PCF Program Certification" or product verification), standard, and completion date.
  - id: rmc_details
    prompt: "Certification body: what does the Responsible Mining Certification cover — mine name and site, minerals, scheme and version, assessment result, certificate ID and validity?"
    required: false
    hint: >-
      Name the actual scheme you assess against. The pilot calls it "Responsible Mining
      Certification" without naming a standard.
  - id: due_diligence
    prompt: "Due diligence provider: which report — report ID, date, the manufacturer and battery models or materials it covers, the framework it follows, its outcome, and where the document lives (URL and hash)?"
    required: false
    hint: >-
      The credential binds to the report document by hash. Ask for the document or its
      hash; never make one up.
  - id: expected_issuers
    prompt: "Verifier (any role): for each credential type you check, which issuer DID or which TAO do you accept, and how do you know?"
    required: false
    hint: >-
      EBSI tells you that an issuer is accredited somewhere in the trust chain. It does
      not tell you that it is the body you meant to rely on. Pin the issuer (or the TAO
      that accredited it) per credential type from the ecosystem's governance documents,
      not from the presentation.
---

# TRACE4EU battery materials traceability workflow

TRACE4EU is an EBSI pilot that uses verifiable credentials to make the data behind an EU
Battery Passport trustworthy. Every claim in the passport should trace back to a credential
signed by the party accountable for it. The carbon footprint traces to an audited supplier
PCF, the responsible sourcing claim to a certification the mine holds, and the due
diligence statement to a report from an independent provider. The pilot storyline
(<https://ebsi.eu/projects/trace4eu-battery-materials-traceability>) runs in four phases:

1. **Identity.** An onboarding service provider (OSP) issues the manufacturer a Catena-X
   Membership credential. A Local Operating Unit (LOU) issues its Legal Entity Identifier.
2. **PCF exchange.** The manufacturer presents those credentials to its Tier-1 supplier.
   The supplier checks them, and then an audited PCF credential flows to the manufacturer.
3. **Responsible mining.** A certification body issues a Responsible Mining Certification
   (RMC) to the mine, and the manufacturer verifies it.
4. **Battery Passport.** A due diligence provider issues a supply chain due diligence report.
   The manufacturer issues a Battery Passport that references the report and the evidence
   collected in phases 2–3. Anyone can then verify the passport by the battery's serial
   number.

| Credential | Issued by (pilot actor) | Held by | Presented to |
|---|---|---|---|
| Catena-X Membership | OSP | Manufacturer, supplier | Counterparty before data exchange |
| Data Exchange Governance | OSP | Manufacturer, supplier | Counterparty before data exchange |
| Legal Entity Identifier | LOU (Bundesanzeiger Verlag) | Manufacturer | Supplier |
| Catena-X PCF | PCF auditor (August&Sons) | Supplier | Manufacturer |
| Responsible Mining Certification | Certification body (BIMA) | Mine | Supplier, manufacturer |
| Supply chain due diligence report | Due diligence provider (RCS Global) | Manufacturer | Referenced from the passport; presented on request |
| Battery Passport | Manufacturer (ElectroVolt) | Manufacturer | Customers, recyclers, authorities, consumers |

## What EBSI adds, and what it does not

On EBSI every issuer is a **Trusted Issuer (TI)** registered in the Trusted Issuers
Registry (TIR). A **Trusted Accreditation Organisation (TAO)** accredited it, and a **Root
TAO (RTAO)** accredited the TAO in turn. The TRACE4EU pilot relies on exactly this. The
supplier "verifies ElectroVolt's legal entity identifier against the EBSI ledger", and the
manufacturer verifies the RMC the same way.

What the chain proves is *that the issuer is accredited*. What it proves it is accredited
*for* is the `accreditedFor` scope the TAO wrote into the accreditation. Two consequences
run through this workflow:

- **TAOs must scope accreditations.** Accrediting a TI with an empty `accreditedFor`
  (`base64("[]")`) lets it issue anything. A PCF auditor accredited that way could also
  issue LEIs. Scope every accreditation to the credential types that body is responsible
  for. See [TAO — accrediting issuers](#tao--accrediting-issuers).
- **Verifiers still pin issuers per credential type.** `vp.verified` tells you the issuer
  is on the TIR. It does not tell you that this is the auditor or certification body the
  ecosystem recognises for *this* credential type. Compare each issuer against
  `expected_issuers` as well. If the verification result does not show that the issuer's
  accreditation was checked, report the issuer as **unconfirmed** rather than assuming it.

## Why credentials go straight from holder to verifier

The pilot storyline has the mine present its RMC to the Tier-1 supplier, which "presents
it" on to the manufacturer. That relay cannot work with verifiable presentations. The RMC
is bound to the mine's DID (`credentialSubject.id`), so only the mine's wallet can produce
a valid presentation of it. A supplier forwarding it would fail key binding. Worse, it would
turn into a claim that the supplier saw something, not proof that the mine holds it.

So the supplier verifies the mine's RMC for its **own** due diligence, and it passes the
manufacturer an **introduction** (the mine's DID and a WMP invitation). The manufacturer
then requests the RMC from the mine directly. The same rule applies to every credential
here: whoever needs to rely on a credential gets it from its holder.

The same key binding explains how the Battery Passport is modelled. TRACE4EU calls the
battery serial number the passport's credential subject. On EBSI, `credentialSubject.id`
binds a credential to the key that can present it, and a battery has no key. The passport
therefore keeps the manufacturer's DID as `credentialSubject.id` and carries the serial
number as its identifying claim (`identification.serial`, `metadata.passportIdentifier`).
Verifiers look the passport up by that claim.

## Credential types

All credentials are `jwt_vc_vcdm` EBSI Verifiable Attestations. Every `credentialType`
starts `VerifiableCredential,VerifiableAttestation,…`, and presentation definitions match
on `$.vc.type` with `contains`. Call `IssuerCredentialTypesList` to see what a wallet has
before assuming any of these exist.

- **Catena-X Membership** — `MembershipCredential`. It attests membership of the Catena-X
  dataspace. Subject per CX-0050 v2.2.1 §2.1: `id` (holder DID), `memberOf`
  (`"catena-x"`) and `holderIdentifier` (the holder's BPNL). In Catena-X the core service
  provider (CSP-B) issues it at the end of onboarding (CX-0006 §2.6). The pilot has the OSP
  issue it, so here the OSP is the TI. Catena-X data offers require `Membership eq active`.
- **Data Exchange Governance** — `DataExchangeGovernanceCredential`. It attests the holder
  has signed the Catena-X data exchange framework agreement, which is the "data access
  rights" the pilot's supplier checks. Subject per CX-0050 §2.3: `id`, `holderIdentifier`
  (BPNL), `group: "UseCaseFramework"`, `useCase: "DataExchangeGovernance"`,
  `contractTemplate` (URL), `contractVersion` (`"1.0"`). It maps to the PCF data offer
  constraint `FrameworkAgreement eq DataExchangeGovernance:1.0` (CX-0136 §2.1.2.7.2).
- **Legal Entity Identifier** — `LegalEntityIdentifier`. It follows the WE BUILD LEI
  attestation rulebook (`rb-lei`): `lei` (ISO 17442, 20 characters), `lei_status` (one of
  `ISSUED`, `LAPSED`, `RETIRED`, …) and `lei_renewal_date` (ISO 8601). It must be issued by
  an accredited LOU on authoritative LOU data. GLEIF's Global LEI Index is an aggregate,
  not the authentic source. Rulebook:
  <https://github.com/webuild-consortium/webuild-attestation-rulebooks-catalog/blob/main/rulebooks/rb-lei/README.md>.
  The LEI and the BPNL are different identifiers, and nothing in either credential links
  them. The link between them is that both are issued to the **same DID**. See the
  supplier's binding check.
- **Catena-X PCF** — `CatenaXProductCarbonFootprint`. The PCF auditor issues it to the
  supplier. Its subject is `id` (the supplier's DID) plus the value-only payload of the
  Catena-X PCF aspect model `urn:samm:io.catenax.pcf:9.0.0`, calculated to the Catena-X
  PCF Rulebook v4 (CX-0136 v2.2.2). Model and example:
  <https://github.com/eclipse-tractusx/sldt-semantic-models/tree/main/io.catenax.pcf/9.0.0>.
  It differs from the IDTL/PACT `ProductCarbonFootprint` in `pcf-workflow.md` in two ways.
  It follows the Catena-X model, and it is issued *by the auditor*, as the pilot states,
  rather than self-issued with a separate conformity certificate. The auditor's attestation
  is part of the payload (`attestationOfConformance`) and its signature is on the credential.
- **Responsible Mining Certification** — `ResponsibleMiningCertification`. The
  certification body issues it to the mine. Subject: `id` (the mine's DID), `certificateId`,
  `mine` (`name`, `site`, `country`), `minerals` (array, e.g. `["cobalt", "lithium"]`),
  `scheme` (`name`, `version`), `assessmentResult`, `assessmentDate`. The pilot does not
  publish a schema. This is the minimum a verifier needs, so extend it only with fields
  your scheme defines.
- **Supply chain due diligence report** — `SupplyChainDueDiligenceReport`. The due
  diligence provider issues it to the manufacturer. Subject: `id` (the manufacturer's DID),
  `reportId`, `reportDate`, `scope` (`batteryModels`, `materials`), `framework` (e.g.
  `"Regulation (EU) 2023/1542 battery due diligence; OECD Due Diligence Guidance"`),
  `outcome`, `document` (`uri`, `sha256`). The credential binds to the report by hash and
  does not embed it.
- **Battery Passport** — `BatteryPassport`. The manufacturer issues it. Its subject is `id`
  (the manufacturer's DID) plus a Catena-X Battery Pass payload
  (`urn:samm:io.catenax.battery.battery_pass:5.0.0`), implementing Regulation (EU)
  2023/1542. This workflow fills `metadata`, `identification`, `operation`,
  `sustainability.carbonFootprint` and `conformity`, plus an `evidence` array that
  references the credentials the passport was built from. Model:
  <https://github.com/eclipse-tractusx/sldt-semantic-models/tree/main/io.catenax.battery.battery_pass/5.0.0>.

TRACE4EU requires credentials "in the approved data schema". On EBSI, that means a schema
registered in the Trusted Schemas Registry (TSR). Registering these schemas is the
ecosystem operator's job and is outside this workflow. Once a schema is registered, its TSR
ID goes into the matching accreditation's `accreditedFor.schemaId`.

## Trust chain

```
EBSI
└── RTAO (ecosystem root)
    ├── TAO: Catena-X ─────────── TI: OSP              → Membership, Data Exchange Governance
    │                    └─────── TI: PCF auditor      → Catena-X PCF
    ├── TAO: LEI governance ───── TI: LOU              → Legal Entity Identifier
    ├── TAO: mining scheme owner ─ TI: certification body → Responsible Mining Certification
    ├── TAO: due diligence ────── TI: DD provider      → Supply chain due diligence report
    └── TAO: battery authority ── TI: manufacturer     → Battery Passport
```

This tree maps the pilot's actors onto EBSI. Which real organisation acts as each TAO is
a governance decision for the ecosystem, not for this workflow. Ask the user, and do not
fill it in by assumption. In Catena-X, PCF auditors are Conformity Assessment Bodies that
the association nominates under the *PCF Verification and Certification Framework v2*.
That makes the Catena-X TAO the natural accreditor for them.

The manufacturer, supplier and mine all **onboard** (`TfOnboard`) so that their DIDs are
registered in the EBSI DID Registry. That registered DID is the identity every credential
here is bound to. Only issuers also need to be **accredited** (`TfAccreditAs`), and in this
workflow the manufacturer is one of them.

## Wallet configuration

These snippets are worked examples to adapt, not to load verbatim. All wallets share
the EBSI block below; this one uses **pilot** URLs. For conformance, replace
`api-pilot` with `api-conformance`, set `conformanceClientId` to
`https://api-conformance.ebsi.eu/conformance/v3/issuer-mock` on the RTAO, and set
`statusListSchema` to
`https://api-conformance.ebsi.eu/trusted-schemas-registry/v3/schemas/zrpwfYDBB5CcZweDGtFfvSb5xgMsFetkcCDGKPZAPwk4`.

```json
{
  "trustFramework": "EBSI",
  "walletKeyIdentifier": "did",
  "legalEntity": true,
  "EBSI": {
    "isOnboarded": false,
    "configuration": {
      "conformanceClientId": "",
      "authorization": "https://api-pilot.ebsi.eu/authorisation/v4",
      "didRegistry": "https://api-pilot.ebsi.eu/did-registry/v5",
      "mainSchema": "https://api-pilot.ebsi.eu/trusted-schemas-registry/v3/schemas/z3MgUFUkb722uq4x3dv5yAJmnNmzDFeK5UC8x83QoeLJM",
      "trustedIssuersRegistry": "https://api-pilot.ebsi.eu/trusted-issuers-registry/v5",
      "trustedSchemasRegistry": "https://api-pilot.ebsi.eu/trusted-schemas-registry/v3",
      "statusListSchema": ""
    }
  },
  "oidcRevision": { "oidc4vci": "Draft15", "oidc4vp": "Draft23" }
}
```

| Role | `credentialIssuers` | `credentialVerifiers` |
|---|---|---|
| OSP | `cx_membership`, `cx_data_exchange_governance` | none |
| LOU | `lei` | none |
| PCF auditor | `cx_pcf` | none |
| Certification body | `responsible_mining_certification` | none |
| Due diligence provider | `supply_chain_due_diligence_report` | none |
| TAO | none — uses the reserved `ebsi_issuer_authorization_to_onboard` and `ebsi_issuer_accreditation_to_attest` | none |
| Supplier | none | `cx_counterparty_identity`, `responsible_mining_certification` |
| Mine | none | none |
| Manufacturer | `battery_passport` | `cx_pcf_with_membership`, `responsible_mining_certification` |
| Passport verifier | none | `battery_passport` |

A wallet needs no entries to hold or present credentials. The supplier and the mine only
present, apart from the supplier's own checks.

### Issuer entries

Every entry uses `IssuanceQueue`: claims are gathered from the user and supplied for each
issuance. Each issuer's wallet carries only its own entries.

```json
{
  "credentialIssuers": [
    {
      "id": "cx_membership",
      "name": "Catena-X Membership",
      "credentialFormat": "jwt_vc_vcdm",
      "credentialIssuer": "IssuanceQueue",
      "credentialType": "VerifiableCredential,VerifiableAttestation,MembershipCredential"
    },
    {
      "id": "cx_data_exchange_governance",
      "name": "Catena-X Data Exchange Governance",
      "credentialFormat": "jwt_vc_vcdm",
      "credentialIssuer": "IssuanceQueue",
      "credentialType": "VerifiableCredential,VerifiableAttestation,DataExchangeGovernanceCredential"
    },
    {
      "id": "lei",
      "name": "Legal Entity Identifier",
      "credentialFormat": "jwt_vc_vcdm",
      "credentialIssuer": "IssuanceQueue",
      "credentialType": "VerifiableCredential,VerifiableAttestation,LegalEntityIdentifier"
    },
    {
      "id": "cx_pcf",
      "name": "Catena-X Product Carbon Footprint",
      "credentialFormat": "jwt_vc_vcdm",
      "credentialIssuer": "IssuanceQueue",
      "credentialType": "VerifiableCredential,VerifiableAttestation,CatenaXProductCarbonFootprint"
    },
    {
      "id": "responsible_mining_certification",
      "name": "Responsible Mining Certification",
      "credentialFormat": "jwt_vc_vcdm",
      "credentialIssuer": "IssuanceQueue",
      "credentialType": "VerifiableCredential,VerifiableAttestation,ResponsibleMiningCertification"
    },
    {
      "id": "supply_chain_due_diligence_report",
      "name": "Supply Chain Due Diligence Report",
      "credentialFormat": "jwt_vc_vcdm",
      "credentialIssuer": "IssuanceQueue",
      "credentialType": "VerifiableCredential,VerifiableAttestation,SupplyChainDueDiligenceReport"
    },
    {
      "id": "battery_passport",
      "name": "Battery Passport",
      "credentialFormat": "jwt_vc_vcdm",
      "credentialIssuer": "IssuanceQueue",
      "credentialType": "VerifiableCredential,VerifiableAttestation,BatteryPassport"
    }
  ]
}
```

### Verifier entries

A verifier ID can appear in more than one role's wallet. Paths start with `$.vc.` because
each credential arrives wrapped in a presentation.

`cx_counterparty_identity` (supplier) asks for the manufacturer's three identity
credentials in **one** presentation. That makes one wallet, and so one DID, answer for all
three.

```json
{
  "id": "cx_counterparty_identity",
  "name": "Catena-X membership, data exchange governance and LEI",
  "presentationDefinition": {
    "format": { "jwt_vc": { "alg": ["ES256"] }, "jwt_vp": { "alg": ["ES256"] } },
    "id": "cx_counterparty_identity_presentation",
    "input_descriptors": [
      {
        "id": "membership",
        "constraints": {
          "fields": [
            { "path": ["$.vc.type"], "filter": { "type": "array", "contains": { "const": "MembershipCredential" } } },
            { "name": "Member of", "path": ["$.vc.credentialSubject.memberOf"], "filter": { "type": "string", "const": "catena-x" } },
            { "name": "BPNL", "path": ["$.vc.credentialSubject.holderIdentifier"] }
          ]
        }
      },
      {
        "id": "data_exchange_governance",
        "constraints": {
          "fields": [
            { "path": ["$.vc.type"], "filter": { "type": "array", "contains": { "const": "DataExchangeGovernanceCredential" } } },
            { "name": "Contract version", "path": ["$.vc.credentialSubject.contractVersion"] },
            { "name": "BPNL", "path": ["$.vc.credentialSubject.holderIdentifier"] }
          ]
        }
      },
      {
        "id": "lei",
        "constraints": {
          "fields": [
            { "path": ["$.vc.type"], "filter": { "type": "array", "contains": { "const": "LegalEntityIdentifier" } } },
            { "name": "LEI", "path": ["$.vc.credentialSubject.lei"] },
            { "name": "LEI status", "path": ["$.vc.credentialSubject.lei_status"], "filter": { "type": "string", "const": "ISSUED" } },
            { "name": "LEI renewal date", "path": ["$.vc.credentialSubject.lei_renewal_date"] }
          ]
        }
      }
    ]
  }
}
```

`cx_pcf_with_membership` (manufacturer) asks for the PCF together with the supplier's
Membership. The Membership's BPNL is what lets the manufacturer check that the company named
in the PCF is the one presenting it.

```json
{
  "id": "cx_pcf_with_membership",
  "name": "Catena-X PCF with supplier membership",
  "presentationDefinition": {
    "format": { "jwt_vc": { "alg": ["ES256"] }, "jwt_vp": { "alg": ["ES256"] } },
    "id": "cx_pcf_with_membership_presentation",
    "input_descriptors": [
      {
        "id": "pcf",
        "constraints": {
          "fields": [
            { "path": ["$.vc.type"], "filter": { "type": "array", "contains": { "const": "CatenaXProductCarbonFootprint" } } },
            { "name": "Spec version", "path": ["$.vc.credentialSubject.scopeOfPcfForm[0].specVersion"], "filter": { "type": "string", "const": "urn:io.catenax.pcf:datamodel:version:9.0.0" } }
          ]
        }
      },
      {
        "id": "membership",
        "constraints": {
          "fields": [
            { "path": ["$.vc.type"], "filter": { "type": "array", "contains": { "const": "MembershipCredential" } } },
            { "name": "BPNL", "path": ["$.vc.credentialSubject.holderIdentifier"] }
          ]
        }
      }
    ]
  }
}
```

To pin the request to one supplier part, pass this as a `customQueries` fragment at
`$.input_descriptors[0].constraints.fields[-1]` in `VerifierInitUrlCreate`. PCF v9 wraps
each block in a single-element array, hence the `[0]` indices.

```json
{
  "name": "Product ID filter",
  "path": ["$.vc.credentialSubject.companyAndProductInformation[0].productInformation[0].productIds"],
  "filter": { "type": "array", "contains": { "const": "<PLACE THE SUPPLIER PRODUCT ID URN HERE!!!>" } }
}
```

`responsible_mining_certification` (supplier and manufacturer):

```json
{
  "id": "responsible_mining_certification",
  "name": "Responsible Mining Certification",
  "presentationDefinition": {
    "format": { "jwt_vc": { "alg": ["ES256"] }, "jwt_vp": { "alg": ["ES256"] } },
    "id": "responsible_mining_certification_presentation",
    "input_descriptors": [
      {
        "id": "rmc",
        "constraints": {
          "fields": [
            { "path": ["$.vc.type"], "filter": { "type": "array", "contains": { "const": "ResponsibleMiningCertification" } } },
            { "name": "Certificate ID", "path": ["$.vc.credentialSubject.certificateId"] },
            { "name": "Minerals", "path": ["$.vc.credentialSubject.minerals"] },
            { "name": "Scheme", "path": ["$.vc.credentialSubject.scheme"] },
            { "name": "Result", "path": ["$.vc.credentialSubject.assessmentResult"] }
          ]
        }
      }
    ]
  }
}
```

`battery_passport` (passport verifier). To pin a single battery, add the serial number
filter as a `customQueries` fragment at `$.input_descriptors[0].constraints.fields[-1]`:

```json
{
  "id": "battery_passport",
  "name": "Battery Passport",
  "presentationDefinition": {
    "format": { "jwt_vc": { "alg": ["ES256"] }, "jwt_vp": { "alg": ["ES256"] } },
    "id": "battery_passport_presentation",
    "input_descriptors": [
      {
        "id": "battery_passport",
        "constraints": {
          "fields": [
            { "path": ["$.vc.type"], "filter": { "type": "array", "contains": { "const": "BatteryPassport" } } }
          ]
        }
      }
    ]
  }
}
```

```json
{
  "name": "Battery serial filter",
  "path": ["$.vc.credentialSubject.identification.identification.serial"],
  "filter": { "type": "string", "const": "<PLACE THE BATTERY SERIAL NUMBER HERE!!!>" }
}
```

## Prerequisites — all roles

- A wallet with the EBSI block above. Confirm it with `WalletConfigurationVerify`, and get
  its DID with `WalletIdentifierGet`. Counterparties pin that DID, so it has to reach them
  through a channel other than the credentials themselves.
- **Onboarded** to the EBSI DID Registry (`TfOnboard`, using a
  `VerifiableAuthorisationToOnboard` received from a TAO). It writes to the ledger and can
  take around 30 seconds, so it is not a hung request.
- **Issuers and the manufacturer:** also accredited as `TrustedIssuer`, scoped to their
  credential type. See [TAO — accrediting issuers](#tao--accrediting-issuers).
- A WMP connection to each counterparty (`WmpEntityList`; otherwise
  `WmpCreateNewInvitation` and `WmpAcceptInvitation`). Every business-to-business exchange
  here uses WMP.

## Common procedure — issuing to a counterparty over WMP

Used by every issuer.

1. Confirm the issuer ID exists (`IssuerCredentialTypesList`) and that this wallet is
   accredited for the type. An EBSI issuer that is not accredited produces credentials
   that fail verification.
2. Establish who the recipient is **before** issuing. Each issuer does this in its own
   way (see below). The recipient's DID comes from that process. Never take it from the
   request asking for the credential.
3. `CredentialCreate` with `credentialDraftMetadata` (`type`, `format: "jwt_vc_vcdm"`,
   `name`, `expirationDate`) and the subject, where `credentialSubject.id` is the
   recipient's DID. This returns a `credentialId`.
4. `CredentialIssuanceInit(credentialId, { issuerId, clientId: <recipient DID> })`.
5. `IssuerInitiateAuthOffer({ issuerId, wmpEntityId })`. It returns 204 with no URL, and
   the recipient's wallet receives a `wmp.credential_offer` notification.
   Without WMP, use `IssuerInitiatePreauthOffer({ issuerId, clientId })` instead. It
   returns `offer` and `pin`. Deliver them over two separate channels, because together
   they are a bearer token for the credential.
6. Wait for `offer.processed` with `WalletNotificationGetByState` and report the result.
7. When the underlying fact stops being true (membership ends, LEI lapses, certificate is
   withdrawn, PCF is superseded), `CredentialRevoke`. Verifiers' status checks then fail
   the credential.

## Common procedure — receiving a credential

Used by the manufacturer, supplier and mine.

1. Wait for `wmp.credential_offer` (or accept an offer URL with
   `HolderOfferPassAuthInfo`). Then call `WmpClientProcessRequest(id, { type: "process" })`
   to get the `interactionId`.
2. Check the offer comes from the issuer you expected before accepting.
3. `HolderOfferProcessAfterConsent(interactionId, { pin? })`. Confirm with `CredentialList`.

## Common procedure — requesting and checking a presentation over WMP

Used by the supplier, the manufacturer and the passport verifier.

1. `VerifierInitUrlCreate({ verifierId, wmpEntityId, customQueries? })`, and note the
   returned `state`.
2. Wait for `vp.verified` or `vp.invalid` on that state with `WalletNotifications`. On
   `vp.invalid`, report which credential failed and stop.
3. Read the result with `WalletVerifiedCredentialsByState(state)` and, for every
   credential in it, check in this order:
   1. **Signature, expiry, status.** These are covered by `vp.verified`. Confirm none were
      skipped.
   2. **Issuer accreditation.** The issuer is a TI on the EBSI TIR. If the result does not
      show that this was checked, report the issuer as *unconfirmed*.
   3. **Right issuer for this type.** The issuer DID, or the TAO that accredited it, is the
      one in `expected_issuers` for this credential type. A valid PCF signed by the LOU is
      not a valid PCF.
   4. **Subject is the presenter.** `credentialSubject.id` equals the DID of the wallet
      that presented it, which is the WMP counterparty you requested from.
4. Then run the role-specific checks below.

## Common procedure — presenting on request

Used by the manufacturer, supplier and mine.

1. On `wmp.credential_verification_request`, call `WmpClientProcessRequest(id, { type:
   "process" })` to get the `interactionId` and `presentationCandidates`.
2. Check **who** is asking (the WMP entity) and **what** they are asking for before
   consenting. This is the moment private data leaves the wallet.
3. `HolderCredentialsPresentAfterConsent(interactionId, { credentialsToPresent })`.

## TAO — accrediting issuers

Accredit one issuer at a time, and scope the accreditation to its credential types. The
parent side runs in the TAO's wallet and the child side in the issuer's.

1. Establish the issuer's identity and its standing out of band, from the scheme's own
   records. For a PCF auditor that is its CAB nomination; for an LOU, its GLEIF
   accreditation. Get its DID from the issuer directly.
2. **Onboarding.** Call `TfOnboardRequest({ did, validUntil })`, then
   `IssuerInitiatePreauthOffer({ clientId: did, issuerId:
   "ebsi_issuer_authorization_to_onboard" })`. The child accepts the offer and runs
   `TfOnboard`.
3. **Accreditation.** Call `TfAccreditRequest({ did, type: "TrustedIssuer", accreditedFor,
   validUntil })`, then `IssuerInitiatePreauthOffer({ clientId: did, issuerId:
   "ebsi_issuer_accreditation_to_attest" })`. The child accepts (`HolderOfferPassAuthInfo`,
   `HolderOfferProcessAfterConsent` with the PIN) and runs `TfAccreditAs({ type:
   "TrustedIssuer" })`.
4. `accreditedFor` is a **base64-encoded JSON array**. Scope it to the credential type and
   its TSR schema. For a PCF auditor, for example:

   ```json
   [
     {
       "schemaId": "<TSR schema URL for CatenaXProductCarbonFootprint>",
       "types": ["VerifiableCredential", "VerifiableAttestation", "CatenaXProductCarbonFootprint"]
     }
   ]
   ```

   Only use `base64("[]")` (unrestricted) if the user explicitly asks for it, and say what
   it allows.
5. Keep `validUntil` no later than the underlying nomination or licence. Withdraw with
   `TfRevokeAccreditation` if it ends early.

The RTAO's own setup (its authorisation from the EBSI issuer mock on conformance, or a
signed JWT from EBSI support on pilot, then `TfAccreditAs({ type:
"RootTrustedAccreditationOrganisation" })`) happens once per ecosystem. It is out of scope
here unless the user asks.

## Issuer — phase 1–4 credentials

Follow [Common procedure — issuing to a counterparty over WMP](#common-procedure--issuing-to-a-counterparty-over-wmp).
What differs per issuer is how the recipient is established and what goes in the subject.

### Onboarding service provider — Membership and Data Exchange Governance

1. Run registration per CX-0006. Collect the company's legal name and full address, get
   its BPNL (or have one created), and verify its identity. Take its DID from that
   registration.
2. Issue `cx_membership`:
   `{ "id": "<DID>", "memberOf": "catena-x", "holderIdentifier": "<BPNL>" }`.
3. Once the company has agreed to the framework agreement, issue
   `cx_data_exchange_governance`:
   `{ "id": "<DID>", "holderIdentifier": "<BPNL>", "group": "UseCaseFramework",
   "useCase": "DataExchangeGovernance", "contractTemplate": "<URL of the agreement>",
   "contractVersion": "1.0" }`.
4. Issue the same pair to suppliers. The supplier's Membership is what the manufacturer
   binds a PCF to.

### LOU — Legal Entity Identifier

1. Look up the LEI in the LOU's own register, which is the authentic source; the GLEIF
   index is not. Refuse if `lei_status` is anything other than what the register currently
   says.
2. The rulebook allows key-binding the LEI to a wallet only if the wallet belongs to the
   entity the LEI identifies. Establish that before issuing. For example, the company's
   registration with the LOU names this DID, or the company presents its Catena-X
   Membership (verified with the steps in the supplier section) from the same DID.
3. Issue `lei`:
   `{ "id": "<DID>", "lei": "<20 chars>", "lei_status": "ISSUED", "lei_renewal_date":
   "<ISO 8601>" }`. Set `expirationDate` no later than `lei_renewal_date`.

### PCF auditor — Catena-X PCF

1. Gather `pcf_values`. Everything is per declared unit. Ask for anything missing, and
   never back-fill emissions figures.
2. Establish that the recipient DID belongs to the supplier whose product was audited.
   Verify its `MembershipCredential` from that DID, and compare `holderIdentifier` with
   the BPNL in `companyIds`.
3. Build the subject: `id` (the supplier's DID) plus the PCF v9 value-only payload. The
   required top-level blocks are `scopeOfPcfForm`, `companyAndProductInformation`,
   `pcfAssessmentAndMethodology`, `general`, `carbonContent` and
   `productLifeCycleStagesAndEmissions`. Also include `attestationOfConformance`, because
   it is this auditor's statement:

   ```json
   {
     "id": "<supplier DID>",
     "scopeOfPcfForm": [{ "partialFullPcf": "Cradle-to-gate", "specVersion": "urn:io.catenax.pcf:datamodel:version:9.0.0" }],
     "companyAndProductInformation": [{
       "companyInformation": [{ "companyName": "<supplier>", "companyIds": ["urn:<BPNL>"] }],
       "productInformation": [{
         "productNameCompany": "<name>",
         "productIds": ["urn:<supplier>:product-id:<id>"],
         "productDescription": "<description>",
         "productClassifications": ["<e.g. urn:gtin:…>"],
         "declaredUnitOfMeasurement": "kilogram",
         "declaredUnitAmount": 1.0,
         "productMassPerDeclaredUnit": 1.0
       }]
     }],
     "productLifeCycleStagesAndEmissions": [{
       "productionStage": [{
         "pcfExcludingBiogenicUptake": 0.0,
         "pcfIncludingBiogenicUptake": 0.0,
         "fossilGhgEmissions": 0.0,
         "biogenicCO2Uptake": 0.0,
         "biogenicNonCO2Emissions": 0.0,
         "landUseChangeGhgEmissions": 0.0,
         "landManagementBiogenicCO2Emissions": 0.0,
         "landManagementBiogenicCO2Removals": 0.0,
         "aircraftGhgEmissions": 0.0
       }],
       "packagingStage": [{ "packagingEmissionsIncluded": false }],
       "distributionStage": [{ "distributionStageIncluded": false }]
     }],
     "carbonContent": [{ "carbonContentTotal": 0.0, "fossilCarbonContent": 0.0, "biogenicCarbonContent": 0.0, "recycledCarbonContent": 0.0, "packagingBiogenicCarbonContent": 0.0 }],
     "pcfAssessmentAndMethodology": [{
       "pcfMethodology": [{
         "standards": [{ "crossSectoralStandards": ["ISO 14067"], "productOrSectorSpecificRules": ["<PCR URN>"] }],
         "gwpCharacterizationFactorDetails": [{ "ipccCharacterizationFactors": "AR6" }],
         "allocationInForeground": [{ "allocationRulesDescription": "In accordance with Catena-X PCF Rulebook", "allocationRecycledCarbon": "<…>", "allocationWasteIncineration": "<…>" }],
         "massBalancingInformation": [{ "massBalancingUsed": false }]
       }],
       "dataSourcesAndQuality": [{ "primaryDataShare": 0.0, "secondaryEmissionFactorSources": ["<e.g. ecoinvent 3.10>"], "technologicalDQR": 0, "geographicalDQR": 0, "temporalDQR": 0 }],
       "pcfAssessmentInformation": [{
         "idAndVersion": [{ "id": "<UUID>", "version": 0, "status": "Active", "retroOrProspectivePcfType": "Retrospective PCF" }],
         "time": [{ "created": "<ISO>", "referencePeriodStart": "<ISO>", "referencePeriodEnd": "<ISO>", "validityPeriodStart": "<ISO>", "validityPeriodEnd": "<ISO>" }],
         "geography": [{ "geographyCountry": "<ISO 3166-1 alpha-2>" }],
         "boundarySpecifications": [{ "exemptedEmissionsPercent": 0, "exemptedEmissionsDescription": "<…>" }],
         "technology": [{ "boundaryProcessesDescription": "<…>", "ccsTechnologicalCO2CaptureIncluded": false }]
       }],
       "verificationAndCertificationShares": [{ "productVerificationShare3rdParty": 0.0, "productVerificationShare2ndParty": 0.0, "productVerificationShare1stParty": 0.0, "programCertificationShare": 0.0 }]
     }],
     "attestationOfConformance": [{
       "attestationOfConformanceId": "<UUID>",
       "attestationType": "<e.g. PCF Program Certification>",
       "attestationStandard": "PCF Verification and PCF Program Certification Framework V2",
       "standardName": "Catena-X Product Carbon Footprint Rulebook v4",
       "providerName": "<auditor legal name>",
       "providerId": "<auditor BPNL>",
       "completedAt": "<ISO>",
       "attestationOfConformanceLink": "<link to the audit record>"
     }],
     "general": [{ "pcfLegalStatement": "<…>" }]
   }
   ```

   The zeros are placeholders showing the shape. Issue only the values the audit
   produced. Check the payload against `Pcf-schema.json` in the model repository before
   issuing.
4. Set `expirationDate` equal to `validityPeriodEnd`. When the supplier recalculates,
   issue a new PCF with a new `version` and the old `id` in `precedingPfIds`, then revoke
   the old one.

### Certification body — Responsible Mining Certification

1. Take the mine's DID from its certification file, not from the offer request.
2. Issue `responsible_mining_certification` with the subject described under
   [Credential types](#credential-types), filled from `rmc_details`. Set
   `expirationDate` to the certificate's expiry.
3. Revoke on suspension or withdrawal. A revoked RMC is the signal the rest of the chain
   depends on.

### Due diligence provider — supply chain due diligence report

1. Gather `due_diligence`. Compute `document.sha256` over the final report file, or ask
   for it; never invent it.
2. Issue `supply_chain_due_diligence_report` to the manufacturer's DID.
3. Tell the manufacturer the credential `id`. The Battery Passport references it.

## Manufacturer

### Phase 1 — obtain identity credentials

1. Register with the OSP and receive `MembershipCredential` and
   `DataExchangeGovernanceCredential`, following
   [Common procedure — receiving a credential](#common-procedure--receiving-a-credential).
2. Request the LEI attestation from the LOU and receive `LegalEntityIdentifier` the same
   way.
3. Check all three have the wallet's DID as `credentialSubject.id`, and that
   `holderIdentifier` in both Catena-X credentials is the company's BPNL.

### Phase 2 — present identity, then obtain supplier PCFs

For each supplier part in `supply_chain`:

1. When the supplier asks, present Membership, Data Exchange Governance and LEI in one
   response ([Common procedure — presenting on request](#common-procedure--presenting-on-request)).
   Present only to a supplier in `supply_chain`.
2. Request the PCF with `cx_pcf_with_membership`, with `wmpEntityId` set to the supplier
   and the product ID filter set to that part
   ([Common procedure — requesting and checking a presentation over WMP](#common-procedure--requesting-and-checking-a-presentation-over-wmp)).
3. Check, in addition:
   1. The PCF's issuer is an accepted PCF auditor from `expected_issuers`, and its
      `attestationOfConformance[0].providerName` names that same auditor.
   2. **Binding.** The Membership's `holderIdentifier` (BPNL) appears in the PCF's
      `companyInformation[0].companyIds`, and both credentials have the supplier's DID as
      `credentialSubject.id`. This check turns "a PCF" into "this supplier's PCF".
   3. `productIds` contains the part you asked for, `status` is `Active`, and today is
      inside `validityPeriodStart`–`validityPeriodEnd`.
   4. `specVersion` is `urn:io.catenax.pcf:datamodel:version:9.0.0`. A v7 figure was
      calculated to Rulebook v3 and is not comparable.
4. Record per part: the PCF credential `id`, `pcfExcludingBiogenicUptake`, declared unit,
   primary data share, and the auditor.

If a supplier refuses, or a PCF fails any check, stop for that part and say which check
failed. A battery footprint with a missing part is incomplete, not smaller.

### Phase 3 — verify responsible mining

For each mine in `supply_chain`:

1. Get the mine's DID and a WMP invitation from the supplier. That is an introduction, not
   evidence. Connect with `WmpAcceptInvitation`.
2. Request `responsible_mining_certification` from the mine directly over WMP, and run the
   common checks. The issuer must be an accepted certification body.
3. Also check that `minerals` covers the material the supplier sources from this mine, and
   that `assessmentResult` is a pass under the named scheme.
4. Record the RMC credential `id`, its scheme and its expiry.

### Phase 4 — issue the Battery Passport

1. Receive the `SupplyChainDueDiligenceReport` from the due diligence provider, and check
   it covers this battery model and its materials.
2. Gather `battery`.
3. **Carbon footprint.** The Battery Pass `carbonFootprint` is a figure for the battery in
   kg CO₂e per kWh, calculated with the methodology Regulation (EU) 2023/1542 prescribes.
   Supplier PCFs are cradle-to-gate inputs per declared unit. They feed that calculation
   (PCF × quantity per battery) but are not the answer. Take the battery figure and its
   performance class from the user's calculation. For each input, say which audited PCF it
   came from and which parts of the battery are not covered by one.
4. Build the subject. `id` is the manufacturer's DID, followed by the Battery Pass 5.0.0
   blocks. Link every claim that rests on third-party evidence to the credential it came
   from:

   ```json
   {
     "id": "<manufacturer DID>",
     "metadata": {
       "passportIdentifier": "urn:uuid:<UUID>",
       "version": "1.0.0",
       "status": "approved",
       "issueDate": "<YYYY-MM-DD>",
       "expirationDate": "<YYYY-MM-DD>",
       "economicOperatorId": "<manufacturer BPNL>"
     },
     "identification": {
       "identification": { "serial": [{ "key": "partInstanceId", "value": "<battery serial>" }] },
       "category": "<e.g. EV>",
       "chemistry": "<e.g. NMC>"
     },
     "operation": {
       "manufacturer": { "manufacturer": "<manufacturer BPNL>", "facility": [{ "facility": "<BPNS/BPNA>" }], "manufacturingDate": "<YYYY-MM-DD>" }
     },
     "sustainability": {
       "carbonFootprint": [{
         "lifecycle": "main product production",
         "type": "Climate Change Total",
         "value": 0.0,
         "unit": "kg CO2 / kWh",
         "performanceClass": "<class>",
         "manufacturingPlant": [{ "facility": "<BPNS/BPNA>" }],
         "declaration": [{ "contentType": "URL", "header": "Carbon footprint declaration", "content": "<URL>" }]
       }],
       "status": "original"
     },
     "conformity": {
       "dueDiligencePolicy": [{ "contentType": "URL", "header": "Supply chain due diligence report", "content": "<DD report credential id>" }]
     },
     "evidence": [
       { "type": "CatenaXProductCarbonFootprint", "id": "<PCF credential id>", "issuer": "<auditor DID>", "product": "<supplier product ID>" },
       { "type": "ResponsibleMiningCertification", "id": "<RMC credential id>", "issuer": "<certification body DID>", "mine": "<mine DID>" },
       { "type": "SupplyChainDueDiligenceReport", "id": "<DD report credential id>", "issuer": "<DD provider DID>" }
     ]
   }
   ```

   `metadata.status` is one of `draft`, `approved`, `invalid` or `expired`, and
   `identification.category` is one of `SLI`, `LMT`, `EV`, `industrial`, `portable` or
   `incorporated`. Validate against `BatteryPass-schema.json` in the model repository
   before issuing. Fill the remaining blocks (`characteristics`, `performance`,
   `materials`, `safety`, `handling`) only from data the user provides.
5. If any evidence item is missing, expired, revoked, or failed its checks, stop and report
   it. Do not issue a passport that silently leaves it out.
6. Self-issue against `battery_passport`: `CredentialCreate`, then
   `CredentialIssuanceInit` with `clientId` set to the wallet's own DID, then
   `IssuerInitiatePreauthOffer` for that DID, and accept it into the same wallet
   (`HolderOfferPassAuthInfo`, `HolderOfferProcessAfterConsent`).
7. **Make it reachable by serial number.** For relying parties with a verifier wallet,
   present it on request (`battery_passport` with the serial filter). For anonymous
   consumers, publish it as a Linked VP (`HolderLinkedVpCreate`, with a presentation
   definition matching `BatteryPassport` and the serial number) and encode the resolvable
   reference in the battery's QR code. If `HolderLinkedVpCreate` is refused for this
   wallet's DID method, say so. Consumer access then needs a hosted verification page,
   which is outside this workflow.
8. Report the passport `id`, the serial number, and the evidence it references.

## Supplier

### Phase 1 — obtain identity credentials

Receive `MembershipCredential` and `DataExchangeGovernanceCredential` from the OSP.

### Phase 2 — check the manufacturer, then release the PCF

This is the Catena-X access policy `Membership eq active AND FrameworkAgreement eq
DataExchangeGovernance:1.0`, enforced with credentials:

1. Request `cx_counterparty_identity` from the manufacturer over WMP and run the common
   checks. Then check:
   1. `memberOf` is `catena-x`, and the Membership and Data Exchange Governance
      credentials carry the **same** `holderIdentifier` (BPNL).
   2. `lei_status` is `ISSUED` and `lei_renewal_date` is in the future.
   3. **Binding.** All three credentials have the same `credentialSubject.id`, the DID of
      the wallet that answered. That is what ties the LEI to the BPNL.
   4. The LEI and BPNL are the ones in your customer master data for this manufacturer.
2. If any check fails, refuse and say which one. Do not present the PCF.
3. When the manufacturer requests the PCF, check that the request comes from **the same
   WMP entity** you just verified. Then present the `CatenaXProductCarbonFootprint` for
   the requested part together with your own `MembershipCredential`
   ([Common procedure — presenting on request](#common-procedure--presenting-on-request)).
   Present only the part asked for.

### Phase 3 — responsible sourcing

1. Request `responsible_mining_certification` from each mine you source from, and verify
   it for your own records (the manufacturer's checks in Phase 3 apply).
2. Give the manufacturer an introduction to each mine: the mine's DID and a WMP invitation
   URL the mine created for it. Do not forward the mine's credential. See
   [Why credentials go straight from holder to verifier](#why-credentials-go-straight-from-holder-to-verifier).

## Mine

1. Receive the `ResponsibleMiningCertification` from the certification body.
2. Create a WMP invitation (`WmpCreateNewInvitation`) for each downstream party your
   supplier introduces, and send it to them through the supplier.
3. Present the RMC to the supplier and to the manufacturer when each asks
   ([Common procedure — presenting on request](#common-procedure--presenting-on-request)).
   Check the requester is a party you were introduced to.

## Passport verifier — checking a Battery Passport

1. Take the serial number from the battery (label or QR code). Establish which
   manufacturer DID should have signed its passport, from the manufacturer's own site or
   the seller, and say which.
2. Get the passport. With a verifier wallet and a WMP connection to the manufacturer,
   request `battery_passport` with the serial filter
   ([Common procedure — requesting and checking a presentation over WMP](#common-procedure--requesting-and-checking-a-presentation-over-wmp)).
   Otherwise, verify the published Linked VP with `VerifierLinkedVpVerify`.
3. Check:
   1. The issuer is the expected manufacturer and is an accredited TI for
      `BatteryPassport`.
   2. The serial number in the passport is the one on the battery.
   3. The passport is neither expired nor revoked, and `metadata.status` is `approved`.
4. The `evidence` entries are references. A passport verifier sees the credential IDs and
   issuers, not the credentials themselves: PCFs and RMCs are presented only to the
   manufacturer. Report these claims as *attested by the manufacturer, with evidence from
   <issuer>*, not as values the verifier checked independently. An authority that needs
   more asks the manufacturer, which requests re-presentation from the holders.
5. Report: the battery (serial, model, chemistry), who issued the passport and whether its
   accreditation was confirmed, the carbon footprint figure and class, the due diligence
   report it cites, and which of these the check actually established.

## Reporting — every role

State for each credential you checked: its type, who signed it, whether the issuer's EBSI
accreditation was confirmed, whether that issuer is the one you expected for this type
(and how you knew), and the outcome of each binding check. "Verified on EBSI" on its own
says only that the signer is on the list. It does not say the signer was the right party,
or that the credentials in a presentation belong together.
