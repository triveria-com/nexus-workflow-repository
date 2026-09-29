---
slug: dpp-supply-chain
title: Digital Product Passport (DPP) supply chain workflow
summary: >-
  Carry Digital Product Passports along a supply chain on the NOOP trust framework: each
  supplier publishes a public DPP for its product and privately holds the conformance
  credentials behind its claims; the manufacturer verifies the DPPs of every supplier on
  its bill of materials, requests the private conformance credentials it needs over WMP,
  and accepts each supplier's invoice over WMP; it then publishes a DPP for its own
  product together with one Digital Traceability Event (a UNTP Make record) per supplier
  product, stating that the component was used to make it. A buyer then verifies the
  manufacturer's DPP, requests the manufacturer's private conformance credential over WMP,
  and follows the Make records to learn what the product is made of. NOOP means there is
  no trust list behind any of this — every verifying step has to pin the issuer DID out
  of band, and this workflow says where.
questions:
  - id: role
    prompt: Which role are you acting in?
    required: true
    options: [supplier, manufacturer, buyer, owner]
    hint: >-
      "supplier" = a component maker that publishes a DPP, holds conformance credentials
      privately, and invoices the manufacturer. "manufacturer" = the company building a
      product from supplier components, issuing its own DPP and Make records, and holding
      its own conformance credential privately. "buyer" = a business buying the
      manufacturer's product, which verifies its DPP and conformance credential and
      traces what it is made of. "owner" = whoever ends up with the finished product and
      wants to check its public data.
  - id: product
    prompt: "Supplier or manufacturer: what is the product — name, product IDs, and the batch or lot it covers?"
    required: false
    hint: >-
      A passport covers a batch, not a single item, unless you say otherwise. Give the
      product IDs as URNs (urn:gtin:…) so they can be matched against a bill of materials
      and referenced from a Make record.
  - id: passport_claims
    prompt: "Supplier or manufacturer: what does the passport need to carry — origin, materials, footprint, performance claims?"
    required: false
    hint: >-
      Everything in the DPP is public. If a claim is independently assessed, link the
      conformance credential that backs it via that claim's `evidence` rather than
      restating the assessment — the conformance credential itself stays private.
  - id: bom
    prompt: "Manufacturer: which supplier products from your bill of materials go into this product — for each, the product ID, batch, quantity and the supplier's DID?"
    required: false
    hint: >-
      One entry per supplier product. Each one gets its DPP verified, and each one gets its
      own Make record once your product passport is issued. The supplier's DID is also its
      `expected_issuer` — say where you got it.
  - id: conformance_claims
    prompt: "Manufacturer or buyer: which claims do you need independently backed by a conformance credential?"
    required: false
    hint: >-
      Manufacturer: the supplier claims your own passport derives figures from. Buyer: the
      manufacturer's product claims your purchase decision depends on. Each request is a
      separate WMP exchange the holder has to consent to.
  - id: invoice_details
    prompt: "Supplier: invoice number, issue date, seller and buyer registration/VAT details, amount due, VAT amount and currency — and do you have the underlying invoice document to hash?"
    required: false
    hint: >-
      These follow WEBUILD's `eu.we-build:einvoice:1` eInvoice attestation — EN 16931 field
      names carried as SD-JWT VC claims. The credential binds to the invoice document by
      `invoicePayloadHash`. Never compute or invent this hash yourself from nothing — ask
      for the document or the hash.
  - id: make_event
    prompt: "Manufacturer: where and when was the product made — facility, date, and the activity classification?"
    required: false
    hint: >-
      UNTP `MakeEvent` requires `eventDate`, `activityType` and `madeAtFacility`, alongside
      the input (supplier) product and output (your) product. Ask rather than guess.
  - id: expected_issuer
    prompt: "Which DID do you expect to have signed each credential you are checking, and how do you know it?"
    required: false
    hint: >-
      NOOP has no trust list, so this is the whole of your trust decision — made separately
      per credential kind. A supplier DPP's issuer is the supplier; a conformance
      credential's issuer is the assessment body; the product DPP's and Make records'
      issuer is the manufacturer. Source each from the counterparty's own website
      (did:web), a contract, or an onboarding pack — never from the presentation you are
      checking.
---

# Digital Product Passport (DPP) supply chain workflow

A Digital Product Passport follows a product through the hands that make and assemble it.
This workflow has three interactions between a supplier and a manufacturer, a fourth
between the manufacturer and a buyer, and an optional public check by the end owner:

