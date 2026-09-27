---
slug: dpp-supply-chain
title: Digital Product Passport (DPP) supply chain workflow
summary: >-
  Carry a Digital Product Passport along a physical supply chain on the NOOP trust
  framework: a component supplier issues a batch passport that travels with the goods,
  customs clears the consignment at the border by asking for a handful of its claims,
  the manufacturer receives the cleared passport into its own wallet and issues a
  passport for the finished device that rolls up the component passports it holds, and
  the end owner checks that device against the DID that signed it. NOOP means there is
  no trust list behind any of this — every verifying step has to pin the issuer DID out
  of band, and this workflow says where.
questions:
  - id: role
    prompt: Which role are you acting in?
    required: true
    options: [supplier, customs, manufacturer, owner]
    hint: >-
      "supplier" = the component maker issuing a batch passport and the invoice that goes
      with it. "customs" = the border authority clearing a consignment, and — only on
      suspicion — requesting the invoice from the manufacturer to cross-check. "manufacturer"
      = the company receiving components and issuing a passport for what it builds from
      them. "owner" = whoever ends up with the finished product and wants to check it.
  - id: product
    prompt: "Supplier or manufacturer: what is the product — name, product IDs, and the batch or lot it covers?"
    required: false
    hint: >-
      A passport covers a batch, not a single item, unless you say otherwise. Give the
      product IDs as URNs (urn:gtin:…) so a verifier can filter on them later.
  - id: passport_claims
    prompt: "Supplier or manufacturer: what does the passport need to carry — origin, tariff code, materials, footprint, conformity?"
    required: false
    hint: >-
      Whatever the credential type configured in your wallet defines. Customs typically
      needs country of origin, HS tariff code, manufacturer identifier and a conformity
      claim. If a claim is independently assessed, link the conformance credential the
      supplier already holds for it via that claim's `evidence` rather than restating the
      assessment inline.
  - id: consignment
    prompt: "Supplier or customs: what ties the passport to the physical goods — consignment, declaration or shipment reference?"
    required: false
    hint: >-
      The passport proves what the goods are, not that these are those goods. Record the
      reference the paperwork already uses so the two can be matched — the same reference
      also ties the invoice to this consignment.
  - id: invoice_details
    prompt: "Supplier: invoice number, issue date, seller and buyer registration/VAT details, amount due, VAT amount and currency — and do you have the underlying invoice document to hash?"
    required: false
    hint: >-
      These follow WEBUILD's `eu.we-build:einvoice:1` eInvoice attestation, itself EN 16931
      field names carried as SD-JWT VC claims — record an `invoiceNumber` against the same
      `consignment` reference as the passport, since nothing here ties the two by a shared
      field. The credential does not embed the invoice document: it binds to it by
      `invoicePayloadHash`, a hash of the canonicalized invoice payload the user's own
      system produces. Never compute or invent this hash yourself — ask for it, or for the
      document to hash.
  - id: suspicion
    prompt: "Customs: is anything about the presented DPP suspicious enough to warrant checking the invoice too?"
    required: false
    hint: >-
      Only pursue this if something concrete doesn't add up — a mismatched figure, an
      unexpected batch, a claim that doesn't reconcile. Routine clearance stops at the DPP;
      chasing an invoice for every consignment defeats the point of asking for less.
  - id: disclosure
    prompt: "Owner: how much of the product passport do you need to see?"
    required: false
    options: [border-check, full-passport]
    hint: >-
      "border-check" asks only for origin, tariff code, manufacturer identifier, a
      conformity claim's reference (not the assessment behind it) and batch. "full-passport"
      asks for everything. Ask for less: what you do not request is not disclosed, and a
      passport usually carries commercially sensitive figures you have no business seeing.
      Customs no longer chooses here — it only ever reads the supplier's published public
      profile, at a fixed disclosure level.
  - id: expected_issuer
    prompt: "Customs, manufacturer or owner: which DID do you expect to have signed this credential, and how do you know it?"
    required: false
    hint: >-
      NOOP has no trust list, so this is the whole of your trust decision — made separately
      for each credential kind you check. A DPP's issuer is the supplier; a conformance
      credential's issuer is the assessment body that assessed it, a different DID the
      manufacturer has to pin on its own. Source it from the counterparty's own website
      (did:web), a contract, or an onboarding pack — never from the presentation you are
      checking.
  - id: subparts
    prompt: "Manufacturer: which component passports go into this product, and which figures roll up from them?"
    required: false
    hint: >-
      The point of holding component passports — and fetching the conformance credentials
      behind their claims — is that your own numbers are derived from them rather than
      estimated. Name the credentials and the claims they contribute, and say which figures
      came from a conformance credential rather than the component passport's own
      self-declared claim.
  - id: channel
    prompt: How should the exchange travel?
    required: false
    options: [url-qr, wmp]
    hint: >-
      "url-qr" produces a link or QR for the other party to open. "wmp" sends it over an
      established WMP connection, which suits parties that trade repeatedly. This choice
      does not apply to the invoice: an invoice always travels over WMP, never `url-qr` —
      it needs a mutually authenticated channel, not a link anyone who intercepts it could
      open.
