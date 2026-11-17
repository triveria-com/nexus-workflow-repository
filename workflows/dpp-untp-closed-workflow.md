---
slug: dpp-untp-closed
title: "Digital Product Passport (DPP) on UNTP: closed ecosystem with a Nexus registrar"
summary: >-
  The DPP supply chain on the UNTP trust framework, for demos and closed ecosystems where
  one Nexus registrar wallet anchors every party. The registrar is set up first and saves,
  per role, a member wallet template that already lists its own DID in the wallet's
  UNTP.trustedRegistrars, so every member wallet created from it trusts that registrar
  without the wallet deployment knowing about it. The registrar then enrolls each member:
  it registers the member's did:web DID, sends it a Digital Identity Anchor (DIA) offer,
  and the member onboards with it. From then on the parties carry UNTP Digital Product
  Passports along the supply chain as in the NOOP workflow: suppliers publish DPPs and hold
  Digital Conformity Credentials (DCCs), the manufacturer verifies them, accepts invoices
  over WMP and publishes its own DPP and Make records, and a buyer verifies the product and
  traces its components. Every member wallet refuses anything signed by a DID that its
  registrar has not anchored, and checks before every step that it still trusts that
  registrar. For an open ecosystem whose registrars come from the wallet deployment's
  registry, use dpp-untp-registry; without any trust list, dpp-supply-chain.