1. **Manufacturer verifies each supplier's DPP**, for every supplier product on its bill of
   materials, then **requests the conformance credentials** it needs from the supplier over
   WMP — they are private and are never published.
2. **Supplier issues an invoice** to the manufacturer over WMP.
3. **Manufacturer issues its own DPP** and, for every supplier product, a **Digital
   Traceability Event** — a UNTP Make record — stating that the supplier product was used
   to make the manufacturer's product.
4. **Buyer verifies the manufacturer's DPP and CC** — the DPP from its public Linked VP,
   the CC requested from the manufacturer over WMP — and follows the Make records to the
   supplier DPPs to learn what the product is made of.

What is public and what is private is fixed:

| Credential | Issued by | Held by | Public? | How it travels |
|---|---|---|---|---|
| Supplier DPP | Supplier (self-issued) | Supplier | Yes | Linked VP in the supplier's DID document |
| Supplier CC | Assessment body | Supplier | No | WMP presentation to the manufacturer, on request |
| Invoice | Supplier | Manufacturer | No | WMP offer |
| Product DPP | Manufacturer (self-issued) | Manufacturer | Yes | Linked VP in the manufacturer's DID document |
| Make record (DTE) | Manufacturer (self-issued) | Manufacturer | Yes | Linked VP in the manufacturer's DID document |
| Manufacturer CC | Assessment body | Manufacturer | No | WMP presentation to the buyer, on request |

Private credentials are only ever presented to the next party downstream: supplier CCs
reach the manufacturer, the manufacturer's CC reaches the buyer. The buyer never gets a
supplier's CC — what it learns about the components comes from their public DPPs.

## What NOOP changes

On IDTL or EBSI, "verified" carries an accreditation: the issuer is on a trust list, and
the list is the reason to believe them. **The NOOP trust framework has no list.** A
signature check tells you the credential was signed by a particular DID and has not been
tampered with. It tells you nothing at all about who that DID belongs to.

So every verifying step has an extra obligation: compare the issuer DID against a value
obtained **out of band** — `expected_issuer` — and treat a credential signed by anything
else as unverified, however cleanly the signature checks out. Sources worth trusting are
the counterparty's own domain (`did:web:…`), a signed contract, or an onboarding pack
exchanged before any goods moved. A DID read out of the presentation you are checking is
not a source; it is the claim you are testing.

This applies separately to every credential kind. A conformance credential's issuer is the
assessment body, not the supplier or manufacturer who holds and presents it — the holder's
DID and the assessment body's DID are pinned independently. With several suppliers on a bill of materials, each supplier's DID is pinned
independently too.

State this limitation when reporting any result. "Signed by `did:web:supplier.example`,
which matches the DID in your supplier record" is an honest verification on NOOP.
"Verified" on its own is not.

## Credential types

Call `IssuerCredentialTypesList` to see what the wallet actually has before assuming any of
these exist.

- **DPP** — UNTP `DigitalProductPassport`, self-issued by the supplier for its component
  batch (`component_batch_passport`) and by the manufacturer for its finished product
  (`product_passport`). Same type and schema; a batch and a finished good are told apart by
  `credentialSubject.identificationGranularity` and `credentialSubject.batchNumber`.
  Schema: <https://untp.unece.org/artefacts/schema/v0.7.0/dpp/DigitalProductPassport.json>.
- **Conformance credential (CC)** — UNTP `DigitalConformityCredential`, issued by a
  conformity assessment body before this workflow starts — to the supplier for its
  component, and to the manufacturer for its finished product. Neither issues one here;
  each only holds its own, and its DPP's `performanceClaim[*].evidence[].linkURL` points to
  it by its `id`. It is private: never published, only presented over WMP to the party
  directly downstream that asks (the manufacturer, or the buyer).
  Schema: <https://untp.unece.org/artefacts/schema/v0.7.0/dcc/ConformityCredential.json>.
- **Invoice** — WEBUILD `eInvoice` attestation (`vct: eu.we-build:einvoice:1`), SD-JWT VC,
  issued by the supplier to the manufacturer, always over WMP. Its EN 16931 fields are
  private claims; it binds to the real invoice by `invoicePayloadHash` rather than
  embedding it. No published JSON Schema exists — the WEBUILD rulebook calls the `vct`
  "proposed, subject to registration" (WE BUILD Attestation Rulebooks Catalogue,
  *eInvoice* rulebook v0.71); base verification obligations are at
  <https://github.com/webuild-consortium/webuild-attestation-rulebooks-catalog/blob/main/rulebooks/rb-base/verifier-base-verification.md>.
  This workflow borrows WEBUILD's data model, not its trust machinery: NOOP has no EBWOID
  chain or List of Trusted Entities, so `expected_issuer` pinning does that job.