---

# Digital Product Passport (DPP) supply chain workflow

A Digital Product Passport follows a physical thing through the hands that make, clear,
assemble and buy it. Each hand does one of three things with it: **issue** one, **verify**
one, or **hold** one and issue a new one derived from it. This workflow covers all four
roles in one chain; `role` decides which part you follow.

The order matters and is easy to get wrong: the border sits **between** the supplier and
the factory. A consignment is cleared on the supplier's passport before the manufacturer
ever holds it, so customs is verifying a credential presented by the party shipping the
goods — not by the party receiving them.

The passport itself travels one way, publicly: the supplier publishes it once, and customs
and the manufacturer both read that same published copy. The conformance credential behind
a performance claim travels differently — it is never published, so a party that needs more
than the claim's bare reference has to ask the supplier for it directly, over OIDC4VP or
WMP, each time.

## What NOOP changes

On IDTL or EBSI, "verified" carries an accreditation: the issuer is on a trust list, and
the list is the reason to believe them. **The NOOP trust framework has no list.** A
signature check tells you the credential was signed by a particular DID and has not been
tampered with. It tells you nothing at all about who that DID belongs to.

So every verifying step in this workflow has an extra obligation: compare the issuer DID
against a value you obtained **out of band** — `expected_issuer` — and treat a passport
signed by anything else as unverified, however cleanly the signature checks out. Sources
worth trusting are the counterparty's own domain (`did:web:…`), a signed contract, or an
onboarding pack exchanged before any goods moved. A DID read out of the presentation you
are checking is not a source; it is the claim you are testing.

State this limitation when reporting any result to the user. "Signed by
`did:web:supplier.example`, which matches the DID in your supplier record" is an honest
verification on NOOP. "Verified" on its own is not.

This applies separately to every credential kind you touch, not once per chain. A
conformance credential's issuer is the assessment body that assessed it, not the supplier
who holds and presents it — checking the DPP's issuer tells you nothing about who signed
the assessment behind one of its claims, and the two DIDs have to be pinned independently.

## Credential types

Four credential kinds move through this workflow, from three different sources — an
owner-defined wallet type, a UNTP standard, and a WEBUILD (eIDAS 2 / EBW ecosystem)
attestation. Call `IssuerCredentialTypesList` to see what the wallet actually has before
assuming any of them exist.

- **Component/batch passport** — issued by the supplier, covers a batch of parts. UNTP
  `DigitalProductPassport`. Wallet config ID `component_batch_passport` below.
  Schema: <https://untp.unece.org/artefacts/schema/v0.7.0/dpp/DigitalProductPassport.json>.
  *This credential is self-issued*
- **Product passport** — issued by the manufacturer for the finished product, referencing
  the component passports that went into it. Same UNTP type and schema as above; a batch
  and a finished good are told apart by `credentialSubject.identificationGranularity`
  (`"batch"` vs item-level) and `credentialSubject.batchNumber`, not by a different VC
  type. Wallet config ID `product_passport` below.
- **Conformance credential (DCC)** — a UNTP `DigitalConformityCredential`, issued by a
  conformity assessment body, not by the supplier. The supplier only holds it — this
  workflow never issues one — and a DPP's `performanceClaim[*].evidence` links to the
  conformance credential(s) that back that claim, by the credential's own `id`.
  Schema: <https://untp.unece.org/artefacts/schema/v0.7.0/dcc/ConformityCredential.json>.