questions:
  - id: role
    prompt: Which role are you acting in?
    required: true
    options: [registrar, supplier, manufacturer, assessment body, buyer, owner]
    hint: >-
      "registrar" = the party that runs the closed ecosystem: it sets up the member wallet
      templates and enrolls every other party with a Digital Identity Anchor. "supplier" =
      a component maker that publishes a DPP, holds DCCs (published or private), and
      invoices the manufacturer. "manufacturer" = the company building a product from
      supplier components, publishing its own DPP and Make records, and holding its own DCC
      (published or private). "assessment body" = issues the DCCs; in this workflow it only
      needs to be enrolled, because DCCs it signs verify only once it is anchored. "buyer" =
      a business buying the manufacturer's product, which verifies its DPP and DCC and
      traces what it is made of. "owner" = whoever ends up with the finished product and
      wants to check its public data.
  - id: registrar_did
    prompt: "Every role except registrar: what is the DID of the registrar that runs this ecosystem, and how did you get it?"
    required: false
    hint: >-
      The registrar's own did:web DID, as WalletIdentifierGet reports it on the registrar's
      wallet. It is the one trust decision every member makes, so it has to come from the
      registrar directly (the member wallet template it handed out, its website, an
      onboarding pack), never from a credential or a DIA offer. In a demo where one Nexus
      account owns every wallet, read it from the registrar wallet itself.
  - id: product
    prompt: "Supplier or manufacturer: what is the product: name, product ID, identifier scheme, category, the facility and country it is produced in, and the batch or lot it covers?"
    required: false
    hint: >-
      UNTP 0.7.0 requires `id`, `name`, `idScheme`, `idGranularity` (`model`, `batch` or
      `item`), `productCategory` (e.g. a UN CPC code), `producedAtFacility` and
      `countryOfProduction` on every passport. A passport covers a batch, not a single item,
      unless you say otherwise. Give the product ID as a URI (e.g. `urn:gtin:…` or the
      product's resolver URL) so it can be matched against a bill of materials and a Make
      record.
  - id: passport_claims
    prompt: "Supplier or manufacturer: what does the passport need to carry: origin, materials, footprint, performance claims?"
    required: false
    hint: >-
      Everything in a DPP is public. If a claim is independently assessed, link the DCC that
      backs it in that `performanceClaim`'s `evidence` rather than restating the assessment.
      Say, per DCC, whether it may be published as a UNTP `dcc` link or must stay private
      (disclosed over WMP on request only). Decide this before the DPP is issued: a
      published DCC is linked by its public URL, a private one by its `id`.
  - id: bom
    prompt: "Manufacturer: which supplier products from your bill of materials go into this product? For each, give the product ID, batch, quantity and the supplier's DID."
    required: false
    hint: >-
      One entry per supplier product. Each one gets its DPP verified, and each one gets its
      own Make record once your product passport is issued. The supplier's DID is also its
      `expected_issuer`, so say where you got it.
  - id: conformance_claims
    prompt: "Manufacturer or buyer: which claims do you need independently backed by a Digital Conformity Credential?"
    required: false
    hint: >-
      Manufacturer: the supplier claims your own passport derives figures from. Buyer: the
      manufacturer's product claims your purchase decision depends on. A published DCC is
      fetched from the holder's DID document with no consent needed. A private one is a
      separate WMP exchange the holder has to consent to.
  - id: invoice_details
    prompt: "Supplier: invoice number, issue date, seller and buyer registration/VAT details, amount due, VAT amount and currency. Do you have the underlying invoice document to hash?"
    required: false
    hint: >-
      These follow WEBUILD's `eu.we-build:einvoice:1` eInvoice attestation and its SD-JWT
      data schema: EN 16931 fields carried as SD-JWT VC claims, with `seller` and `buyer`
      as objects (`name`, `identifier.euid`, `vat`, `country`) and amounts as decimal
      strings. The credential binds to the invoice document by
      `invoicePayloadHash`. Never compute or invent this hash yourself from nothing. Ask
      for the document or the hash.
  - id: make_event
    prompt: "Manufacturer: where and when was the product made: facility, date, and the activity classification?"
    required: false
    hint: >-
      A UNTP `MakeEvent` requires `eventDate`, `activityType` (a classification: `code`,
      `name`, `schemeId`, `schemeName`, e.g. a GS1 CBV business step) and `madeAtFacility`
      (`id` and `name`), alongside the input (supplier) product and output (your) product.
      Ask rather than guess.
  - id: expected_issuer
    prompt: "Which DID do you expect to have signed each credential you are checking, and how do you know it?"
    required: false
    hint: >-
      The registrar's anchor tells you who a DID is registered as; this tells you it is the
      counterparty you deal with. A supplier DPP's issuer is the supplier. A DCC's issuer is
      the assessment body. The product DPP's and Make records' issuer is the manufacturer.
      Source each from the counterparty itself, a contract, or the registrar's list of
      enrolled members. Never take it from the credential you are checking, or from the DID
      document that links to it.
---

# Digital Product Passport (DPP) on UNTP: closed ecosystem with a Nexus registrar

This is the DPP supply chain workflow on the **UNTP trust framework**, in its closed
flavor: **one registrar, run in Nexus, anchors every party**, and every member wallet
trusts that registrar because its own configuration says so (`UNTP.trustedRegistrars`).
Nothing has to be configured on the wallet deployment, which makes it the flavor for demos
and for closed ecosystems (a pilot, a consortium, one company's suppliers). For an open
ecosystem whose registrars are published in the deployment's registry, use the
`dpp-untp-registry` workflow instead.

It runs in two phases:

1. **Setting up the ecosystem** (registrar, then every member). The registrar creates its
   wallet, saves a **member wallet template** per role that already lists its DID as a
   trusted registrar, and **enrolls** each member: the member's wallet is created from that
   template, the registrar registers its DID and sends it a Digital Identity Anchor (DIA)
   offer, and the member onboards with it.
2. **The supply chain**, once every party that signs or presents anything is anchored.

A Digital Product Passport follows a product through the hands that make and assemble it.
This workflow implements it the way the UN Transparency Protocol (UNTP) does: every party
issues its own credentials and publishes them as **UNTP links** in its DID document, and
anyone downstream resolves the DID and verifies what it links to. It has three
interactions between a supplier and a manufacturer, a fourth between the manufacturer and
a buyer, and an optional public check by the end owner:

1. **Manufacturer verifies each supplier's DPP**, for every supplier product on its bill of
   materials. It then **fetches the Digital Conformity Credentials (DCCs)** it needs: from
   the supplier's DID document where the supplier published them, otherwise by requesting
   them over WMP.
2. **Supplier issues an invoice** to the manufacturer over WMP.
3. **Manufacturer publishes its own DPP** and, for every supplier product, a **Digital
   Traceability Event (DTE)**: a UNTP Make record stating that the supplier product was
   used to make the manufacturer's product.
4. **Buyer verifies the manufacturer's DPP and DCC**. The DPP is read from the
   manufacturer's DID document. The DCC is read there too if published, otherwise
   requested over WMP. The buyer then follows the Make records to the supplier DPPs to
   learn what the product is made of.

What is public and what is private:

| Credential | Issued by | Held by | Public? | How it travels |
|---|---|---|---|---|
| Supplier DPP | Supplier (no holder) | Supplier | Yes | `dpp` link in the supplier's DID document |
| Supplier DCC | Assessment body | Supplier | Holder's choice | `dcc` link in the supplier's DID document if public; otherwise WMP presentation to the manufacturer, on request |
| Invoice | Supplier | Manufacturer | No | WMP offer |
| Product DPP | Manufacturer (no holder) | Manufacturer | Yes | `dpp` link in the manufacturer's DID document |
| Make record (DTE) | Manufacturer (no holder) | Manufacturer | Yes | `dte` link in the manufacturer's DID document |
| Manufacturer DCC | Assessment body | Manufacturer | Holder's choice | `dcc` link in the manufacturer's DID document if public; otherwise WMP presentation to the buyer, on request |

Whether a DCC is public is decided per credential by its holder. When it is published,
fetch it from the holder's DID document: that needs no WMP connection and no consent
round-trip. Fall back to a WMP request only when it is not published.

Private credentials are only ever presented to the next party downstream: private supplier
DCCs reach the manufacturer, and a private manufacturer DCC reaches the buyer. The buyer
never gets a supplier's private DCC. What it learns about the components comes from their
public DPPs and any supplier DCCs the supplier chose to publish.

## The trust model of this flavor

UNTP's answer to "who is this DID" is a **Digital Identity Anchor (DIA)**: a credential
from a registrar binding the DID to a registered identity (a register, the member's ID in
it, its name and the recognition scopes the registrar grants). A wallet whose
`trustFramework` is `UNTP` checks it for you: it refuses to verify anything signed by a DID
that is not anchored by a DIA chained to a registrar it trusts. Here that is the registrar
in its own `UNTP.trustedRegistrars`. The deployment's registrars (`untp.dia.trustedRegistrars`,
`untp.dia.registryUrl`) are trusted too, if the deployment has any, but the wallet's own
take precedence and this workflow relies on nothing else.

What that gives you, and what it does not:

- A credential that verifies on a member wallet was signed by a DID the registrar
  enrolled. `VerifierDidVerify` (with `credentialType`, e.g. `DigitalProductPassport`, for
  the issuer policy) and the `issuer` member of `VerifierUntpResolve` report the anchor:
  `trusted`, the `failures` if not, and under `untp` the `registrar`, the member's
  `registrations` and the `chain` of DIAs.
- It does not tell you the DID is the counterparty you contracted with. Compare the
  registered identity with the one you expect, and the credential's `issuer` with
  `expected_issuer` where you have one.
- Everything rests on `registrar_did`. A member wallet that lists a different DID trusts a
  different ecosystem, so every member checks it before every step (see **Trust check**).
- Revoking a member's DIA makes everything it signed stop verifying on every member wallet,
  including what it published before.

## How the wallet publishes and reads UNTP credentials

- **Format.** Every UNTP credential here is a W3C VCDM 2.0 credential (`jwt_vc_vcdm`)
  whose `@context` is `https://www.w3.org/ns/credentials/v2` followed by
  `https://vocabulary.uncefact.org/untp/0.7.0/context/`, signed as a VC-JOSE-COSE JWT
  (`application/vc+jwt`). UNTP 0.7.0 is the newest context the wallet bundles.
- **Issuing your own.** A DPP and a Make record are issued with no holder:
  `CredentialCreate` makes the draft, and `CredentialIssueDirect` signs it and, with
  `publish`, publishes it in the same call. There is no offer to yourself and no
  acceptance step.
- **Publishing.** A published credential is served, as it was signed and without
  authentication, at `https://<wallet host>/api/v1/<wallet_id>/vc/<credential_id>`. The
  wallet's DID document gets a service of the link type whose endpoint points at that URL:
  `dpp` for a DPP, `https://test.uncefact.org/vocabulary/link-type/dcc` for a DCC, and
  `https://test.uncefact.org/vocabulary/link-type/dte` for a DTE. `UntpLinkPublish`
  publishes a credential the wallet already holds, `UntpLinkList` lists what is
  published, and `UntpLinkDelete` withdraws one.
- **Who can publish.** Only a wallet with a self-hosted `did:web` can carry links. A UNTP
  wallet always gets one. Only an issued, valid VCDM credential can be published, so a DCC
  in another format (e.g. SD-JWT VC) stays private.
- **Everything published is public in full.** Never publish a credential that carries
  anything private.
- **Reading.** `VerifierUntpResolve` resolves a DID into the linkset its DID document
  advertises. With `fetch=true` and a `linkType` (e.g. `dpp`, `dcc`, `dte`), it fetches and
  verifies every linked credential of that type. `VerifierCredentialVerify` with `{"url":
  "<public URL>"}` verifies one credential by its URL, for a link found inside another
  credential. Both check the signature, validity dates, status, the JSON-LD document and
  the credential's schema. A credential that fails still returns `200`: read `verified`
  (or `verification.ok`) and the error `code` (`revoked`, `expired`, `schema_invalid`,
  `jsonld_invalid`, `signature_invalid`, …).
- **Revoking.** A revoked credential **stays published**: a reader following an old link
  finds it and sees it is revoked. To replace a passport, issue the new one, revoke the
  old one (`CredentialRevoke`), and remove its link (`UntpLinkDelete`) only if it should
  no longer be found at all.
- **What the wallet adds.** The wallet sets `issuer`, `validFrom`, the status entry and,
  when the deployment names its software, `issuingSoftware`. Leave them out of the draft.
- **Terms.** The JSON-LD check refuses a term the UNTP 0.7.0 context does not define.
  Use the schema's names exactly (e.g. `idGranularity`, not `identificationGranularity`).

## Registrar: setting up the ecosystem

The registrar comes first: no member can be created until its DID is known, and none can
be anchored until it has registered them.

### 1. The registrar wallet

1. Create the registrar wallet from the *UNTP Registrar* template (Building Blocks ›
   Identity Templates › Import › Select Pre-defined), with `registrar.name` set to the name
   it signs DIAs as. Its whole configuration is:

   ```json
   {
     "trustFramework": "UNTP",
     "walletKeyIdentifier": "did",
     "UNTP": { "isOnboarded": false, "role": "registrar", "registrar": { "name": "<REGISTRAR NAME>" } }
   }
   ```

   It needs no `credentialIssuers` entry: the `untp-dia` issuer is built in.
2. Read its DID with `WalletIdentifierGet` and confirm it is a `did:web` with
   `DidDocumentLocalGet`. This DID is `registrar_did` for every member. Give it to the user
   and say it is the one value every member has to receive from the registrar directly.

### 2. Member wallet templates

A member wallet trusts the registrar because its template says so. For each role in the
ecosystem (supplier, manufacturer, assessment body, buyer), save a wallet template with
`create_wallet_template`:

- `walletTemplateName`: `DPP <Role> (UNTP, <REGISTRAR NAME>)`.
- `walletTemplateConfig`: the role's configuration from **Wallet configuration** below, with
  `UNTP.trustedRegistrars` set to the registrar:

  ```json
  "trustedRegistrars": [
    { "did": "<REGISTRAR DID>", "name": "<REGISTRAR NAME>", "status": "Active" }
  ]
  ```

Every credential type a configuration names has to exist in the account first, or the
template is refused. If it is, tell the user to import the missing types (Digital Product
Passport, Digital Traceability Event, Digital Conformity Credential, eInvoice) from the
pre-defined credential templates on the Building Blocks page, and try again.

These templates live in the registrar's Nexus account. In a demo where that account
creates every wallet, members are created from them directly. A member in another account
saves the same configuration as a template there; give the user the configuration to hand
over. A member wallet that already exists is fixed in its trust framework settings
(*Trusted registrars*) instead; recreating it is not needed.

### 3. Enrolling each member

Repeat for every supplier, manufacturer, assessment body and buyer:

1. The member's wallet is created from its member template, and the member gives the
   registrar its DID (`WalletIdentifierGet` on the member's wallet) and its registration:
   the register (URI and type), its ID in that register, its registered name, and the
   recognition scopes the registrar grants (e.g. a scheme permitting it to issue DPPs).
2. The registrar registers it and sends the offer in its wallet's *Registered members*
   section (*Register a member*, then *Show offer* to send the link and PIN, or send it over
   WMP). This is `TfOnboardRequest` plus a pre-authorized offer of the `untp-dia` issuer
   bound to the member's DID; there is no assistant tool for either, so point the user to
   the screen.
3. The member onboards from its wallet's *Anchor* row with the offer link and PIN. Its
   wallet verifies the DIA against `registrar_did`, publishes it as a `dia` link and is then
   anchored (`WalletConfigurationVerify` shows `UNTP.isOnboarded: true`).
4. The registrar watches `TfUntpRequestList` until the member has onboarded; it then
   appears in `TfUntpDiaList`. Tell the member it may publish, present or issue only after
   that.

Direct issuance (`TfUntpDiaIssue`, behind a warning in the *Registered members* section)
anchors a member without it proving control of its DID. It is for closed pilots only, and
the wallet refuses it unless the deployment allows unverified DID binding.

### 4. Running the ecosystem

- `TfUntpDiaList` is the list of enrolled members. Members may use it, via the registrar,
  as the source of each other's DIDs (`expected_issuer`); say so when one is used that way.
- Revoke a member's DIA when it leaves (*Revoke* in *Registered members*). Warn the user
  first: everything that member signed stops verifying on every member wallet, and it
  cannot be undone.

## Trust check: every member, before every step

Run this at the start of every role's procedure, and again before reporting any
verification. Stop at the first failure, say which check failed, and do not go on: a step
taken on a wallet that does not trust `registrar_did` verifies against a different
ecosystem, or against none.

1. `registrar_did` is known. If the user cannot say where it came from, stop and ask: it
   is the trust decision this whole workflow rests on.
2. `WalletGet`: `config.trustFramework` is `UNTP`, `walletKeyIdentifier` is `did`,
   `UNTP.role` is `member`, and `UNTP.trustedRegistrars` has an entry whose `did` is
   `registrar_did` (and whose `status`, if set, is `Active`). If not, the wallet was not
   created from the registrar's member template: add the registrar under *Trusted
   registrars* in the wallet's trust framework settings, or create the wallet from the
   template.
3. `UntpRegistryList`: `registrar_did` is among `registrars`, with `source` `wallet`. This
   is what the wallet actually trusts at run time, which step 2 only configures. Any other
   registrars it returns (`source` `deployment` or `registry`) are the deployment's; they are
   trusted too, but this ecosystem does not rely on them.
4. Before publishing, presenting or issuing anything (supplier, manufacturer, assessment
   body, buyer): `WalletConfigurationVerify` shows `UNTP.isOnboarded: true`, and
   `VerifierDidVerify` on the wallet's own DID is `trusted` with `untp.registrar.did`
   equal to `registrar_did`. Otherwise the member is not enrolled yet: send it to the
   registrar (**Registrar, step 3**).

The owner skips step 4: it only reads public data and needs no anchor of its own.

## Credential types

Call `IssuerCredentialTypesList` to see what the wallet actually has before assuming any of
these exist.

- **DPP**: UNTP `DigitalProductPassport`, issued with no holder by the supplier for its
  component batch (`component_batch_passport`) and by the manufacturer for its finished
  product (`product_passport`). Same type and schema. `credentialSubject` is a single
  `Product`; a batch and a finished good are told apart by `idGranularity` and
  `batchNumber`. Required: `id`, `name`, `idScheme`, `idGranularity`, `productCategory`,
  `producedAtFacility`, `countryOfProduction`. Claims go in `performanceClaim[]`, each a
  `Claim` (`id`, `name`, `referenceCriteria`, `claimDate`, `claimedPerformance`,
  `conformityTopic`) whose `evidence[]` links the DCC behind it.
  Schema: <https://untp.unece.org/artefacts/schema/v0.7.0/dpp/DigitalProductPassport.json>.
- **Digital Conformity Credential (DCC)**: UNTP `DigitalConformityCredential`, issued by
  a conformity assessment body before this workflow starts: to the supplier for its
  component, and to the manufacturer for its finished product. Neither issues one here;
  each only holds its own. Its `credentialSubject` is a `ConformityAttestation`:
  `issuedToParty` is the holder, and `conformityAssessment[].assessedProduct[].product` is
  what was assessed. A DPP claim's `evidence[]` entry points to it: by its **public URL**
  when the holder published it, by its **`id`** when it is private. Its holder decides
  which. To be publishable it has to be a VCDM 2.0 `jwt_vc_vcdm` credential.
  Schema: <https://untp.unece.org/artefacts/schema/v0.7.0/dcc/ConformityCredential.json>.
- **Invoice**: WEBUILD `eInvoice` attestation (`vct: eu.we-build:einvoice:1`), SD-JWT VC,
  issued by the supplier to the manufacturer, always over WMP and never published. Its
  EN 16931 fields are private claims; it binds to the real invoice by
  `invoicePayloadHash` rather than embedding it. No published JSON Schema exists: the
  WEBUILD rulebook calls the `vct` "proposed, subject to registration" (WE BUILD Attestation Rulebooks Catalogue,
  *eInvoice* rulebook v0.71); base verification obligations are at
  <https://github.com/webuild-consortium/webuild-attestation-rulebooks-catalog/blob/main/rulebooks/rb-base/verifier-base-verification.md>.

  This workflow borrows WEBUILD's data model, not its trust machinery: the supplier's DIA
  and `expected_issuer` do the job of WEBUILD's EBWOID chain and List of Trusted Entities.
- **Make record**: UNTP `DigitalTraceabilityEvent`, issued with no holder by the
  manufacturer (`make_event`). **One per supplier product.** Its `credentialSubject` is an
  **array** holding a single `MakeEvent`, whose `type` is `["MakeEvent", "LifecycleEvent"]`
  (the schema requires both) and which requires `id`, `name`, `eventDate` (a date and
  time), `activityType`, `inputProduct`, `outputProduct` and `madeAtFacility`. `inputProduct` and
  `outputProduct` are arrays of `{product, quantity, disposition}`, where `product` carries
  only `id`, `name`, `idGranularity` and `modelNumber` / `batchNumber` / `itemNumber`. The
  links to the supplier DPP and the product DPP therefore go in the event's
  `relatedDocument[]`, not in the products.
  Schema: <https://untp.unece.org/artefacts/schema/v0.7.0/dte/DigitalTraceabilityEvent.json>.

A `relatedDocument` or `evidence` entry is a UNTP `Link`:
`{"linkURL", "linkName", "linkType", "mediaType"}`. Use the link type the wallet publishes
the target as (`dpp`, or `https://test.uncefact.org/vocabulary/link-type/dcc`), and
`mediaType: "application/vc+jwt"` for a public URL.

## Wallet configuration

Every member's configuration is the matching `wallets/untp/` template's (`untp/dpp_supplier`,
`untp/dpp_manufacturer`, `untp/dpp_assessment_body`, `untp/dpp_buyer`) plus
`UNTP.trustedRegistrars`, which the registrar's member templates add. A wallet needs no
configuration to hold or present credentials, or to publish one it holds. Only issuing
(`credentialIssuers`) and interactively requesting a presentation (`credentialVerifiers`)
need entries.

| Role | `credentialIssuers` | `credentialVerifiers` | `UNTP.issuerPolicy` |
|---|---|---|---|
| Supplier | `component_batch_passport`, `invoice` | none | none |
| Manufacturer | `product_passport`, `make_event` | `dcc_disclosure` | DIA required for DPPs, Make records, DCCs |
| Assessment body | `dcc` | none | none |
| Buyer and owner | none | `dcc_disclosure` | DIA required for DPPs, Make records, DCCs |

The `UNTP` block of a member, here a manufacturer or buyer:

```json
"UNTP": {
  "isOnboarded": false,
  "role": "member",
  "trustedRegistrars": [
    { "did": "<REGISTRAR DID>", "name": "<REGISTRAR NAME>", "status": "Active" }
  ],
  "issuerPolicy": [
    { "credentialType": "DigitalProductPassport", "requireDia": true },
    { "credentialType": "DigitalTraceabilityEvent", "requireDia": true },
    { "credentialType": "DigitalConformityCredential", "requireDia": true }
  ]
}
```

A supplier's and an assessment body's have no `issuerPolicy`. The issuer entries:

```json
{
  "name": "DPP Issuer",
  "description": "Issues UNTP passports and Make records, and eInvoices, on the UNTP trust framework.",
  "config": {
    "trustFramework": "UNTP",
    "walletKeyIdentifier": "did",
    "credentialIssuers": [
      {
        "id": "component_batch_passport",
        "name": "Component/Batch Passport",
        "credentialFormat": "jwt_vc_vcdm",
        "credentialType": "VerifiableCredential,DigitalProductPassport",
        "credentialIssuer": "IssuanceQueue",
        "signingKeyIdentifier": "did",
        "numericStatusListIndex": true
      },
      {
        "id": "product_passport",
        "name": "Product Passport",
        "credentialFormat": "jwt_vc_vcdm",
        "credentialType": "VerifiableCredential,DigitalProductPassport",
        "credentialIssuer": "IssuanceQueue",
        "signingKeyIdentifier": "did",
        "numericStatusListIndex": true
      },
      {
        "id": "invoice",
        "name": "eInvoice",
        "credentialFormat": "sd_jwt_vc",
        "credentialType": "eu.we-build:einvoice:1",
        "credentialIssuer": "IssuanceQueue",
        "disclosableClaims": [
          "$.invoiceFormat", "$.invoiceNumber", "$.issueDate",
          "$.seller", "$.buyer", "$.BuyerElectronicAddress",
          "$.amountDueForPayment", "$.invoiceTotalVatAmount", "$.InvoiceCurrencyCode",
          "$.taxSubtotal", "$.paymentInstructions", "$.evidenceReferences"
        ]
      },
      {
        "id": "make_event",
        "name": "Make Record",
        "credentialFormat": "jwt_vc_vcdm",
        "credentialType": "VerifiableCredential,DigitalTraceabilityEvent",
        "credentialIssuer": "IssuanceQueue",
        "signingKeyIdentifier": "did",
        "numericStatusListIndex": true
      }
    ]
  }
}
```

In each wallet keep only the entries its row in the table names. The assessment body's
`dcc` entry is the same shape with `credentialType`
`VerifiableCredential,DigitalConformityCredential`.

The `dcc_disclosure` verifier, for a DCC the holder has not published:

```json
{
  "name": "DPP Verifier",
  "description": "Requests Digital Conformity Credentials from the upstream party over WMP on the UNTP trust framework.",
  "config": {
    "trustFramework": "UNTP",
    "walletKeyIdentifier": "did",
    "credentialVerifiers": [
      {
        "id": "dcc_disclosure",
        "name": "DPP: Digital Conformity Credential",
        "dcqlQuery": {
          "credentials": [
            {
              "id": "dcc",
              "format": "jwt_vc_json",
              "meta": { "type_values": [["DigitalConformityCredential"]] },
              "claims": [{ "path": ["id"] }]
            }
          ]
        }
      }
    ]
  }
}
```

To pin the request to the one DCC a DPP claim's `evidence` points to, pass this as a
`customQueries` fragment at `$.credentials[0].claims[0]` in `VerifierInitUrlCreate`. It
replaces the query's `id` claim with one that must have that value:

```json
{
  "path": ["id"],
  "values": ["<PLACE THE EVIDENCE linkURL FROM THE DPP CLAIM HERE!!!>"]
}
```

## Prerequisites: all roles

- The **Trust check** passes.
- Counterparties' DIDs are known (`expected_issuer`), and each counterparty knows yours.
  Get the wallet's own DID with `WalletIdentifierGet`.
- An established WMP connection between supplier and manufacturer, and between
  manufacturer and buyer (`WmpEntityList`; otherwise `WmpCreateNewInvitation` /
  `WmpAcceptInvitation`). Every private exchange in this workflow (unpublished DCCs and
  invoices) goes over WMP; there is no link or QR fallback. Reading published credentials
  needs no connection.

## Common procedure: issuing and publishing a UNTP credential

Used by the supplier for its DPP and by the manufacturer for its product DPP and each Make
record.

1. Confirm the issuer exists with `IssuerCredentialTypesList`.
2. `CredentialCreate` with the draft. `credentialDraftMetadata.id` is the credential's
   `id`: a fresh URI the issuer controls, never reused. For a DPP:

   ```json
   {
     "name": "DPP <product> <batch>",
     "issuerId": "component_batch_passport",
     "credentialDraftMetadata": {
       "id": "<FRESH URI FOR THIS CREDENTIAL>",
       "name": "Digital Product Passport",
       "type": "VerifiableCredential,DigitalProductPassport",
       "format": "jwt_vc_vcdm",
       "vcdmVersion": "2.0",
       "contexts": [
         "https://www.w3.org/ns/credentials/v2",
         "https://vocabulary.uncefact.org/untp/0.7.0/context/"
       ],
       "vcdmName": "Digital Product Passport: <product>, batch <batch>",
       "credentialSchema": "https://untp.unece.org/artefacts/schema/v0.7.0/dpp/DigitalProductPassport.json",
       "credentialSchemaType": "JsonSchema"
     },
     "credentialSubject": {
       "type": ["Product"],
       "id": "<PRODUCT ID URI>",
       "name": "<product name>",
       "idScheme": { "type": ["IdentifierScheme"], "id": "<scheme URI>", "name": "<scheme name>" },
       "idGranularity": "batch",
       "batchNumber": "<batch>",
       "productCategory": [{ "code": "<code>", "name": "<name>", "schemeId": "<scheme URI>", "schemeName": "<scheme>" }],
       "producedAtFacility": { "type": ["Facility"], "id": "<facility URI>", "name": "<facility name>" },
       "countryOfProduction": { "countryCode": "<ISO 3166-1 alpha-2>", "countryName": "<country>" },
       "performanceClaim": ["<one Claim per claim, its evidence linking the DCC>"]
     }
   }
   ```

   A Make record uses `issuerId: "make_event"`, type
   `VerifiableCredential,DigitalTraceabilityEvent`, the DTE schema, and the subject in
   **Manufacturer, step 3.5**. Leave out `issuer`, `validFrom` and `issuingSoftware`: the
   wallet sets them.
3. `CredentialIssueDirect` for the draft with `{"issuerId": "<issuer>", "publish":
   {"linkType": "dpp"}}` (`"dte"` for a Make record). It returns `credentialId` and
   `publicUrl`. If it answers `502`, the credential was issued but not published: publish
   it with `UntpLinkPublish` (`{"credentialId", "linkType"}`), and do not issue again.
4. Check what was published: `VerifierCredentialVerify` with `{"url": "<publicUrl>"}` must
   report `verified: true`, including its `schema` and `jsonld` checks.
5. Report the credential's `id`, its `publicUrl` and the wallet's DID.

## Common procedure: verifying a published credential

Used by the manufacturer for each supplier DPP, and by the buyer and owner for the product
DPP, its Make records and the supplier DPPs they link to.

1. Run the **Trust check**.
2. Establish `expected_issuer`. If the user has none, the anchor alone stands in for it:
   say so in the report.
3. Fetch and verify it:
   - by the publisher's DID: `VerifierUntpResolve` with `identifier` the DID, `linkType`
     `dpp` (or `dte`) and `fetch=true`. Each entry of `credentials` is a linked credential
     with its `href`, verified (`credential`) or failed (`error`, `errorCode`), and
     `issuer` reports the publisher's anchor;
   - by a URL found in another credential (a Make record's `relatedDocument`, a claim's
     `evidence`): `VerifierCredentialVerify` with `{"url": "<linkURL>"}`. Then resolve
     the issuer's DID with `VerifierUntpResolve` and confirm its linkset still advertises
     that URL. A link the issuer has withdrawn is no longer vouched for, even if the URL
     still answered.
4. Check, in this order:
   1. It verified: signature, dates, status (neither `revoked` nor `suspended`), schema and
      JSON-LD. Report any failure by its `code`. A credential whose issuer has no anchor
      fails here.
   2. The issuer is anchored by **this ecosystem's** registrar: `VerifierDidVerify` with
      the credential's `issuer` and `credentialType` (`DigitalProductPassport`,
      `DigitalTraceabilityEvent` or `DigitalConformityCredential`) is `trusted`, and
      `untp.registrar.did` is `registrar_did`. Note the registered name and register from
      `untp.registrations`.
   3. The credential's `issuer` equals `expected_issuer`, where there is one. Otherwise the
      result is **not verified**, however cleanly it is anchored: the DID you resolved does
      not count, only the credential's own `issuer` does.
   4. The product ID and batch match what you expected: the bill-of-materials entry, the
      Make record's `inputProduct`, or the product in front of you.
5. Report the outcome naming the DID that signed it, who its anchor says it is (registered
   name, register, registrar), and where `expected_issuer` came from.

## Common procedure: fetching a Digital Conformity Credential

Used by the manufacturer against each supplier, and by the buyer against the manufacturer.
The holder's DPP must already be verified, because it is where the `evidence` link comes
from. Prefer the holder's published DCCs; use WMP only for one that is not published.

1. For each claim in `conformance_claims`, note its `evidence[].linkURL` in the verified
   DPP. Confirm with the user which ones to fetch rather than fetching every link
   automatically.
2. **Published first.** `VerifierUntpResolve` with `identifier` the holder's DID,
   `linkType=dcc` and `fetch=true`. A linked credential whose `href` equals the `linkURL`
   is the DCC; go to step 4. Do not open a WMP request for it.
3. **WMP fallback**, only for a `linkURL` with no published match (it is then the DCC's
   `id`, not a URL you can fetch):
   1. `VerifierInitUrlCreate` against `dcc_disclosure` with `wmpEntityId` set to the
      holder and the `evidence` filter from **Verifier wallet** as a `customQueries`
      fragment. Note the returned state.
   2. Wait for `vp.verified` or `vp.invalid` on that state via `WalletNotifications`. Do
      not poll `WalletNotificationHistory`, which is for looking back, not waiting.
   3. Read the result with `WalletVerifiedCredentialsByState`.
4. Check the DCC, however it arrived, in this order:
   1. Its `issuer` equals the **assessment body's** pinned DID, not the holder's. The
      holder's DID document only says who published it, not who assessed it.
   2. It verified, and is neither expired nor revoked.
   3. `credentialSubject.issuedToParty` is the holder, its
      `conformityAssessment[].assessedProduct[].product` matches the product, and its
      assessment covers the claim it is meant to back (`conformityTopic`,
      `assessedPerformance`). Over WMP, also check its `id` equals the `linkURL` requested.
5. Report which claims are now independently backed, by which assessment body, whether each
   DCC was published or came over WMP, and which were requested but not obtained.

## Common procedure: publishing a Digital Conformity Credential

Used by the supplier and the manufacturer for any DCC the user wants public. Only do it on
the user's explicit say-so, per credential. Once published it is readable by anyone who
resolves the DID, including parties beyond the next one downstream. Do it before issuing
the DPP that links it, because the DPP links a published DCC by its public URL.

1. Find the DCC with `CredentialList`, and note its credential ID and its `id`.
2. Publish it with `UntpLinkPublish`: `{"credentialId": "<credential ID>", "linkType":
   "dcc"}`. It returns the link, whose `href` is the public URL. A DCC that is not a valid
   VCDM 2.0 credential is refused: keep it private.
3. Check with `UntpLinkList` that only the intended DCC was added.

Publishing is per credential, so no other DCC the wallet holds becomes public.

## Common procedure: presenting a Digital Conformity Credential on request

Used by the supplier when the manufacturer asks, and by the manufacturer when the buyer
asks, for a DCC that is not published. Nothing to configure: a held credential needs no
issuer-side setup to present.

1. When the request arrives over WMP, call `WmpClientProcessRequest` to see which
   credential it asks for.
2. Confirm with the user before presenting. This is the step that discloses private data,
   and only the directly downstream party that asked should get it.
3. Present with `HolderCredentialsPresentAfterConsent`.

## Supplier

### Publishing the DPP

1. Gather `product` and `passport_claims`. Ask for anything missing rather than guessing: a
   passport with an invented batch number is worse than no passport, because it will verify.
2. For any claim backed by independent assessment, find the DCC already held for it
   (`CredentialList`). Ask the user, per DCC, whether it may be public.
   - Public: publish it per **Common procedure: publishing a Digital Conformity
     Credential**, and link it by its `href`.
   - Private: link it by its `id`.

   Put the link in that claim's `evidence[]` (`linkType`
   `https://test.uncefact.org/vocabulary/link-type/dcc`). Link to it; don't restate it in
   the DPP.
