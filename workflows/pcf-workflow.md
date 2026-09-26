---
slug: product-carbon-footprint
title: Product Carbon Footprint (PCF) workflow
summary: >-
  Run the Product Carbon Footprint credential exchange end to end: a PCF Auditor
  accredited on the trust list issues a PcfConformityCertificate attesting that a
  participant's PCF calculation conforms to the applicable standard, the participant
  self-issues a ProductCarbonFootprint credential aligned with the WBCSD PACT Tech Spec
  v2, and a relying party verifies the PCF declaration together with its conformity
  certificate and the issuer's organization identity in a single presentation.
questions:
  - id: role
    prompt: Which role are you acting in?
    required: true
    options: [participant, auditor, verifier]
    hint: >-
      "participant" = the company declaring a product's carbon footprint. "auditor" = the
      accredited assessment body issuing conformity certificates. "verifier" = the relying
      party (customer, regulator, marketplace) checking a declaration.
  - id: product
    prompt: "Participant: which product is this footprint for — name, your internal product IDs, and its CPC category?"
    required: false
    hint: PACT requires productNameCompany, productIds (as URNs), productCategoryCpc and productDescription.
  - id: declared_unit
    prompt: "Participant: what is the declared unit and the unitary product amount?"
    required: false
    hint: e.g. "kilogram" and 1000. The PCF figures are all per declared unit.
  - id: pcf_values
    prompt: "Participant: what are the PCF figures — PCF excluding biogenic, fossil GHG emissions, fossil carbon content, biogenic carbon content?"
    required: false
    hint: >-
      kg CO₂e per declared unit, except carbon contents which are kg C. State whether
      packaging emissions are included. For a reference period from 2025, PCF including
      biogenic, primary data share and the biogenic/land-use figures are required too.
  - id: reference_period
    prompt: "Participant: what reference period do the figures cover?"
    required: false
    hint: referencePeriodStart and referencePeriodEnd, ISO 8601.
  - id: methodology
    prompt: "Participant: which cross-sectoral standards and IPCC characterization factor sources were used, and what share of emissions is exempted?"
    required: false
    hint: PACT requires crossSectoralStandards, ipccCharacterizationFactorsSources, boundaryProcessesDescription, and exemptedEmissionsPercent (0–5).
  - id: conformity
    prompt: "Participant or auditor: what are the conformity certificate details — certificate ID, subject name, conformity level, validity, and assessment body?"
    required: false
    hint: The PcfConformityCertificate claims. As a participant, you receive these; as an auditor, you set them.
  - id: verification_scope
    prompt: "Verifier: do you need the PCF with its conformity certificate only, or also the issuer's Organization ID?"
    required: false
    options: [pcf-with-conformity, pcf-conformity-and-organization-id]
    hint: The wallet templates ship both presentation definitions — idtl_pcf_iso and idtl_pcf_iso_lpid.
---

# Product Carbon Footprint (PCF) workflow

A `ProductCarbonFootprint` credential is **self-issued** (`selfIssue: true`,
`draftFirst: true`) — the company declares its own footprint. What makes it credible is
that it is presented *together with* a `PcfConformityCertificate` from an auditor who is
itself accredited on the trust list. A verifier that checks only the PCF credential has
verified a self-assertion and nothing more.

Ask the questions above first; `role` decides which part you follow. Both credential
types are `jwt_vc_vcdm`, so presentation definitions match their type in the `$.vc.type`
array with `contains`.

## Credential schemas
- `ProductCarbonFootprint`: https://github.com/triveria-com/vcs/idunion/pcf.json
- `PcfConformityCertificate`: https://github.com/triveria-com/vcs/idunion/pcf-conformity-certificate.json

## Prerequisites - same for all roles

- The wallet holds a valid EBWOID credential (type `uri:eu.ebw.oid.1`). In case the EBWOID credential is missing, refer to `ebw-onboarding.md`.

## Verifier - Verifying a Product Carbon Footprint
### Pre-requisites
- The verifier has IDTL trust framework configured. Onboarding is not mandatory.

### Workflow
The `ProductCarbonFootprint` credential is valid only if presented together with `PcfConformityCertificate`.
Depending on the answer to `verification_scope`, presentation of `uri:eu.ebw.oid.1` credential MAY be required - choose the right verifier definition.

**Steps:**
1. Choose the right verifier for the presentation
2. Initialize the verification. Depending on the user's request, generate a verifier URL, or use the WMP verification flow.
If the user has specified a product ID, run the verification with the following custom query fragment:
- Path: `$.input_descriptors[0].constraints.fields[-1]`
- Fragment:
```json
{
  "name": "Product ID filter",
  "path": ["$.vc.credentialSubject.productIds"],
  "filter": {
    "type": "array",
    "contains": {
      "const": "<PLACE THE PRODUCT ID HERE!!!>"
    }
  }
}
```