- **Invoice** — a WEBUILD `eInvoice` attestation (`vct: eu.we-build:einvoice:1`), issued
  by the supplier to the manufacturer. Unlike the two passport types it is never published
  or requested by a URL or QR — it always travels over WMP, mirroring WEBUILD's own SC5
  Scenario 4 profile, which is wallet-to-wallet and machine-to-machine with no offline or
  URL-based path either. It is SD-JWT VC, not W3C VCDM — WEBUILD specifies no VCDM or mdoc
  encoding for this type — and its EN 16931 invoice fields (amount, currency, buyer,
  seller, VAT) are carried as private claims rather than embedded as a document; the
  credential binds to the real invoice payload by `invoicePayloadHash` rather than
  attaching it. Wallet config ID `invoice` below. **Schema:** no JSON Schema or SD-JWT VC
  type-metadata document is published for `eu.we-build:einvoice:1` — the WEBUILD rulebook
  itself calls the `vct` value "proposed, subject to registration" (WE BUILD Attestation
  Rulebooks Catalogue, *eInvoice* rulebook v0.71). Its field-by-field definition lives in
  that rulebook rather than at a schema URL; the base attestation-verification obligations
  it references are published at
  <https://github.com/webuild-consortium/webuild-attestation-rulebooks-catalog/blob/main/rulebooks/rb-base/verifier-base-verification.md>.

This workflow borrows WEBUILD's *data model* for the invoice — the claim names and the
EN 16931 semantics behind them — not its production trust machinery. WEBUILD anchors trust
in an EBWOID (organisational identity attestation) chain and a List of Trusted Entities;
NOOP has neither, so `expected_issuer` pinning does the same job here that it does for the
DPP and the DCC.

The manufacturer holds the invoice the same way it holds a component passport: it did not
issue it, so when customs later asks for it, the manufacturer presents it and customs
checks it against the *supplier's* `expected_issuer` — the same DID already pinned for the
DPP, not a new one.

## Wallet configuration

These are worked NOOP wallet configuration snippets for this workflow. They are examples
to adapt, not something to load verbatim — check what the wallet already has with
`IssuerCredentialTypesList` before assuming an ID below is present. The rest of this
workflow refers to credentials and verifiers by the IDs defined here
(`component_batch_passport`, `product_passport`, `invoice`, `dpp_border_check_disclosure`,
`dpp_full_passport_disclosure`, `dpp_conformance_credential_disclosure`,
`invoice_disclosure`).

### Issuer wallet — supplier and manufacturer

One `credentialIssuers` entry per passport type, plus one for the invoice (supplier only).
All three use the `IssuanceQueue` issuance mode: claim values are gathered from the user
(`product`, `passport_claims`, `consignment`, `invoice_details`, or the rolled-up figures
for a product passport) and supplied per request when `CredentialCreate`/
`CredentialIssuanceInit` run — nothing here is presentation-driven. The invoice differs from
the two passports in format: `sd_jwt_vc`, not `jwt_vc_vcdm`, because that is the only
encoding WEBUILD specifies for this attestation type, and its `credentialType` is the `vct`
`eu.we-build:einvoice:1` rather than a VCDM type array. `disclosableClaims` lists exactly
the fields the WEBUILD rulebook marks disclosable (`MAY`, or `MUST` for
`paymentInstructions`) — the rest (`iss`, `iat`, `exp`, `vct`, `status`, `cnf`,
`attestation_legal_category`, `invoicePayloadHash`, `invoiceLifecycleStatus`,
`precedingInvoiceReference`) are marked `MUST NOT` be selectively disclosable, so they are
left out of the list and always travel in the clear.

```json
{
  "name": "DPP Issuer",
  "description": "Issues component/batch passports, product passports and invoices on the NOOP trust framework.",
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
      }
    ],
    "oidcRevision": { "oidc4vci": "Draft15", "oidc4vp": "Draft23" }
  }
}
```

`invoice` is only ever used by the supplier — the manufacturer's copy of this workflow's
issuer wallet config does not need it, since the manufacturer only ever holds an invoice,
never issues one.