3. Issue and publish the DPP against `component_batch_passport` with link type `dpp`, per
   **Common procedure: issuing and publishing a UNTP credential**.
4. Give the user the wallet's DID to hand to the manufacturer out of band.

### Presenting DCCs on request

When the manufacturer asks over WMP for one that is not published, follow **Common
procedure: presenting a Digital Conformity Credential on request**.

### Issuing the invoice

1. Gather `invoice_details`, including the order or delivery reference it covers. The
   credential has no field linking it to a DPP or batch, so record that mapping where the
   user keeps it.
2. If the user has the underlying invoice document (or its canonicalized payload), compute
   `invoicePayloadHash` per the rulebook's binding rule (IR-EI-03). Otherwise ask for the
   hash; never invent one.
3. Check the WMP connection with the manufacturer (`WmpEntityConnectionGet`).
4. `CredentialCreate` against `invoice`, `CredentialIssuanceInit` with the manufacturer's
   DID as `clientId`, then `IssuerInitiateAuthOffer` with `wmpEntityId` set. It returns 204
   and no URL; the manufacturer's wallet receives a `wmp.credential_offer` notification.
5. Report the outcome once `WalletNotificationGetByState` shows `offer.processed`.

Never publish the invoice.

## Manufacturer

### 1. Verifying supplier DPPs and fetching DCCs