If the user has specified a product name, run the verification with the following custom query fragment:
- Path: `$.input_descriptors[0].constraints.fields[-1]`
- Fragment:
```json
{
  "name": "Product name filter",
  "path": ["$.vc.credentialSubject.productNameCompany"],
  "filter": {
    "type": "string",
    "const": "<PLACE THE PRODUCT NAME HERE!!!>"
  }
}
```
3. Wait for the `vp.verified` or `vp.invalid` notification. The notification will contain the credential/errors during the presentation.
4. If the presentation was successful, verify validity of the claims in the credential, namely:
    1. `ProductCarbonFootprint` is issued by the organization to which the `PcfConformityCertificate` was issued. In case an `uri:eu.ebw.oid.1` was presented, it should match the PCF issuer
    2. None of `ProductCarbonFootprint` and `PcfConformityCertificate` are expired or revoked.
5. Report the verification result back to the user.

## Auditor - Issuing a PcfConformityCertificate
### Pre-requisites
- The auditor is onboarded to IDTL trust framework.

### Workflow
Issuance of `PcfConformityCertificate` is gated on presentation of `uri:eu.ebw.oid.1`.

**Steps:**
1. Gather all data necessary for the issuance of the `PcfConformityCertificate`.
    1. Product Category
    2. ISO Norm
    3. Relevant units considered
    4. Systematic Scope considered
2. Initialize the issuance of `PcfConformityCertificate`. Depending on the user's request, the issuance process will:
    1. use the issuer type `VPDriven`, where the `companyName` field will be automatically filled from the presentation of `uri:eu.ebw.oid.1`.
    2. use the issuer type `CredentialRequirements`, where the company name from presented `uri:eu.ebw.oid.1` will be verified against a known value provided by the user.
       The issuance process should either run through OIDC4VCI flow or the WMP issuance flow, depending on the user's request.
3. Wait for the result of the issuance process. Provide the result of the process back to the user.

## Participant - self-issuing a ProductCarbonFootprint
### Pre-requisites
- The participant is onboarded to IDTL trust framework.
- The participant has a valid `PcfConformityCertificate`

### Workflow
#### Issuing a PCF based on subcontractors' Product Carbon Footprints
In some cases, the Product Carbon Footprint value should be derived from Product Carbon Footprints of subcontracted parts of the product.
This section describes the process of retrieving Product Carbon Footprints from these subcontractors. In this flow, the participant will assume the role of a 'Verifier' as it verifies the PCF's its subcontractors.

**Steps:**
1. Gather data about the suppliers - the user provides a list of suppliers and the parts which MAY contain the following data:
    1. Company name
    2. Company website
    3. Company WMP well-known URI
       If any data is missing, ask the user.
2. Check whether a WMP connection with the suppliers is already established. If not and not enough information to establish the connection (e.g. WMP invitation URI) was provided, go back to step 1 and ask the user.
3. Send a verification request of `ProductCarbonFootprint` and `PcfConformityCertificate` credential pairs matching the specified subcontracted parts from the user-provided list to all suppliers. If the user has specified in Product ID or Product Name, run the verification with custom query fragments as specified in the [Verifier](#verifier---verifying-a-product-carbon-footprint) section.
4. When a presentation of `ProductCarbonFootprint` and `PcfConformityCertificate` is received, verify it according to the steps in the [Verifier](#verifier---verifying-a-product-carbon-footprint) section.
5. Report all failed verifications back to the user with a recommendation to contact the subcontractor about the issue. If the user further engages, draft a message containing:
    1. The issue encountered, with details - e.g. The `ProductCarbonFootprint` credential has expired.
    2. The exact credential(s) that are failing the verification
    3. Recommended action to resolve the issue.
       If the user returns back with a response from the subcontractor(s), rerun the flow for the affected credentials.
6. Provide a structured report back to the user containing all the retrieved data. Format of such report (inline table, text document, spreadsheet) should be decided by the user.
7. If the user then decides to issue its own PCF run the flow described in the subsection below.

#### Issuing a PCF based on user's numbers

**Steps:**
1. Gather data required for the issuance of the `ProductCarbonFootprint`
2. Self-issue the `ProductCarbonFootprint` credential.
    1. In Nexus UI, use the ...
    2. In environment with the MCP server only, call the following tools:
        1. `CredentialIssuanceInit`
        2. `AuthOfferInit`
        3. `HolderOfferPassAuthInfo`
        4. `HolderOfferProcessAfterConsent`
3. Report the PCF issuance back to the user.