This workflow does not add a `credentialIssuers` entry for the conformance credential. The
supplier already holds it — issued out of band by a conformity assessment body, before this
workflow starts — and presents it on request through the wallet's ordinary holder consent
flow (`HolderCredentialsPresentAfterConsent`). Presenting an already-held credential needs
no issuer-side configuration at all.

### Verifier wallet — manufacturer, owner, and customs on suspicion

One `credentialVerifiers` entry per `disclosure` level, one that targets the conformance
credential directly rather than the DPP, and one for the invoice. The first three use
`presentationDefinition` (DIF Presentation Exchange) with paths prefixed `$.vc.…`, because
those definitions serve W3C VCDM credentials fetched over OIDC4VP/WMP — the same prefix the
filters under **Narrowing an interactive request** append onto, and a different path shape
from the `HolderLinkedVpCreate` presentation definition under **Supplier**, which addresses
an unwrapped credential and so has no `$.vc.` prefix. `invoice_disclosure` uses `dcqlQuery`
instead, because the invoice is SD-JWT VC, and because the wallet's own guidance is to
always use DCQL when interfacing with anything from the eIDAS 2 / EBW / WEBUILD ecosystem.

```json
{
  "name": "DPP Verifier",
  "description": "Verifies product passports at border-check or full-passport disclosure, conformance credentials, and invoices, on the NOOP trust framework.",
  "config": {
    "trustFramework": "NOOP",
    "walletKeyIdentifier": "did",
    "credentialVerifiers": [
      {
        "id": "dpp_border_check_disclosure",
        "name": "DPP — border check",
        "presentationDefinition": {
          "format": { "jwt_vc": { "alg": ["ES256"] }, "jwt_vp": { "alg": ["ES256"] } },
          "id": "dpp_border_check_presentation",
          "input_descriptors": [
            {
              "id": "dpp_border_check",
              "constraints": {
                "fields": [
                  {
                    "name": "Credential type",
                    "path": ["$.vc.type"],
                    "filter": { "type": "array", "contains": { "const": "DigitalProductPassport" } }
                  },
                  {
                    "name": "Country of origin",
                    "path": ["$.vc.credentialSubject.countryOfProduction.countryCode"]
                  },
                  {
                    "name": "HS tariff code",
                    "path": ["$.vc.credentialSubject.productCategory[?(@.schemeName=='Harmonized System')].code"]
                  },
                  {
                    "name": "Manufacturer identifier",
                    "path": ["$.vc.credentialSubject.relatedParty[?(@.role=='manufacturer')].party.id"]
                  },
                  {
                    "name": "Batch number",
                    "path": ["$.vc.credentialSubject.batchNumber"]
                  },
                  {
                    "name": "Conformity claim",
                    "path": ["$.vc.credentialSubject.performanceClaim[*].id"],
                    "optional": true
                  }
                ]
              }
            }
          ]
        }
      },
      {
        "id": "dpp_full_passport_disclosure",
        "name": "DPP — full passport",
        "presentationDefinition": {
          "format": { "jwt_vc": { "alg": ["ES256"] }, "jwt_vp": { "alg": ["ES256"] } },
          "id": "dpp_full_passport_presentation",
          "input_descriptors": [
            {
              "id": "dpp_full_passport",
              "constraints": {
                "fields": [
                  {
                    "name": "Credential type",
                    "path": ["$.vc.type"],
                    "filter": { "type": "array", "contains": { "const": "DigitalProductPassport" } }
                  }
                ]
              }
            }
          ]
        }
      },
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
                  },
                  {
                    "name": "Conformity topic",
                    "path": ["$.vc.credentialSubject.conformityAssessment[*].conformityTopic.name"]
                  },
                  {
                    "name": "Conformance result",
                    "path": ["$.vc.credentialSubject.conformityAssessment[*].conformance"]
                  },
                  {
                    "name": "Assessed performance",
                    "path": ["$.vc.credentialSubject.conformityAssessment[*].assessedPerformance"]
                  },
                  {
                    "name": "Reference scheme",
                    "path": ["$.vc.credentialSubject.referenceScheme.name"],
                    "optional": true
                  }
                ]
              }
            }
          ]
        }
      },
      {
        "id": "invoice_disclosure",
        "name": "eInvoice",
        "dcqlQuery": {
          "credentials": [
            {
              "id": "einvoice",
              "format": "dc+sd-jwt",
              "meta": { "vct_values": ["eu.we-build:einvoice:1"] },
              "claims": [
                { "path": ["invoiceNumber"] },
                { "path": ["issueDate"] },
                { "path": ["sellerLegalRegistrationIdentifier"] },
                { "path": ["sellerRegistrationName"] },
                { "path": ["sellerVatIdentifier"] },
                { "path": ["buyerLegalRegistrationIdentifier"] },
                { "path": ["buyerVatIdentifier"] },
                { "path": ["amountDueForPayment"] },
                { "path": ["invoiceTotalVatAmount"] },
                { "path": ["InvoiceCurrencyCode"] }
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

`dpp_border_check_disclosure` is the `border-check` option for `disclosure` — it names
exactly the fields customs needs and nothing else, and it is also what the supplier
publishes as its LinkedVerifiablePresentation (`dpp_border_check_presentation`; see
**Supplier → Issuing the batch passport**, step 7), so the public profile and the
border-check request stay the same shape by construction. `dpp_full_passport_disclosure` is the `full-passport` option — an
`input_descriptor` with only a type filter and no field list returns the whole matching
credential — used when a party (normally the owner) needs the product passport disclosed
interactively rather than reading a published copy. `dpp_conformance_credential_disclosure`
is unrelated to `disclosure`: it targets the `DigitalConformityCredential` type instead of
the DPP, and is what the manufacturer uses to fetch the assessment behind a performance
claim's `evidence` link. `invoice_disclosure` targets the WEBUILD `vct`
`eu.we-build:einvoice:1` by DCQL, requesting the invoice header fields customs would need
to cross-check a consignment; it is what customs uses on suspicion, against the
manufacturer, not the supplier.

### Narrowing an interactive request

This only applies when one of the verifiers above is used interactively, over OIDC4VP or
WMP — the manufacturer fetching a conformance credential, the owner fetching a product
passport, or customs requesting an invoice on suspicion. The DPP itself is never narrowed
this way, for customs or the manufacturer: both read it from the supplier's published
Linked VP instead, which is whatever the supplier published, not a live request.

To ask for a specific batch or product rather than any credential of that type, add a
custom query fragment at `$.input_descriptors[0].constraints.fields[-1]` of
`dpp_border_check_disclosure` or `dpp_full_passport_disclosure`:

```json
{
  "name": "Batch filter",
  "path": ["$.vc.credentialSubject.batchNumber"],
  "filter": {
    "type": "string",
    "const": "<PLACE THE BATCH NUMBER HERE!!!>"
  }
}
```

For a product ID, which is an array of URNs:

```json
{
  "name": "Product ID filter",
  "path": ["$.vc.credentialSubject.productIds"],
  "filter": {
    "type": "array",
    "contains": { "const": "<PLACE THE PRODUCT ID HERE!!!>" }
  }
}
```

To pin `dpp_conformance_credential_disclosure` to the specific conformance credential a
claim's `evidence` points to, rather than accepting any credential of that type, filter on
its `id` — the same URL the DPP claim's `evidence[].linkURL` names:

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

`invoice_disclosure` cannot be narrowed the same way: it is a `dcqlQuery`, not a
`presentationDefinition`, and the wallet's documentation does not demonstrate constraining
a DCQL claims query to one exact value the way DIF PE's `filter`/`const` does. Ask for the
full claim set and check the returned `invoiceNumber` against the one the supplier recorded
against this `consignment` at issuance, rather than trying to filter for it server-side.

## Prerequisites — all roles

- A wallet whose `config.trustFramework` is `NOOP` and whose `walletKeyIdentifier` is
  `did`. The `Triveria Organization` and `Triveria Holder` templates are both NOOP.
- No onboarding step. This is the point of NOOP: nothing to accredit against, nothing to
  wait for. Confirm with `WalletConfigurationVerify` and get the wallet's own DID with
  `WalletIdentifierGet` — the counterparties will be pinning it.
- For `channel: wmp`, an established WMP connection (`WmpEntityList`; otherwise
  `WmpCreateNewInvitation` / `WmpAcceptInvitation`).

## Common procedure — verifying a credential presented over OIDC4VP or WMP

Shared by every role that asks a counterparty to present a credential live, rather than
reading one already published: the manufacturer fetching a conformance credential, the
owner checking a product passport, and customs requesting an invoice on suspicion. Customs
never uses this for the DPP itself — that always comes from the supplier's published Linked
Verifiable Presentation (see **Customs**).

1. Choose the verifier definition for what you're asking for (a `credentialVerifiers` ID
   from **Wallet configuration**), then initialise the request with `VerifierInitUrlCreate`,
   or send it over WMP for `channel: wmp`. Note the returned verifier state — it identifies
   this request. If you have no existing channel to the counterparty at all — as with
   customs reaching the manufacturer for the first time — see **Customs → Requesting an
   invoice on suspicion** for how to offer both an OIDC4VP link and a WMP invitation
   out of band instead of picking one for them.
2. Wait for the outcome by subscribing to the wallet's notifications
   (`WalletNotifications`) for `vp.verified` or `vp.invalid`, narrowed to that state.
   Do **not** poll `WalletNotificationHistory` for it: history is for looking back at
   what already happened, not for detecting something that has not happened yet.
3. Read the presented credential with `WalletVerifiedCredentialsByState`.
4. Check the following properties of the credential, in this order:
   1. The issuer DID equals `expected_issuer` for **this** credential. If it does not, the
      result is **not verified**, whatever the signature says — and remember that
      `expected_issuer` is decided per credential kind: a DPP's issuer is the supplier, a
      conformance credential's issuer is the assessment body that assessed it, and neither
      implies the other.
   2. The credential is neither expired nor revoked.
   3. Whatever the request was meant to confirm actually matches — batch/product IDs
      against the consignment, or a conformance credential's assessed object against the
      claim it is meant to back.
5. Report the outcome naming the DID that signed it and where the user's expectation of
   that DID came from.

## Supplier — issuing a batch passport

The supplier also holds one or more conformance credentials — `DigitalConformityCredential`s
issued to it by a conformity assessment body before this workflow starts. Nothing here
issues those; they are expected already in the wallet, and the DPP being issued only links
to them.

### Issuing the batch passport

1. Gather the data for `product`, `passport_claims` and `consignment`. Ask for anything
   missing rather than guessing: a passport with an invented batch number is worse than
   no passport, because it will verify. For any claim backed by independent assessment,
   find the conformance credential the supplier already holds for it (`CredentialList`)
   and use its `id` as that claim's `evidence[].linkURL` — link to the assessment, don't
   restate it.
2. Confirm the credential type exists with `IssuerCredentialTypesList` — it should list
   `component_batch_passport` (see **Wallet configuration** above).
3. Create the credential with `CredentialCreate` against `component_batch_passport`, then
   `CredentialIssuanceInit`.
4. Produce the offer for the receiving party:
   - `channel: url-qr` — `IssuerInitiatePreauthOffer` for a pre-authorised offer, or
     `IssuerInitiateAuthOffer` where the holder must authenticate first.
   - `channel: wmp` — send the offer over the connection to the manufacturer's entity.
5. Give the user the offer URL or QR **and** the wallet's own DID from
   `WalletIdentifierGet`. The DID is not a detail: it is what every downstream verifier
   will pin, and it has to reach them by a channel other than the passport.
6. Record the consignment reference against the batch so the goods and the passport can
   be matched at the border.
7. Publish the public subset of the DPP claims as a LinkedVerifiablePresentation in the
   DID document of the supplier (`HolderLinkedVpCreate`). Use the presentation definition from
   the DPP verifier wallet config - `dpp_border_check_presentation`. This is the only copy of
   the DPP customs will ever see, and the copy the manufacturer reads first too.
8. Nothing further to configure for the conformance credential(s) held in this wallet: when
   the manufacturer later requests one over WMP/OIDC4VP against
   `dpp_conformance_credential_disclosure`, the wallet's ordinary holder consent flow
   (`HolderCredentialsPresentAfterConsent`) presents whichever already-held credential
   matches. A credential this wallet did not issue needs no issuer-side setup to present.

### Issuing the invoice

The invoice always travels over WMP, regardless of `channel` — there is no `url-qr` path
for it, because it needs a mutually authenticated connection rather than a link anyone who
intercepts it could open.

1. Gather `invoice_details`, tied to the same `consignment` reference as the passport.
   Record the `invoiceNumber` against that `consignment` somewhere durable — the credential
   carries no shared field linking it back to the batch, so this mapping only exists where
   the user keeps it.
2. If the user has the underlying invoice document (or its canonicalized payload), compute
   `invoicePayloadHash` over it per the rulebook's binding rule (IR-EI-03) and include it as
   a claim. Ask for the document or the hash rather than inventing one — an invoice claiming
   a hash of nothing is worse than no invoice, for the same reason a fabricated batch number
   is worse than no passport.
3. Check whether a WMP connection with the manufacturer already exists
   (`WmpEntityConnectionGet` / `WmpEntityList(walletId, "client")`). If not, create one now
   (`WmpCreateNewInvitation`) and get it accepted before continuing — an invoice cannot
   fall back to a link the way the passport offer can.
4. Create the credential with `CredentialCreate` against `invoice`, then
   `CredentialIssuanceInit` against the manufacturer's DID (`clientId`), then push the offer
   over the WMP connection — `IssuerInitiateAuthOffer` with `wmpEntityId` set, which returns
   204 and no offer URL; the manufacturer's wallet gets a `wmp.credential_offer`
   notification instead.
5. Report the outcome once `WalletNotificationGetByState` shows `offer.processed` for this
   offer.

## Customs — clearing a consignment at the border

For the DPP itself, customs only ever checks the public profile — it never opens an
interactive OIDC4VP/WMP request for it, and never sees more than
`dpp_border_check_presentation` discloses. The one exception is the invoice, and only on
suspicion.

### Checking the DPP

1. Establish `expected_issuer` before asking for anything. If the user cannot say which
   DID should have signed the passport, stop and say so — there is nothing to verify
   against on NOOP.
2. Fetch and check the supplier's published Linked Verifiable Presentation of the DPP
   matching the consignment (`VerifierLinkedVpVerify`).
3. Check the following properties of the credential, in this order:
   1. The issuer DID equals `expected_issuer`. If it does not, the result is **not
      verified**, whatever the signature says.
   2. The credential is neither expired nor revoked.
   3. The batch and product IDs match the consignment in front of you.
4. Report the outcome naming the DID that signed it and where the user's expectation of
   that DID came from.
5. Ask about `suspicion`. If nothing about the DPP or the paperwork around it is in
   question, stop here — routine clearance never touches the invoice.

### Requesting an invoice on suspicion

Customs has no existing relationship with the manufacturer the way it does with the
supplier, so this is cold outreach, not a request over an established channel. Give the
manufacturer the choice of how to respond rather than picking for them.

1. Get the manufacturer's contact details from the DPP's `relatedParty` entry with
   `role: manufacturer`, from the consignment paperwork, or by asking the user. Do not
   guess an address.
2. Prepare both channels rather than choosing one:
   1. An OIDC4VP request: `VerifierInitUrlCreate` against `invoice_disclosure`. This asks
      for the invoice header fields, not a specific invoice — see **Narrowing an
      interactive request** for why it can't be pinned to this consignment up front, and
      confirm the match afterward instead. Note the verifier state.
   2. A WMP invitation, in case the manufacturer would rather open an ongoing connection:
      `WmpCreateNewInvitation`.
3. Compose an email to the manufacturer with both links and a short explanation that either
   one lets them present the invoice for this consignment. If an email-sending tool is
   available and authorised for this session, send it directly; otherwise draft the
   complete email — recipient, subject, body, both links — and hand it to the user to send.
   Never claim to have sent an email that wasn't actually sent through a real tool.
4. Wait for whichever the manufacturer used: `vp.verified`/`vp.invalid` on the OIDC4VP
   verifier state from 2.1, or `wmp.invitation_accepted` on the invitation from 2.2 — if
   they accept the invitation instead, send the same `invoice_disclosure` request over the
   new WMP connection once it is authenticated, then wait on that verifier state.
5. Once presented, check it exactly as in **Common procedure**, with one difference:
   `expected_issuer` for the invoice is the *supplier's* DID, already pinned in **Checking
   the DPP** — the manufacturer only holds and presents this credential, it did not issue
   it. The invoice carries no field that names the consignment directly, so confirm the
   match by asking the supplier (or the manufacturer) which `invoiceNumber` was recorded
   against this `consignment` at issuance, and check the presented `invoiceNumber` against
   that.
6. Report the outcome, naming both DIDs involved: the supplier's, which signed the invoice,
   and the manufacturer's, which presented it.

## Manufacturer — receiving components, then issuing a product passport

The manufacturer plays two roles in sequence: holder of what its suppliers issued, then
issuer of its own. The second depends on the first, which is the whole argument for
holding component passports — the figures in the product passport are derived from
credentials already in the wallet rather than estimated from an industry average.

### Receiving

The manufacturer gets the DPP itself exactly as customs does — from the supplier's
published Linked Verifiable Presentation, not an interactive exchange. But that public
profile only carries `evidence` links for conformity claims, not the assessments behind
them, and the manufacturer needs those to derive its own product passport honestly. Getting
them means asking the supplier directly, one conformance credential at a time, for what it
holds — and separately, accepting the invoice the supplier pushes over WMP.

1. Read and check the supplier's published Linked Verifiable Presentation of the DPP
   matching the consignment (`VerifierLinkedVpVerify`), exactly as in **Customs → Checking
   the DPP**, steps 2–3.
2. For each performance claim that needs independent backing, note its
   `evidence[].linkURL` — that identifies the conformance credential to request next. This
   request is manual: confirm with the user which claims are worth independently checking
   rather than fetching every referenced conformance credential automatically.
3. Check whether a WMP connection with the supplier was already established
   (`WmpEntityConnectionGet`). If yes, proceed through WMP. If not, ask the user whether to
   fall back on OIDC4VP or to establish a new WMP connection.
4. Follow **Common procedure — verifying a credential presented over OIDC4VP or WMP**
   against `dpp_conformance_credential_disclosure` for each conformance credential the user
   confirmed in step 2, narrowing the request to the `evidence` link if more than one is in
   play (see **Narrowing an interactive request**). `expected_issuer` here is the assessment
   body's DID, not the supplier's — pin it separately.
5. Separately, accept the invoice the supplier pushes over WMP: wait for a
   `wmp.credential_offer` notification, call `WmpClientProcessRequest` to get the
   `interactionId` and authorization requirements, then `HolderOfferProcessAfterConsent` to
   accept it into the wallet. This is push-driven, not something the manufacturer requests —
   it arrives once the supplier issues it.

### Issuing the product passport

1. Read the component passport(s) from the Linked VP check in **Receiving**, and the
   conformance credential(s) fetched there (`WalletVerifiedCredentialsByState` with the
   verifier state from each request).
2. Derive the rolled-up claims from them, and say which source backs each figure: a
   component passport's self-declared `performanceClaim`, an independently assessed value
   from its conformance credential, or a sum the manufacturer computed across several
   components. A measured figure, an assessed figure and an estimate are three different
   claims that can look identical as a bare number, and the difference is the reason any of
   this is worth doing.
3. Reference the component passports — and, where used, the conformance credentials behind
   them — in the product passport so a downstream verifier can follow the chain rather than
   take the total on trust.
4. Issue as in **Supplier → Issuing the batch passport** above, from step 2, against
   `product_passport` instead of `component_batch_passport`.
5. If a component passport, or a conformance credential it depends on, is missing, expired
   or fails its issuer check, report which one and what it blocks. Do not issue a product
   passport that silently omits it — a rolled-up figure with a hole in it is an estimate
   wearing a signature.

## Owner — checking a finished product

The owner is a verifier with no prior relationship and usually no wallet of their own,
so the check is narrower and the reporting has to be plainer.

### Steps

1. Follow **Common procedure — verifying a credential presented over OIDC4VP or WMP**
   above, against `dpp_border_check_disclosure` or `dpp_full_passport_disclosure` per
   `disclosure`, to verify the product passport.
2. Resolve `expected_issuer` from the product itself or the seller's site, and say which
   it was. For an owner this is the weakest link in the chain and should be stated, not
   glossed.
3. If the passport references component passports or conformance credentials, report what
   it claims about them — where the components were made, what was independently assessed
   — and be explicit that those are claims carried by this credential, not credentials this
   check verified. Verifying them means asking their issuers, which an owner generally
   cannot do.
4. Answer in plain terms: what the thing is, who signed for it, where its parts came from,
   and which of those statements this check actually established.