Repeat for every supplier product in `bom`:

1. Verify the supplier's published DPP per **Common procedure: verifying a published
   credential**, resolving the supplier's DID with `linkType=dpp`, with that supplier's DID
   as `expected_issuer`. Pick the DPP whose `credentialSubject` is the bill-of-materials
   product and batch. Note its `href`: the Make record links it.
2. Fetch the DCCs behind it per **Common procedure: fetching a Digital Conformity
   Credential**, with the supplier as holder.

Report per supplier product: whether the DPP verified, which DCCs were obtained, and
whether each was published or requested over WMP. If any fails, say which and what it
blocks.
If possible, create a credential trust graph describing the relationships between the DPPs
and DCCs.

### 2. Receiving invoices

Push-driven: nothing to request. For each supplier's invoice, wait for a
`wmp.credential_offer` notification, call `WmpClientProcessRequest` for the `interactionId`
and authorization requirements, then accept with `HolderOfferProcessAfterConsent`. Check
the invoice's issuer is that supplier's pinned DID.

### 3. Issuing the product DPP and Make records

1. Derive the product passport's claims from the verified supplier DPPs and DCCs, and say
   which source backs each figure: a supplier's self-declared claim, an independently
   assessed value from a DCC, or a figure the manufacturer computed across components.
   They look identical as bare numbers; the difference is the point.
