import {
  TruvityClient,
  LinkedCredential,
  VcContext,
  VcLinkedCredentialClaim,
  VcNotEmptyClaim,
} from "@truvity/sdk";

import "dotenv/config";

const miko_client = new TruvityClient({
  apiKey: process.env.TIM_API_KEY,
  environment: "https://api.truvity.cloud",
});

const employer_client = new TruvityClient({
  apiKey: process.env.AIRLINE_API_KEY,
  environment: "https://api.truvity.cloud",
});

class Registerycertificate {
  @VcNotEmptyClaim
  birth_certificate!: LinkedCredential<BirthCertificate>;
  @VcNotEmptyClaim
  proofofidentity_certificate!: LinkedCredential<ProofOfIdentitycontract>;
  @VcNotEmptyClaim
  employment_contract!: LinkedCredential<EmploymentContract>;
  @VcNotEmptyClaim
  date_of_issue!: string;
}
class ProofOfIdentitycontract {
  @VcNotEmptyClaim
  firstName!: string;

  @VcNotEmptyClaim
  lastName!: string;

  @VcNotEmptyClaim
  date_of_birth!: string;

  @VcNotEmptyClaim
  address!: string;

  @VcNotEmptyClaim
  place_of_birth!: string;

  @VcNotEmptyClaim
  father_name!: string;

  @VcNotEmptyClaim
  nationality!: string;

  @VcNotEmptyClaim
  phone_number!: Number;

  @VcNotEmptyClaim
  mother_name!: string;
}
class BirthCertificate {
  @VcNotEmptyClaim
  certificateID!: string;

  @VcNotEmptyClaim
  firstName!: string;

  @VcNotEmptyClaim
  lastName!: string;

  @VcNotEmptyClaim
  dateOfBirth!: string;

  @VcNotEmptyClaim
  placeOfBirth!: string;

  @VcNotEmptyClaim
  parentName!: string;

  @VcNotEmptyClaim
  dateOfIssue!: string;
}
class EmploymentContract {
  @VcNotEmptyClaim
  nameofthecompany!: string;
  @VcNotEmptyClaim
  nameoftheemployee!: string;
  @VcNotEmptyClaim
  position!: string;
  @VcNotEmptyClaim
  date_of_joining!: string;
  @VcNotEmptyClaim
  phone_number!: Number;
  @VcNotEmptyClaim
  email!: string;
  @VcNotEmptyClaim
  salary!: Number;
  @VcNotEmptyClaim
  place_of_work!: string;
}
@VcContext({
  name: "bankaccountrequest",
  namespace: "urn:dif:hackathon/MIKO/bank",
})
class BankaccountRequest {
  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(Registerycertificate)
  Registery_certificate!: LinkedCredential<Registerycertificate>;
  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(ProofOfIdentitycontract)
  proofofidentity_certificate!: LinkedCredential<ProofOfIdentitycontract>;

  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(EmploymentContract)
  employment_contract!: LinkedCredential<EmploymentContract>;
}
@VcContext({
  name: "bankaccountdetails",
  namespace: "urn:dif:hackathon/MIKO/bank",
})
class Bankaccountdetails {
  @VcNotEmptyClaim
  name!: string;
  @VcNotEmptyClaim
  account_number!: string;
  @VcNotEmptyClaim
  bank_name!: string;
  @VcNotEmptyClaim
  branch_name!: string;
  @VcNotEmptyClaim
  ifsc_code!: string;
  @VcLinkedCredentialClaim(EmploymentContract)
  employment_contract!: LinkedCredential<EmploymentContract>;
  @VcLinkedCredentialClaim(ProofOfIdentitycontract)
  proofofidentity_certificate!: LinkedCredential<ProofOfIdentitycontract>;
  @VcLinkedCredentialClaim(Registerycertificate)
  Registery_certificate!: LinkedCredential<Registerycertificate>;
}
@VcContext({
  name: "bankaccountresponse",
  namespace: "urn:dif:hackathon/MIKO/bank",
})
class BankaccountResponse {
  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(BankaccountRequest)
  request!: LinkedCredential<BankaccountRequest>;
  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(Bankaccountdetails)
  bankaccountdetails!: LinkedCredential<Bankaccountdetails>;

  @VcNotEmptyClaim
  issuingAuthority!: string;
  @VcNotEmptyClaim
  date_of_issue!: string;
}


