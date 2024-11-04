import {
  TruvityClient,
  LinkedCredential,
  VcContext,
  VcLinkedCredentialClaim,
  VcNotEmptyClaim,
} from "@truvity/sdk";
import { FileData, files } from "@truvity/sdk/api";
import fs, { readFileSync } from "fs";
import "dotenv/config";


const miko_client = new TruvityClient({
  apiKey: process.env.TIM_API_KEY,
  environment: "https://api.truvity.cloud",
});

const employer_client = new TruvityClient({
  apiKey: process.env.AIRLINE_API_KEY,
  environment: "https://api.truvity.cloud",
});

@VcContext({
  name: "employmentcontractrequest",
  namespace: "urn:dif:hackathon/MIKO/employment",
})
class EmploymentContractRequest {
  @VcNotEmptyClaim
  firstName!: string;

  @VcNotEmptyClaim
  lastName!: string;

  @VcNotEmptyClaim
  email!: string;

  @VcNotEmptyClaim
  position!: string;

  @VcNotEmptyClaim
  phone_number!: Number;
}

@VcContext({
  name: "employmentcontract",
  namespace: "urn:dif:hackathon/MIKO/employment",
})
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
  name: "employmentcontractresponse",
  namespace: "urn:dif:hackathon/MIKO/employment",
})
class EmploymentContractResponse {
  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(EmploymentContractRequest)
  request!: LinkedCredential<EmploymentContractRequest>;

  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(EmploymentContract)
  contract!: LinkedCredential<EmploymentContract>;
  @VcNotEmptyClaim
  employer_name!: string;
}

async function miko_to_employer_to_miko() {
  // miko's side code to request employment contract below

  try {
    const { id: employerDid } = await employer_client.dids.didDocumentSelfGet();
    const proofofidentity = miko_client.createVcDecorator(
      EmploymentContractRequest
    );
    console.log("Employment request VC created");
    const proofofidentityDraft = await proofofidentity.create({
      claims: {
        firstName: "Miko",
        lastName: "Dif",
        email: "miko@dif.com",
        position: "Software Developer",
        phone_number: 1234567890,
      },
    });
    console.log("Employment request draft created");
    const mikoKey = await miko_client.keys.keyGenerate({
      data: {
        type: "ED25519",
      },
    });
    console.log("Miko key generated:", mikoKey.id);
    const proofofidentityVc = await proofofidentityDraft.issue(mikoKey.id);
    console.log("Employment request VC issued");
    await proofofidentityVc.send(employerDid, mikoKey.id);
    console.log("Employment request VC sent to Employer");
  } catch (error) {
    console.error("Error during miko request employment contract", error);
  }

  // employer's side code to handle the request and send the response below

  try {
    const proofofidentity = employer_client.createVcDecorator(
      EmploymentContractRequest
    );
    const employmentcontract =
      employer_client.createVcDecorator(EmploymentContract);
    const employmentcontractresponse = employer_client.createVcDecorator(
      EmploymentContractResponse
    );
    const employerKey = await employer_client.keys.keyGenerate({
      data: {
        type: "ED25519",
      },
    });
    console.log("Employer key generated:", employerKey.id);
    const proofofidentityResults =
      await employer_client.credentials.credentialSearch({
        filter: [
          {
            data: {
              type: {
                operator: "IN",
                values: [proofofidentity.getCredentialTerm()],
              },
            },
          },
        ],
      });
    console.log(
      "Employment requests found:",
      proofofidentityResults.items.length
    );
    const fulfilledRequests =
      await employer_client.credentials.credentialSearch({
        filter: [
          {
            data: {
              type: {
                operator: "IN",
                values: [employmentcontractresponse.getCredentialTerm()],
              },
            },
          },
        ],
      });
    console.log("Fulfilled requests found:", fulfilledRequests.items.length);
    const unfulfilledRequests = proofofidentityResults.items.filter(
      (request) => {
        const { linkedId: requestLinkedId } =
          LinkedCredential.normalizeLinkedCredentialId(request.id);
        const isLinkedToResponse = fulfilledRequests.items.some((response) =>
          response.data.linkedCredentials?.includes(requestLinkedId)
        );
        return !isLinkedToResponse;
      }
    );
    console.log("Unfulfilled requests:", unfulfilledRequests.length);
   
    for (const item of unfulfilledRequests) {
      const proofofidentityVc = proofofidentity.map(item);
      const firstName = await proofofidentityVc.getClaims();
      console.log("Employment request received for:", firstName)
    
      const contractDraft = await employmentcontract.create({
        claims: {
          nameofthecompany: "amsterdam'company",
          nameoftheemployee: "miko",
          position: "software developer",
          date_of_joining: "2022-01-01",
          phone_number: 1234567890,
          email: firstName.email,
          salary: 10000,
          place_of_work: "onsite,amsterdam",
        },
      });
      console.log("contract draft created");
      const contractVc = await contractDraft.issue(employerKey.id);
      console.log("contract VC issued");

      const responseDraft = await employmentcontractresponse.create({
        claims: {
          request: proofofidentity.map(unfulfilledRequests[0]),
          contract: contractVc,
          employer_name: "amsterdam company",
        },
      });
      console.log("response draft created");
      const responseVc = await responseDraft.issue(employerKey.id);
      console.log("response VC issued");
      const presentation = await employer_client
        .createVpDecorator()
        .issue([contractVc, responseVc], employerKey.id);
      const { issuer: requesterDid } = await proofofidentity
        .map(unfulfilledRequests[0])
        .getMetaData();
      console.log("Requester DID:", requesterDid);
      await presentation.send(requesterDid, employerKey.id);
    }
  } catch (error) {
    console.error("Error during Employer handling request:", error);
  }

  // miko's side code to handle the response below

  try {
    const employmentcontractresponse = miko_client.createVcDecorator(
      EmploymentContractResponse
    );
    const result = await miko_client.credentials.credentialSearch({
      sort: [
        {
          field: "DATA_VALID_FROM",
          order: "DESC",
        },
      ],
      filter: [
        {
          data: {
            type: {
              operator: "IN",
              values: [employmentcontractresponse.getCredentialTerm()],
            },
          },
        },
      ],
    });
    console.log("Employment responses found:", result.items.length);
    const employmentcontractresponseVc = employmentcontractresponse.map(
      result.items[0]
    );
    const responseClaims = await employmentcontractresponseVc.getClaims();
    const contractVc = await responseClaims.contract.dereference();
    const contractClaims = await contractVc.getClaims();
    console.log(
      `Employment contract details: ${contractClaims.nameofthecompany} (salary: $${
        contractClaims.salary
      })`
    );
  } catch (error) {
    console.error("Error during miko handles response:", error);
  }
}
miko_to_employer_to_miko();