- **Make record** — UNTP `DigitalTraceabilityEvent` whose `credentialSubject` is a single
  `MakeEvent`, self-issued by the manufacturer (`make_event`). **One per supplier product**:
  `inputProduct` is that supplier product (linking to its DPP), `outputProduct` is the
  manufacturer's product (linking to the product DPP). `MakeEvent` requires `id`, `name`,
  `eventDate`, `activityType`, `inputProduct`, `outputProduct` and `madeAtFacility`.
  Schema: <https://untp.unece.org/artefacts/schema/v0.7.0/dte/DigitalTraceabilityEvent.json>.

## Wallet configuration

Worked NOOP configuration snippets to adapt, not load verbatim. A wallet needs no
configuration to hold or present credentials, or to publish a Linked VP — only issuing
(`credentialIssuers`) and interactively requesting a presentation (`credentialVerifiers`)
need entries.

| Role | `credentialIssuers` needed | `credentialVerifiers` needed |
|---|---|---|
| Supplier | `component_batch_passport`, `invoice` | none |
| Manufacturer | `product_passport`, `make_event` | `dpp_conformance_credential_disclosure` |
| Buyer | none | `dpp_conformance_credential_disclosure` |
| Owner | none | none |

Reading a published DPP or Make record (`VerifierLinkedVpVerify`) checks an
already-published Linked VP, not an interactive request, so it needs no verifier entry.

### Issuer wallet — supplier and manufacturer

All entries use the `IssuanceQueue` mode: claim values are gathered from the user and
supplied per request. The invoice is `sd_jwt_vc` because that is the only encoding WEBUILD
specifies; `disclosableClaims` lists what the rulebook marks disclosable, and the fields it
marks `MUST NOT` (`iss`, `iat`, `exp`, `vct`, `status`, `cnf`, `attestation_legal_category`,
`invoicePayloadHash`, `invoiceLifecycleStatus`, `precedingInvoiceReference`) always travel
in the clear. The supplier's wallet needs only the first and third entries, the
manufacturer's only the second and fourth.

```json
{
  "name": "DPP Issuer",
  "description": "Issues passports, invoices and Make records on the NOOP trust framework.",
  "config": {
    "trustFramework": "NOOP",
    "walletKeyIdentifier": "did",
    "credentialIssuers": [
      {
        "id": "component_batch_passport",
        "name": "Component/Batch Passport",
        "credentialFormat": "jwt_vc_vcdm",
        "credentialType": "VerifiableCredential,DigitalProductPassport",
        "credentialIssuer": "IssuanceQueue"
      },
      {
        "id": "product_passport",
        "name": "Product Passport",
        "credentialFormat": "jwt_vc_vcdm",
        "credentialType": "VerifiableCredential,DigitalProductPassport",
        "credentialIssuer": "IssuanceQueue"
      },
      {
        "id": "invoice",
        "name": "eInvoice",
        "credentialFormat": "sd_jwt_vc",
        "credentialType": "eu.we-build:einvoice:1",
        "credentialIssuer": "IssuanceQueue",
        "disclosableClaims": [
          "$.invoiceFormat", "$.invoiceNumber", "$.issueDate",
          "$.sellerLegalRegistrationIdentifier", "$.sellerRegistrationName",
          "$.sellerVatIdentifier", "$.sellerCountry",
          "$.buyerLegalRegistrationIdentifier", "$.buyerVatIdentifier",
          "$.buyerCountry", "$.BuyerElectronicAddress",
          "$.amountDueForPayment", "$.invoiceTotalVatAmount", "$.InvoiceCurrencyCode",
          "$.taxSubtotal", "$.paymentInstructions", "$.evidenceReferences"
        ]
      },
      {
        "id": "make_event",
        "name": "Make Record",
        "credentialFormat": "jwt_vc_vcdm",
        "credentialType": "VerifiableCredential,DigitalTraceabilityEvent",
        "credentialIssuer": "IssuanceQueue"
      }
    ],
    "oidcRevision": { "oidc4vci": "Draft15", "oidc4vp": "Draft23" }
  }
}
```

### Verifier wallet — manufacturer and buyer