2. Link the evidence. For any claim about the finished product that the manufacturer's
   **own** DCC backs, decide whether that DCC is public and link it as the supplier does
   (**Supplier, Publishing the DPP**, step 2). A figure resting on a supplier's DCC may
   link that DCC's public URL in its `evidence`. Never link a supplier's private DCC, and
   never republish a supplier's DCC: whether it is public is the supplier's call. The
   supplier DPPs themselves are linked from the Make records in step 5.
3. If a supplier DPP or a DCC it depends on is missing, expired or fails its issuer check,
   stop and report it. Do not issue a passport that silently omits it: a rolled-up figure
   with a hole in it is an estimate wearing a signature.
4. Issue and publish the product DPP against `product_passport` with link type `dpp`, per
   **Common procedure: issuing and publishing a UNTP credential**. Note its `publicUrl`.
5. For **every** supplier product in `bom`, issue and publish a Make record against
   `make_event` with link type `dte`. Its `credentialSubject` is an array of one
   `MakeEvent`:

   ```json
   [
     {
       "type": ["MakeEvent", "LifecycleEvent"],
       "id": "<FRESH URI FOR THIS EVENT>",
       "name": "Assembly of <product> using <component>",
       "eventDate": "<DATE AND TIME, e.g. 2026-11-15T00:00:00Z>",
       "activityType": { "code": "<code>", "name": "<name>", "schemeId": "<scheme URI>", "schemeName": "<scheme>" },
       "madeAtFacility": { "type": ["Facility"], "id": "<facility URI>", "name": "<facility name>" },
       "inputProduct": [
         {
           "product": { "type": ["Product"], "id": "<supplier product ID>", "name": "<component>", "idGranularity": "batch", "batchNumber": "<supplier batch>" },
           "quantity": { "value": "<QUANTITY, A NUMBER>", "unit": "<UNECE Rec 20 unit code>" },
           "disposition": "consumed"
         }
       ],
       "outputProduct": [
         {
           "product": { "type": ["Product"], "id": "<product ID>", "name": "<product>", "idGranularity": "batch", "batchNumber": "<batch>" },
           "disposition": "new"
         }
       ],
       "relatedDocument": [
         { "linkURL": "<supplier DPP href>", "linkName": "Supplier DPP: <component>", "linkType": "dpp", "mediaType": "application/vc+jwt" },
         { "linkURL": "<product DPP publicUrl>", "linkName": "Product DPP: <product>", "linkType": "dpp", "mediaType": "application/vc+jwt" }
       ]
     }
   ]
   ```

   Take `eventDate`, `activityType` and `madeAtFacility` from `make_event`, and the
   quantity from the `bom` entry. Ask for any value you do not have.
