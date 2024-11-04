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

@VcContext({
  name: "birthcertificate",
  namespace: "urn:dif:hackathon/MIKO/birth",
})
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
  name: "proofofidentity",
  namespace: "urn:dif:hackathon/MIKO/identity",
})
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

@VcContext({
  name: "registeryrequest",
  namespace: "urn:dif:hackathon/MIKO/registery",
})
class Registeryrequest {
  @VcNotEmptyClaim
    @VcLinkedCredentialClaim(BirthCertificate)
  birth_certificate!: LinkedCredential<BirthCertificate>;
  @VcNotEmptyClaim
    @VcLinkedCredentialClaim(ProofOfIdentitycontract)
  proofofidentity_certificate!: LinkedCredential<ProofOfIdentitycontract>;

  @VcNotEmptyClaim
    @VcLinkedCredentialClaim(EmploymentContract)
  employment_contract!: LinkedCredential<EmploymentContract>;
  
}

@VcContext({
  name: "registerycertificate",
  namespace: "urn:dif:hackathon/MIKO/registery",
})
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

@VcContext({
  name: "RegisteryResponse",
  namespace: "urn:dif:hackathon/MIKO/registery",
})
class Registeryresponse {
  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(Registeryrequest)
  request!: LinkedCredential<Registeryrequest>;

  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(Registerycertificate)
  certificate!: LinkedCredential<Registerycertificate>;

  @VcNotEmptyClaim
  authority_name!: string;
}

async function miko_to_registery_to_miko() {
  // Miko's request for a registry certificate
  try {
    console.log("=== Starting Miko's registry request process ===");

    const { id: municipalityDid } =
      await employer_client.dids.didDocumentSelfGet();
    console.log("Municipality DID:", municipalityDid);

    const registeryRequest = miko_client.createVcDecorator(Registeryrequest);
    console.log("Created registry request decorator");

    const requestDraft = await registeryRequest.create({
      claims: {
        birth_certificate: ,
        proofofidentity_certificate: ,
        employment_contract: ,
      },
    });
    console.log(
      "Created request draft with claims:",
      await requestDraft.getClaims()
    );

    const mikoKey = await miko_client.keys.keyGenerate({
      data: { type: "ED25519" },
    });
    console.log("Generated Miko's key with ID:", mikoKey.id);

    const requestVc = await requestDraft.issue(mikoKey.id);
    console.log("Issued request VC");

    await requestVc.send(municipalityDid, mikoKey.id);
    console.log("Successfully sent registry request to Municipality");
  } catch (error) {
    console.error("Error during registry request from Miko:", error);
  }

  // Municipality handling the request and issuing the registry certificate
  try {
    console.log("\n=== Starting Municipality processing ===");

    const registeryRequest =
      employer_client.createVcDecorator(Registeryrequest);
    const registeryCertificate =
      employer_client.createVcDecorator(Registerycertificate);
    const registeryResponse =
      employer_client.createVcDecorator(Registeryresponse);
    console.log("Created all required decorators");

    const municipalityKey = await employer_client.keys.keyGenerate({
      data: { type: "ED25519" },
    });
    console.log("Generated Municipality key with ID:", municipalityKey.id);

    const requestResults = await employer_client.credentials.credentialSearch({
      filter: [
        {
          data: {
            type: {
              operator: "IN",
              values: [registeryRequest.getCredentialTerm()],
            },
          },
        },
      ],
    });

    const fulfilledRequests =
      await employer_client.credentials.credentialSearch({
        filter: [
          {
            data: {
              type: {
                operator: "IN",
                values: [registeryResponse.getCredentialTerm()],
              },
            },
          },
        ],
      });
    console.log("Fulfilled requests found:", fulfilledRequests.items.length);

    const unfulfilledRequests = requestResults.items.filter((request) => {
      const { linkedId: requestLinkedId } =
        LinkedCredential.normalizeLinkedCredentialId(request.id);
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

      const certificateDraft = await registeryCertificate.create({
        claims: {
          birth_certificate: ,
          proofofidentity_certificate: ,
          employment_contract: ,
          date_of_issue: "2024-01-01",
        },
      });
      console.log("Created registry certificate draft");

      const certificateVc = await certificateDraft.issue(municipalityKey.id);
      console.log("Issued registry certificate VC");

      const responseDraft = await registeryResponse.create({
        claims: {
          request: registeryRequest.map(firstUnfulfilledRequest),
          certificate: certificateVc,
          authority_name: "Registry Authority",
        },
      });
      console.log("Created registry response draft");

      const responseVc = await responseDraft.issue(municipalityKey.id);
      console.log("Issued registry response VC");

      // Create a presentation containing both VCs
      const presentation = await employer_client
        .createVpDecorator()
        .issue([certificateVc, responseVc], municipalityKey.id);

      const { issuer: requesterDid } = await registeryRequest
        .map(firstUnfulfilledRequest)
        .getMetaData();
      console.log("Requester DID:", requesterDid);

      await presentation.send(requesterDid, municipalityKey.id);
      console.log("Successfully sent registry response to requester");
    }
  } catch (error) {
    console.error("Error during Municipality handling request:", error);
  }

  // Miko handling the response
  try {
    console.log("\n=== Starting Miko's response handling ===");

    const registeryResponse = miko_client.createVcDecorator(Registeryresponse);
    console.log("Created response decorator");

    const result = await miko_client.credentials.credentialSearch({
      sort: [{ field: "DATA_VALID_FROM", order: "DESC" }],
      filter: [
        {
          data: {
            type: {
              operator: "IN",
              values: [registeryResponse.getCredentialTerm()],
            },
          },
        },
      ],
    });
    console.log("Search results:", {
      totalResults: result.items.length,
      firstResultId: result.items[0]?.id,
    });

    const registryResponseVc = registeryResponse.map(result.items[0]);
    console.log("Mapped response VC");

    const responseClaims = await registryResponseVc.getClaims();
    console.log("Response claims:", responseClaims);

    const certificateVc = await responseClaims.certificate.dereference();
    console.log("Dereferenced registry certificate VC");

    const certificateClaims = await certificateVc.getClaims();
    console.log("Final Registry Certificate Details:", certificateClaims);
  } catch (error) {
    console.error("Error during Miko handling response:", error);
  }
}