One entry, targeting the conformance credential — the manufacturer uses it against its
suppliers, the buyer against the manufacturer. Paths are prefixed `$.vc.…` because the
credential arrives wrapped in a presentation.

```json
{
  "name": "DPP Verifier",
  "description": "Requests conformance credentials from the upstream party over WMP on the NOOP trust framework.",
  "config": {
    "trustFramework": "NOOP",
    "walletKeyIdentifier": "did",
    "credentialVerifiers": [
      {
        "id": "dpp_conformance_credential_disclosure",
        "name": "DPP — conformance credential",
        "presentationDefinition": {
          "format": { "jwt_vc": { "alg": ["ES256"] }, "jwt_vp": { "alg": ["ES256"] } },
          "id": "dpp_conformance_credential_presentation",
          "input_descriptors": [
            {
              "id": "dpp_conformance_credential",
              "constraints": {
                "fields": [
                  {
                    "name": "Credential type",
                    "path": ["$.vc.type"],
                    "filter": { "type": "array", "contains": { "const": "DigitalConformityCredential" } }
                  }
                ]
              }
            }
          ]
        }
      }
    ],
    "oidcRevision": { "oidc4vci": "Draft15", "oidc4vp": "Draft23" }
  }
}
```

To pin the request to the one conformance credential a DPP claim's `evidence` points to,
pass this as a `customQueries` fragment at `$.input_descriptors[0].constraints.fields[-1]`
in `VerifierInitUrlCreate`:

```json
{
  "name": "Conformance credential filter",
  "path": ["$.vc.id"],
  "filter": {
    "type": "string",
    "const": "<PLACE THE EVIDENCE linkURL FROM THE DPP CLAIM HERE!!!>"
  }
}
```

### Linked VP presentation definitions — supplier and manufacturer

`HolderLinkedVpCreate` takes a presentation definition directly as a parameter; it is not
read from `credentialVerifiers`. Paths have no `$.vc.` prefix because they address the
unwrapped credential. Both definitions have only a type filter, so the whole credential is
published — a DPP and a Make record are public in full.

```json
{
  "format": { "jwt_vc": { "alg": ["ES256"] }, "jwt_vp": { "alg": ["ES256"] } },
  "id": "dpp_public_presentation",
  "input_descriptors": [
    {
      "id": "dpp_public",
      "constraints": {
        "fields": [
          {
            "path": ["$.type"],
            "filter": { "type": "array", "contains": { "const": "DigitalProductPassport" } }
          }
        ]
      }
    }
  ]
}
```

```json
{
  "format": { "jwt_vc": { "alg": ["ES256"] }, "jwt_vp": { "alg": ["ES256"] } },
  "id": "make_event_public_presentation",
  "input_descriptors": [
    {
      "id": "make_event_public",
      "constraints": {
        "fields": [
          {
            "path": ["$.type"],
            "filter": { "type": "array", "contains": { "const": "DigitalTraceabilityEvent" } }
          }
        ]
      }
    }
  ]
}
```

## Prerequisites — all roles

- A wallet whose `config.trustFramework` is `NOOP` and whose `walletKeyIdentifier` is
  `did`. The `Triveria Organization` and `Triveria Holder` templates are both NOOP.
- No onboarding step. Confirm with `WalletConfigurationVerify` and get the wallet's own DID
  with `WalletIdentifierGet` — counterparties will be pinning it, and it has to reach them
  by a channel other than the credentials themselves.
- An established WMP connection between supplier and manufacturer, and between
  manufacturer and buyer (`WmpEntityList`; otherwise `WmpCreateNewInvitation` /
  `WmpAcceptInvitation`). Every private exchange in this workflow — conformance credentials
  and invoices — goes over WMP; there is no link or QR fallback.

## Common procedure — self-issuing and publishing a credential

Used by the supplier for its DPP and by the manufacturer for its product DPP and each Make
record.

1. Confirm the credential type exists with `IssuerCredentialTypesList`.
2. `CredentialCreate` against the issuer ID, then `CredentialIssuanceInit` with `clientId`
   set to the wallet's own DID.
3. `IssuerInitiatePreauthOffer` for that DID, then accept the offer into the same wallet
   (`HolderOfferProcessAfterConsent`), so the wallet holds what it issued.
4. Publish it with `HolderLinkedVpCreate`, using the matching presentation definition from
   **Linked VP presentation definitions** (`dpp_public_presentation` or
   `make_event_public_presentation`).
5. Report the published credential's `id` and the wallet's DID.

