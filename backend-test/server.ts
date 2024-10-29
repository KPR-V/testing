// import { TruvityClient, LinkedCredential, VcContext, VcLinkedCredentialClaim, VcNotEmptyClaim } from '@truvity/sdk';

// import "dotenv/config";
// --- Documents schemas ---

// @VcContext({
//   name: "TicketPurchaseRequest",
//   namespace: "urn:dif:hackathon/vocab/airline",
// })
// class PurchaseRequest {
//  @VcNotEmptyClaim
//   firstName!: string;

//   @VcNotEmptyClaim
//   lastName!: string;
// }

// @VcContext({
//   name: "Ticket",
//   namespace: "urn:dif:hackathon/vocab/airline",
// })
// class PurchasedTicked {
//   @VcNotEmptyClaim
//   flightNumber!: string;
// }

// @VcContext({
//   name: "TicketPurchaseResponse",
//   namespace: "urn:dif:hackathon/vocab/airline",
// })
// class PurchaseResponse {
//   @VcNotEmptyClaim
//   @VcLinkedCredentialClaim(PurchaseRequest)
//   request!: LinkedCredential<PurchaseRequest>;

//   @VcNotEmptyClaim
//   @VcLinkedCredentialClaim(PurchasedTicked)
//   ticket!: LinkedCredential<PurchasedTicked>;

//   @VcNotEmptyClaim
//   price!: number;
// }

// // Initialize API clients and create cryptographic key pairs

// const timClient = new TruvityClient({
//   apiKey: process.env.TIM_API_KEY,
//   environment: "https://api.truvity.cloud",
// });

// const airlineClient = new TruvityClient({
//   apiKey: process.env.AIRLINE_API_KEY,
//   environment: "https://api.truvity.cloud",
// });

// async function main() {
//   try {
//     // Retrieving a well-known DID of the Airline from its DID Document
//     const { id: airlineDid } = await airlineClient.dids.didDocumentSelfGet();
//     console.log("Airline DID:", airlineDid);

//     // --- Tim initiate purchase ---
//     const purchaseRequest = timClient.createVcDecorator(PurchaseRequest);
//     console.log("Purchase request VC created");

//     const purchaseRequestDraft = await purchaseRequest.create({
//       claims: {
//         firstName: "Tim",
//         lastName: "Dif",
//       },
//     });
//     console.log("Purchase request draft created");

//     const timKey = await timClient.keys.keyGenerate({
//       data: {
//         type: "ED25519",
//       },
//     });
//     console.log("Tims key generated:", timKey.id);

//     const purchaseRequestVc = await purchaseRequestDraft.issue(timKey.id);
//     console.log("Purchase request VC issued");

//     await purchaseRequestVc.send(airlineDid, timKey.id);
//     console.log("Purchase request VC sent to Airline");
//   } catch (error) {
//     console.error("Error during Tim initiate purchase:", error);
//   }

//   try {
//     // --- Airline handles request ---

//     // Instantiating document APIs
//     const purchaseRequest = airlineClient.createVcDecorator(PurchaseRequest);
//     const purchasedTicked = airlineClient.createVcDecorator(PurchasedTicked);
//     const purchaseResponse = airlineClient.createVcDecorator(PurchaseResponse);

//     // Generating a new cryptographic key pair for the Airline
//     const airlineKey = await airlineClient.keys.keyGenerate({
//       data: {
//         type: "ED25519",
//       },
//     });
//     console.log("Airline key generated:", airlineKey.id);

//     // Searching for tickets purchase request VCs
//     const purchaseRequestResults =
//       await airlineClient.credentials.credentialSearch({
//         filter: [
//           {
//             data: {
//               type: {
//                 operator: "IN",
//                 values: [purchaseRequest.getCredentialTerm()],
//               },
//             },
//           },
//         ],
//       });
//     console.log(
//       "Purchase requests found:",
//       purchaseRequestResults.items.length,
//     );

//     // Searching for ticket purchase response VCs. We'll use it to calculate unprocessed requests
//     const fulfilledRequests = await airlineClient.credentials.credentialSearch({
//       filter: [
//         {
//           data: {
//             type: {
//               operator: "IN",
//               values: [purchaseResponse.getCredentialTerm()],
//             },
//           },
//         },
//       ],
//     });
//     console.log("Fulfilled requests found:", fulfilledRequests.items.length);

//     // Calculating unprocessed requests
//     const unfulfilledRequests = purchaseRequestResults.items.filter(
//       (request) => {
//         const { linkedId: requestLinkedId } =
//           LinkedCredential.normalizeLinkedCredentialId(request.id);