6. Report the product DPP, every Make record and every DCC published, each with its public
   URL, one line per supplier product.
7. Give the user the wallet's DID to hand to buyers out of band.

### 4. Presenting its DCC to a buyer

When a buyer asks over WMP for one that is not published, follow **Common procedure:
presenting a Digital Conformity Credential on request**. Present only the manufacturer's
own DCC, never a supplier's private one, which was disclosed to the manufacturer alone.

## Assessment body

The assessment body issues the DCCs that suppliers and the manufacturer hold. Issuing them
happens before this workflow, against its `dcc` issuer. What this workflow needs of it is
that it is **enrolled**: a DCC verifies on a member wallet only when its issuer is anchored
by the registrar, including DCCs it issued before it was enrolled.

1. Run the **Trust check** (steps 1 to 3), then get enrolled (**Registrar, step 3**).
2. Run the **Trust check** again, including step 4.
3. Give the user the wallet's DID to hand to suppliers, the manufacturer and buyers: they
   pin it as the DCC's `expected_issuer`.

## Buyer: verifying the product and what it is made of

The buyer has a business relationship with the manufacturer (a pinned DID and a WMP
connection) but usually none with the manufacturer's suppliers.

### 1. The product: DPP and DCC

1. Verify the manufacturer's product DPP per **Common procedure: verifying a published
   credential**, resolving the manufacturer's DID with `linkType=dpp`, with the
   manufacturer's DID as `expected_issuer`. Note the product DPP's `href`.