async function miko_to_bank_to_miko() {
  // Step 1: Miko's Bank Account Request
  try {
    console.log("=== Starting Miko's bank account request process ===");

    const { id: bankDid } = await employer_client.dids.didDocumentSelfGet();
    console.log("Bank DID:", bankDid);

    const bankRequest = miko_client.createVcDecorator(BankaccountRequest);
    console.log("Created bank account request decorator");

    const requestDraft = await bankRequest.create({
      claims: {
        Registery_certificate: ,
        proofofidentity_certificate: ,
        employment_contract: ,
      },
    });
    console.log(
      "Created bank account request draft with claims:",
      await requestDraft.getClaims()
    );

    const mikoKey = await miko_client.keys.keyGenerate({
      data: { type: "ED25519" },
    });
    console.log("Generated Miko's key with ID:", mikoKey.id);

    const requestVc = await requestDraft.issue(mikoKey.id);
    console.log("Issued bank account request VC");

    await requestVc.send(bankDid, mikoKey.id);
    console.log("Successfully sent bank account request to Bank");
  } catch (error) {
    console.error("Error during bank account request from Miko:", error);
  }

  // Step 2: Bank processing the request and issuing the response
  try {
    console.log("\n=== Starting Bank's processing ===");

    const bankRequest = employer_client.createVcDecorator(BankaccountRequest);
    const bankDetails = employer_client.createVcDecorator(Bankaccountdetails);
    const bankResponse = employer_client.createVcDecorator(BankaccountResponse);
    console.log("Created all required decorators");

    const bankKey = await employer_client.keys.keyGenerate({
      data: { type: "ED25519" },
    });
    console.log("Generated Bank key with ID:", bankKey.id);

    const requestResults = await employer_client.credentials.credentialSearch({
      filter: [
        {
          data: {
            type: {
              operator: "IN",
              values: [bankRequest.getCredentialTerm()],
            },
          },
        },
      ],
    });

    const fulfilledRequests = await employer_client.credentials.credentialSearch({
      filter: [
        {
          data: {
            type: {
              operator: "IN",
              values: [bankResponse.getCredentialTerm()],
            },
          },
        },
      ],
    });
    console.log("Fulfilled requests found:", fulfilledRequests.items.length);

    const unfulfilledRequests = requestResults.items.filter((request) => {
      const { linkedId: requestLinkedId } = LinkedCredential.normalizeLinkedCredentialId(request.id);
      const isLinkedToResponse = fulfilledRequests.items.some((response) =>
        response.data.linkedCredentials?.includes(requestLinkedId)
      );
      return !isLinkedToResponse;
    });

    console.log("Found unfulfilled requests:", {
      count: unfulfilledRequests.length,
      requests: unfulfilledRequests.map((req) => req.id),
    });

    if (unfulfilledRequests.length > 0) {
      const firstUnfulfilledRequest = unfulfilledRequests[0];

      const bankDetailsDraft = await bankDetails.create({
        claims: {
          name: "Miko's Bank Account",
          account_number: "1234567890",
          bank_name: "Bank of Blockchain",
          branch_name: "Main Branch",
          ifsc_code: "BOB0001234",
          employment_contract: ,
          proofofidentity_certificate: ,
          Registery_certificate:,
        },
      });
      console.log("Created bank account details draft");

      const bankDetailsVc = await bankDetailsDraft.issue(bankKey.id);
      console.log("Issued bank account details VC");

      const responseDraft = await bankResponse.create({
        claims: {
          request: bankRequest.map(firstUnfulfilledRequest),
          bankaccountdetails: bankDetailsVc,
          issuingAuthority: "Bank Authority",
          date_of_issue: "2024-01-01",
        },
      });
      console.log("Created bank account response draft");

      const responseVc = await responseDraft.issue(bankKey.id);
      console.log("Issued bank account response VC");

      // Create a presentation containing both VCs
      const presentation = await employer_client
        .createVpDecorator()
        .issue([bankDetailsVc, responseVc], bankKey.id);

      const { issuer: requesterDid } = await bankRequest
        .map(firstUnfulfilledRequest)
        .getMetaData();
      console.log("Requester DID:", requesterDid);

      await presentation.send(requesterDid, bankKey.id);
      console.log("Successfully sent bank account response to requester");
    }
  } catch (error) {
    console.error("Error during Bank handling request:", error);
  }

  // Step 3: Miko handling the bank response
  try {
    console.log("\n=== Starting Miko's response handling ===");

    const bankResponse = miko_client.createVcDecorator(BankaccountResponse);
    console.log("Created bank account response decorator");

    const result = await miko_client.credentials.credentialSearch({
      sort: [{ field: "DATA_VALID_FROM", order: "DESC" }],
      filter: [
        {
          data: {
            type: {
              operator: "IN",
              values: [bankResponse.getCredentialTerm()],
            },
          },
        },
      ],
    });
    console.log("Search results:", {
      totalResults: result.items.length,
      firstResultId: result.items[0]?.id,
    });

    const bankResponseVc = bankResponse.map(result.items[0]);
    console.log("Mapped bank account response VC");

    const responseClaims = await bankResponseVc.getClaims();
    console.log("Response claims:", responseClaims);

    const bankDetailsVc = await responseClaims.bankaccountdetails.dereference();
    console.log("Dereferenced bank account details VC");

    const bankDetailsClaims = await bankDetailsVc.getClaims();
    console.log("Final Bank Account Details:", bankDetailsClaims);
  } catch (error) {
    console.error("Error during Miko handling bank response:", error);
  }
}