//         const isLinkedToResponse = fulfilledRequests.items.some((response) =>
//           response.data.linkedCredentials?.includes(requestLinkedId),
//         );

//         return !isLinkedToResponse;
//       },
//     );
//     console.log("Unfulfilled requests:", unfulfilledRequests.length);

//     // Processing new requests
//     for (const item of unfulfilledRequests) {
//       // Converting API resource to UDT to enable additional API for working with the content of the VC
//       const purchaseRequestVc = purchaseRequest.map(item);

//       let price = 100;
//       const { firstName } = await purchaseRequestVc.getClaims();

//       // Performing some custom business logic based on the VC content
//       if (firstName === "Tim") {
//         price += 20; // Unlucky Tim...
//       }

//       const ticketDraft = await purchasedTicked.create({
//         claims: {
//           flightNumber: "123",
//         },
//       });
//       const ticketVc = await ticketDraft.issue(airlineKey.id);

//       const responseDraft = await purchaseResponse.create({
//         claims: {
//           request: purchaseRequestVc,
//           ticket: ticketVc,
//           price,
//         },
//       });
//       const responseVc = await responseDraft.issue(airlineKey.id);

//       const presentation = await airlineClient
//         .createVpDecorator()
//         .issue([ticketVc, responseVc], airlineKey.id);

//       // Retrieving information about the issuer of the request. We'll use to send the response back
//       const { issuer: requesterDid } = await purchaseRequestVc.getMetaData();
//       console.log("Requester DID:", requesterDid);

//       await presentation.send(requesterDid, airlineKey.id);
//       console.log("Response sent to:", requesterDid);
//     }
//   } catch (error) {
//     console.error("Error during Airline handling request:", error);
//   }

//   try {
//     // Tim handles the received request

//     const purchaseResponse = timClient.createVcDecorator(PurchaseResponse);

//     const result = await timClient.credentials.credentialSearch({
//       sort: [
//         {
//           field: "DATA_VALID_FROM", // applying sort by date so that the newest ticket will be first
//           order: "DESC",
//         },
//       ],
//       filter: [
//         {
//           data: {
//             type: {
//               operator: "IN",
//               values: [purchaseResponse.getCredentialTerm()],
//             },
//           },
//         },
//       ],
//     });
//     console.log("Purchase responses found:", result.items.length);

//     // Converting the first API resource from the search result to UDT to enable additional API for working with the content of the VC
//     const purchaseResponseVc = purchaseResponse.map(result.items[0]);
//     const responseClaims = await purchaseResponseVc.getClaims();

//     // Dereferencing the link to a credential to enable working with its content
//     const purchasedTicketVc = await responseClaims.ticket.dereference();
//     const ticketClaims = await purchasedTicketVc.getClaims();

//     // Completing the demo
//     console.info(
//       `Last ticket flight number: ${ticketClaims.flightNumber} (price: $${responseClaims.price})`,
//     );
//   } catch (error) {
//     console.error("Error during Tim handles request:", error);
//   }
// }