2. Fetch the manufacturer's DCC(s) per **Common procedure: fetching a Digital Conformity
   Credential**, with the manufacturer as holder. Pin the assessment body's DID
   separately from the manufacturer's.
3. If either check fails, stop and report it. The composition trace below is only worth
   anything once the product itself is established.

### 2. What it is made of: Make records and supplier DPPs

1. Resolve the manufacturer's DID with `linkType=dte` and `fetch=true`, and check every
   Make record per **Common procedure: verifying a published credential**, with the
   manufacturer's DID as `expected_issuer`. Keep those whose `outputProduct` is the
   product and whose `relatedDocument` links the product DPP's `href` from step 1.1.
   Together they are the product's bill of materials as the manufacturer attests it.
2. For each Make record, follow its `relatedDocument` link to the supplier DPP and verify
   it by URL the same way, with the supplier's DID as `expected_issuer`. Also check the
   DPP's product ID and batch match the record's `inputProduct`.
3. Be explicit about where each supplier DID came from. If the buyer pinned it out of band
   (e.g. the supplier's own `did:web` domain), say so. If the only source is the
   manufacturer's signed Make record, say that instead: the supplier DPP is then trusted on
   the manufacturer's word, not independently.
4. For each supplier claim's `evidence[].linkURL`, resolve the supplier's DID with
   `linkType=dcc` for a published DCC with that `href`, and check it per step 4 of
   **Common procedure: fetching a Digital Conformity Credential**, with the assessment
   body's DID pinned independently. Do not request supplier DCCs over WMP: the buyer has
   no connection with the supplier, and private ones are for the manufacturer alone.
   Report supplier claims with no published, checked DCC as self-declared or
   evidence-linked, not as assessed values the buyer has seen.

### 3. Reporting

Answer in two parts:

- **The product**: what it is, who signed its DPP, which claims are backed by a DCC the
  buyer received and checked, by which assessment body, and whether it was published or
  came over WMP.
- **What it is made of**: one line per component, giving the supplier product, batch and
  quantity from the Make record, whether its DPP verified, which DID signed it, how that
  DID was pinned, and which of its claims are backed by a published DCC the buyer
  checked. Name any Make record that links to a missing or failing supplier DPP.
- If possible, create a credential trust graph describing the relationships between the
  DPPs, Make records and DCCs.

## Owner: checking a finished product

The owner has no prior relationship and sees only public data. It still needs a UNTP
wallet that trusts the registrar to resolve and verify with (one created from the
buyer's member template), but no anchor of its own and no WMP connection.

1. Resolve `expected_issuer` for the manufacturer from the product itself or the seller's
   site, and say which. For an owner this is the weakest link and should be stated.
2. Verify the product DPP and its Make records per **Common procedure: verifying a
   published credential**.
3. Each Make record links to a supplier DPP, which is public and can be verified the same
   way, but only against a supplier DID the owner can pin independently.
4. For each `evidence[].linkURL` in these DPPs, look for a published DCC with that `href`
   among the holder's `dcc` links and check it per step 4 of **Common procedure: fetching
   a Digital Conformity Credential**. Private ones are not available to the owner;
   report that claims backed by them were not checked, only referenced.
5. Answer plainly: what the product is, who signed for it, which components went into it,
   and which of those statements this check actually established.
