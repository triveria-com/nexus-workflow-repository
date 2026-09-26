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
      "supplier" = the component maker issuing a batch passport. "customs" = the border
      authority clearing a consignment. "manufacturer" = the company receiving components
      and issuing a passport for what it builds from them. "owner" = whoever ends up with
      the finished product and wants to check it.
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
      needs country of origin, HS tariff code, manufacturer identifier and conformity;
      everything else is there for the parties further down the chain.
  - id: consignment
    prompt: "Supplier or customs: what ties the passport to the physical goods — consignment, declaration or shipment reference?"
    required: false
    hint: >-
      The passport proves what the goods are, not that these are those goods. Record the
      reference the paperwork already uses so the two can be matched.
  - id: disclosure
    prompt: "Customs or owner: how much of the passport do you need to see?"
    required: false
    options: [border-check, full-passport]
    hint: >-
      "border-check" asks only for origin, tariff code, manufacturer identifier,
      conformity and batch. "full-passport" asks for everything. Ask for less: what you
      do not request is not disclosed, and a passport usually carries commercially
      sensitive figures you have no business seeing.
  - id: expected_issuer
    prompt: "Customs, manufacturer or owner: which DID do you expect to have signed this passport, and how do you know it?"
    required: false
    hint: >-
      NOOP has no trust list, so this is the whole of your trust decision. A DID from the
      supplier's own website (did:web), a contract, or an onboarding pack — not one taken
      from the presentation you are checking.
  - id: subparts
    prompt: "Manufacturer: which component passports go into this product, and which figures roll up from them?"
    required: false
    hint: >-
      The point of holding component passports is that your own numbers are derived from
      them rather than estimated. Name the credentials and the claims they contribute.
  - id: channel
    prompt: How should the exchange travel?
    required: false
    options: [url-qr, wmp]
    hint: >-
      "url-qr" produces a link or QR for the other party to open. "wmp" sends it over an
      established WMP connection, which suits parties that trade repeatedly.
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

## Credential types

Both types are owner-defined — with no external registry, the wallet's own credential
type configuration is the schema. Call `IssuerCredentialTypesList` to see what the wallet
actually has before assuming either exists.

- **Component/batch passport** — issued by the supplier, covers a batch of parts.
- **Product passport** — issued by the manufacturer for the finished product, referencing
  the component passports that went into it.

## Prerequisites — all roles

- A wallet whose `config.trustFramework` is `NOOP` and whose `walletKeyIdentifier` is
  `did`. The `Triveria Organization` and `Triveria Holder` templates are both NOOP.
- No onboarding step. This is the point of NOOP: nothing to accredit against, nothing to
  wait for. Confirm with `WalletConfigurationVerify` and get the wallet's own DID with
  `WalletIdentifierGet` — the counterparties will be pinning it.
- For `channel: wmp`, an established WMP connection (`WmpEntityList`; otherwise
  `WmpCreateNewInvitation` / `WmpAcceptInvitation`).

## Supplier — issuing a batch passport

### Steps

1. Gather the data for `product`, `passport_claims` and `consignment`. Ask for anything
   missing rather than guessing: a passport with an invented batch number is worse than
   no passport, because it will verify.
2. Confirm the credential type exists with `IssuerCredentialTypesList`.
3. Create the credential with `CredentialCreate`, then `CredentialIssuanceInit`.
4. Produce the offer for the receiving party:
   - `channel: url-qr` — `IssuerInitiatePreauthOffer` for a pre-authorised offer, or
     `IssuerInitiateAuthOffer` where the holder must authenticate first.
   - `channel: wmp` — send the offer over the connection to the manufacturer's entity.
5. Give the user the offer URL or QR **and** the wallet's own DID from
   `WalletIdentifierGet`. The DID is not a detail: it is what every downstream verifier
   will pin, and it has to reach them by a channel other than the passport.
6. Record the consignment reference against the batch so the goods and the passport can
   be matched at the border.

## Customs — clearing a consignment at the border

### Steps

1. Establish `expected_issuer` before asking for anything. If the user cannot say which
   DID should have signed the passport, stop and say so — there is nothing to verify
   against on NOOP.
2. Choose the verifier definition matching `disclosure`. Prefer `border-check`: request
   country of origin, HS tariff code, manufacturer identifier, conformity and batch, and
   leave the rest alone.
3. Initialise the request with `VerifierInitUrlCreate`, or send it over WMP for
   `channel: wmp`. Note the returned verifier state — it identifies this request.
4. Wait for the outcome by subscribing to the wallet's notifications
   (`WalletNotifications`) for `vp.verified` or `vp.invalid`, narrowed to that state.
   Do **not** poll `WalletNotificationHistory` for it: history is for looking back at
   what already happened, not for detecting something that has not happened yet.
5. Read the presented credential with `WalletVerifiedCredentialsByState`, then check, in
   this order:
   1. The issuer DID equals `expected_issuer`. If it does not, the result is **not
      verified**, whatever the signature says.
   2. The credential is neither expired nor revoked.
   3. The batch and product IDs match the consignment in front of you.
6. Report the outcome naming the DID that signed it and where the user's expectation of
   that DID came from.

### Filtering the request

To ask for a specific batch rather than any passport of that type, add a custom query
fragment at `$.input_descriptors[0].constraints.fields[-1]`:

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

## Manufacturer — receiving components, then issuing a product passport

The manufacturer plays two roles in sequence: holder of what its suppliers issued, then
issuer of its own. The second depends on the first, which is the whole argument for
holding component passports — the figures in the product passport are derived from
credentials already in the wallet rather than estimated from an industry average.

### Receiving

1. Take the offer from the supplier — `HolderOfferPassAuthInfo`, then
   `HolderOfferProcessAfterConsent`.
2. Before treating it as usable, apply the same issuer check customs applied: the issuer
   DID must equal `expected_issuer`. Accepting a credential stores it; it does not
   endorse it.
3. Confirm it is held with `CredentialList`.

### Issuing the product passport

1. Read the component passports out of the wallet — `CredentialList`, then
   `CredentialGet` for each one named in `subparts`.
2. Derive the rolled-up claims from them. Say in the credential which figures were summed
   from component passports and which were measured directly; a footprint that was added
   up is a different claim from one that was estimated, and the difference is the reason
   any of this is worth doing.
3. Reference the component passports in the product passport so a downstream verifier can
   follow the chain rather than take the total on trust.
4. Issue as in **Supplier** above, from step 2.
5. If a component passport is missing, expired or fails its issuer check, report which
   one and what it blocks. Do not issue a product passport that silently omits it — a
   rolled-up figure with a hole in it is an estimate wearing a signature.

## Owner — checking a finished product

The owner is a verifier with no prior relationship and usually no wallet of their own,
so the check is narrower and the reporting has to be plainer.

### Steps

1. Verify the product passport as in **Customs**, steps 3–5, using `disclosure` to decide
   how much to ask for.
2. Resolve `expected_issuer` from the product itself or the seller's site, and say which
   it was. For an owner this is the weakest link in the chain and should be stated, not
   glossed.
3. If the passport references component passports, report what it claims about them —
   where the components were made, what they contributed to the totals — and be explicit
   that those are claims carried by this credential, not credentials this check verified.
   Verifying them means asking their issuers, which an owner generally cannot do.
4. Answer in plain terms: what the thing is, who signed for it, where its parts came from,
   and which of those statements this check actually established.