// main();

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

    // for (const item of unfulfilledRequests) {
    //   const proofofidentityVc = proofofidentity.map(item);
    //   const { firstName } = await proofofidentityVc.getClaims();
    // }

    // above code can be used to access the request claims and perform some cutom logic based on the request claim and to operate on all the request claims at once
    // below code is to operate on the first claim of the request

    const contractDraft = await employmentcontract.create({
      claims: {
        nameofthecompany: "amsterdam'company",
        nameoftheemployee: "miko",
        position: "software developer",
        date_of_joining: "2022-01-01",
        phone_number: 1234567890,
        email: "miko@dif.com",
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






@VcContext({
  name: "proofofidentityrequest",
  namespace: "urn:dif:hackathon/MIKO/identity",
})
class ProofOfIdentityRequest {
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
  nationality!: string;

  @VcNotEmptyClaim
  father_name!: string;

  @VcNotEmptyClaim
  mother_name!: string;

  @VcNotEmptyClaim
  phone_number!: Number;
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
  name: "proofofidentityresponse",
  namespace: "urn:dif:hackathon/MIKO/identity",
})
class ProofOfIdentityResponse {
  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(ProofOfIdentityRequest)
  request!: LinkedCredential<ProofOfIdentityRequest>;

  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(ProofOfIdentitycontract)
  identity_card!: LinkedCredential<ProofOfIdentitycontract>;

  @VcNotEmptyClaim
  authority_name!: string;
}

async function miko_to_Immigration_Authority_to_miko() {
  // Miko's side code to request Proof of Identity
  try {
    const { id: employerDid } = await employer_client.dids.didDocumentSelfGet();
    const proofofidentityrequest = miko_client.createVcDecorator(
      ProofOfIdentityRequest
    );
    console.log("Employment request VC created");

    const proofofidentityDraft = await proofofidentityrequest.create({
      claims: {
        firstName: "Miko",
        lastName: "Dif",
        date_of_birth: "1990-01-01",
        address: "Amsterdam",
        place_of_birth: "Amsterdam",
        phone_number: 1234567890,
        father_name: "Father",
        mother_name: "Mother",
        nationality: "Dutch",
      },
    });
    console.log("Identity request draft created");

    const mikoKey = await miko_client.keys.keyGenerate({
      data: {
        type: "ED25519",
      },
    });
    console.log("Miko key generated:", mikoKey.id);

    const proofofidentityVc = await proofofidentityDraft.issue(mikoKey.id);
    console.log("Identity request VC issued");

    await proofofidentityVc.send(employerDid, mikoKey.id);
    console.log("Employment request VC sent to Employer");
  } catch (error) {
    console.error("Error during Miko request employment contract:", error);
  }

  // Employer's side code to handle the request and send the response
  try {
    const proofofidentityrequest = employer_client.createVcDecorator(ProofOfIdentityRequest);
    const proofofidentity = employer_client.createVcDecorator(ProofOfIdentitycontract);
    const proofofidentityresponse = employer_client.createVcDecorator(ProofOfIdentityResponse);

    const employerKey = await employer_client.keys.keyGenerate({
      data: {
        type: "ED25519",
      },
    });
    console.log("Employer key generated:", employerKey.id);

    const proofofidentityResults = await employer_client.credentials.credentialSearch({
        filter: [
          {
            data: {
              type: {
                operator: "IN",
                values: [proofofidentityrequest.getCredentialTerm()],
              },
            },
          },
        ],
      });
    console.log("Employment requests found:",proofofidentityResults.items.length);

    const fulfilledRequests =await employer_client.credentials.credentialSearch({
        filter: [
          {
            data: {
              type: {
                operator: "IN",
                values: [proofofidentityresponse.getCredentialTerm()],
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

    if (unfulfilledRequests.length > 0) {
      const firstUnfulfilledRequest = unfulfilledRequests[0];

      try {
       

        const contractDraft = await proofofidentity.create({
          claims: {
            firstName: "Miko",
            lastName: "Dif",
            date_of_birth: "1990-01-01",
            address: "Amsterdam",
            place_of_birth: "Amsterdam",
            phone_number: 1234567890,
            mother_name: "Mother",
            nationality: "Dutch",
            father_name: "Father",
          },
        });
        console.log("Contract draft created");

        const contractVc = await contractDraft.issue(employerKey.id);
        console.log("Contract VC issued");

        const responseDraft = await proofofidentityresponse.create({
          claims: {
            request: proofofidentityrequest.map(firstUnfulfilledRequest),
            identity_card: contractVc,
            authority_name: "Municipality of Amsterdam",
          },
        });
        console.log("Response draft created");

        const responseVc = await responseDraft.issue(employerKey.id);
        console.log("Response VC issued");

        const presentation = await employer_client.createVpDecorator().issue([contractVc, responseVc], employerKey.id);

        const { issuer: requesterDid } = await proofofidentityrequest.map(firstUnfulfilledRequest).getMetaData();
        console.log("Requester DID:", requesterDid);

        await presentation.send(requesterDid, employerKey.id);
        console.log("Response sent to:", requesterDid);
      } catch (error) {
        console.error("Error mapping the credential:", error);
      }
    }
  } catch (error) {
    console.error("Error during municipality handling request:", error);
  }

  // Miko's side code to handle the response
  try {
    const proofofidentityresponse = miko_client.createVcDecorator(
      ProofOfIdentityResponse
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
              values: [proofofidentityresponse.getCredentialTerm()],
            },
          },
        } ],
      
    });
    console.log("Employment responses found:", result.items.length);

    const employmentcontractresponseVc = proofofidentityresponse.map(result.items[0] );
    const responseClaims = await employmentcontractresponseVc.getClaims();
    const contractVc = await responseClaims.identity_card.dereference();
    const contractClaims = await contractVc.getClaims();

    console.log(
      `Employment contract details: ${contractClaims.firstName} (nationality: ${contractClaims.nationality})`
    );
  } catch (error) {
    console.error("Error during Miko handles response:", error);
  }
}

miko_to_Immigration_Authority_to_miko();