## Common procedure — verifying a published credential

Used by the manufacturer for each supplier DPP, and by the buyer and owner for the product
DPP, its Make records and the supplier DPPs they link to.

1. Establish `expected_issuer` first. If the user cannot say which DID should have signed
   it, stop and say so — there is nothing to verify against on NOOP.
2. Fetch and check the published Linked VP from the issuer's DID document
   (`VerifierLinkedVpVerify`).
3. Check, in this order:
   1. The issuer DID equals `expected_issuer`. Otherwise the result is **not verified**,
      whatever the signature says.
   2. The credential is neither expired nor revoked.
   3. The product and batch IDs match what you expected — the bill-of-materials entry, or
      the product in front of you.
4. Report the outcome naming the DID that signed it and where the expectation of that DID
   came from.

## Common procedure — requesting a conformance credential over WMP

Used by the manufacturer against each supplier, and by the buyer against the manufacturer.
The holder's DPP must already be verified — it is where the `evidence` link comes from.

1. For each claim in `conformance_claims`, note its `evidence[].linkURL` in the verified
   DPP. Confirm with the user which ones to request rather than fetching every link
   automatically.
2. Request each one: `VerifierInitUrlCreate` against
   `dpp_conformance_credential_disclosure` with `wmpEntityId` set to the holder and the
   `evidence` filter from **Verifier wallet** as a `customQueries` fragment. Note the
   returned state.
3. Wait for `vp.verified` or `vp.invalid` on that state via `WalletNotifications` — do not
   poll `WalletNotificationHistory`, which is for looking back, not waiting.
4. Read the result with `WalletVerifiedCredentialsByState` and check, in this order:
   1. The issuer DID equals the **assessment body's** pinned DID — not the holder's.
   2. It is neither expired nor revoked.
   3. Its `id` equals the `linkURL` requested, and its assessed object matches the product
      and claim it is meant to back.
5. Report which claims are now independently backed, by which assessment body, and which
   were requested but not obtained.

## Common procedure — presenting a conformance credential on request

Used by the supplier when the manufacturer asks, and by the manufacturer when the buyer
asks. Nothing to configure: a held credential needs no issuer-side setup to present.

1. When the request arrives over WMP, call `WmpClientProcessRequest` to see which
   credential it asks for.
2. Confirm with the user before presenting — this is the step that discloses private data,
   and only the directly downstream party that asked should get it.
3. Present with `HolderCredentialsPresentAfterConsent`.

## Supplier

### Publishing the DPP

1. Gather `product` and `passport_claims`. Ask for anything missing rather than guessing: a
   passport with an invented batch number is worse than no passport, because it will verify.
2. For any claim backed by independent assessment, find the conformance credential already
   held for it (`CredentialList`) and use its `id` as that claim's `evidence[].linkURL`.
   Link to it; don't restate it, and don't publish it.
3. Self-issue and publish against `component_batch_passport`, per **Common procedure —
   self-issuing and publishing a credential**.
4. Give the user the wallet's DID to hand to the manufacturer out of band.

### Presenting conformance credentials on request

When the manufacturer asks, follow **Common procedure — presenting a conformance
credential on request**.

### Issuing the invoice

1. Gather `invoice_details`, including the order or delivery reference it covers — the
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

## Manufacturer

### 1. Verifying supplier DPPs and requesting conformance credentials

Repeat for every supplier product in `bom`:

1. Verify the supplier's published DPP per **Common procedure — verifying a published
   credential**, with that supplier's DID as `expected_issuer`.
2. Request the conformance credentials behind it per **Common procedure — requesting a
   conformance credential over WMP**, with the supplier as holder.

Report per supplier product: DPP verified or not, and which conformance credentials were
obtained. If any fails, say which and what it blocks.
If possible, create a credential trust graph describing the relationships between the DPPs
and Conformance Credentials.

### 2. Receiving invoices

Push-driven: nothing to request. For each supplier's invoice, wait for a
`wmp.credential_offer` notification, call `WmpClientProcessRequest` for the `interactionId`
and authorization requirements, then accept with `HolderOfferProcessAfterConsent`. Check
the invoice's issuer is that supplier's pinned DID.

### 3. Issuing the product DPP and Make records

1. Derive the product passport's claims from the verified supplier DPPs and conformance
   credentials, and say which source backs each figure: a supplier's self-declared claim,
   an independently assessed value from a conformance credential, or a figure the
   manufacturer computed across components. They look identical as bare numbers; the
   difference is the point.
2. Reference each supplier DPP — and, where used, the supplier conformance credential
   behind a figure — so a downstream reader can follow the chain. For any claim about the
   finished product that the manufacturer's **own** conformance credential backs, find it
   (`CredentialList`) and use its `id` as that claim's `evidence[].linkURL`. Conformance
   credentials stay private: reference their `id`, never republish their content.
3. If a supplier DPP or a conformance credential it depends on is missing, expired or
   fails its issuer check, stop and report it. Do not issue a passport that silently omits
   it — a rolled-up figure with a hole in it is an estimate wearing a signature.
4. Self-issue and publish against `product_passport`, per **Common procedure —
   self-issuing and publishing a credential**. Note the product DPP's `id`.
5. For **every** supplier product in `bom`, self-issue and publish a Make record against
   `make_event`, with `credentialSubject` a single `MakeEvent`:
   - `inputProduct` — that supplier product: its product ID, batch, `idGranularity`, the
     `quantity` consumed, `disposition: "consumed"`, and a link to the supplier's DPP.
   - `outputProduct` — the manufacturer's product, with `disposition: "new"` and a link to
     the product DPP from step 4.
   - `eventDate`, `activityType` and `madeAtFacility` from `make_event`; `id` a fresh URI;
     `name` describing the step (e.g. "Assembly of <product> using <component>").
6. Report the product DPP and every Make record published, one line per supplier product.
7. Give the user the wallet's DID to hand to buyers out of band.

### 4. Presenting its conformance credential to a buyer

When a buyer asks over WMP, follow **Common procedure — presenting a conformance
credential on request**. Present only the manufacturer's own conformance credential —
never a supplier's, which was disclosed to the manufacturer alone.

## Buyer — verifying the product and what it is made of

The buyer has a business relationship with the manufacturer — a pinned DID and a WMP
connection — but usually none with the manufacturer's suppliers.

### 1. The product: DPP and conformance credential

1. Verify the manufacturer's product DPP per **Common procedure — verifying a published
   credential**, with the manufacturer's DID as `expected_issuer`.
2. Request the manufacturer's conformance credential(s) per **Common procedure —
   requesting a conformance credential over WMP**, with the manufacturer as holder. Pin the
   assessment body's DID separately from the manufacturer's.
3. If either check fails, stop and report it — the composition trace below is only worth
   anything once the product itself is established.

### 2. What it is made of: Make records and supplier DPPs

1. From the manufacturer's DID document, verify every published Make record per **Common
   procedure — verifying a published credential**, with the manufacturer's DID as
   `expected_issuer`. Keep those whose `outputProduct` links to the product DPP from step
   1.1; together they are the product's bill of materials as the manufacturer attests it.
2. For each Make record, follow its `inputProduct` link to the supplier DPP and verify it
   the same way, with the supplier's DID as `expected_issuer`. Also check the DPP's product
   ID and batch match the record's `inputProduct`.
3. Be explicit about where each supplier DID came from. If the buyer pinned it out of band
   (e.g. the supplier's own `did:web` domain), say so. If the only source is the
   manufacturer's signed Make record, say that instead: the supplier DPP is then trusted on
   the manufacturer's word, not independently.
4. Supplier conformance credentials are not available to the buyer. Report supplier claims
   as the supplier's self-declared or evidence-linked claims, not as assessed values the
   buyer has seen.

### 3. Reporting

Answer in two parts:

- **The product** — what it is, who signed its DPP, which claims are backed by a
  conformance credential the buyer received and checked, and by which assessment body.
- **What it is made of** — one line per component: supplier product, batch and quantity
  from the Make record, whether its DPP verified, which DID signed it, and how that DID was
  pinned. Name any Make record that links to a missing or failing supplier DPP.
- If possible, create a credential trust graph describing the relationships between the DPPs,
  Make Records and Conformance Credentials.

## Owner — checking a finished product

The owner has no prior relationship and sees only public data.

1. Resolve `expected_issuer` for the manufacturer from the product itself or the seller's
   site, and say which — for an owner this is the weakest link and should be stated.
2. Verify the product DPP and its Make records per **Common procedure — verifying a
   published credential**.
3. Each Make record links to a supplier DPP, which is public and can be verified the same
   way — but only against a supplier DID the owner can pin independently. Conformance
   credentials are private; report that claims backed by them were not checked by the
   owner, only referenced.
4. Answer plainly: what the product is, who signed for it, which components went into it,
   and which of those statements this check actually established.
