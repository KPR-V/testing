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
  name: "rentalaggrementrequest",
  namespace: "urn:dif:hackathon/MIKO/rental",
})
class RentalaggrementRequest {
  @VcNotEmptyClaim
    @VcLinkedCredentialClaim(Bankaccountdetails)
  bankaccountdetails!: LinkedCredential<Bankaccountdetails>;
  
  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(ProofOfIdentitycontract)
  proofofidentity_certificate!: LinkedCredential<ProofOfIdentitycontract>;

  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(EmploymentContract)
  employment_contract!: LinkedCredential<EmploymentContract>;
}
@VcContext({
  name: "rentalaggrementdetails",
  namespace: "urn:dif:hackathon/MIKO/rental",
})
class Rentalaggrementdetails {
  @VcNotEmptyClaim
  name!: string;
  @VcNotEmptyClaim
  address!: string;
  @VcNotEmptyClaim
  phone_number!: Number;
  @VcNotEmptyClaim
  email!: string;
  @VcNotEmptyClaim
  rent!: Number;
  @VcNotEmptyClaim
  rental_period!: string;
  @VcLinkedCredentialClaim(EmploymentContract)
  employment_contract!: LinkedCredential<EmploymentContract>;
  @VcLinkedCredentialClaim(ProofOfIdentitycontract)
  proofofidentity_certificate!: LinkedCredential<ProofOfIdentitycontract>;
  @VcLinkedCredentialClaim(Bankaccountdetails)
  bankaccountdetails!: LinkedCredential<Bankaccountdetails>;
}
@VcContext({
  name: "rentalaggrementresponse",
  namespace: "urn:dif:hackathon/MIKO/bank",
})
class RentalaggrementResponse {
  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(RentalaggrementRequest)
  request!: LinkedCredential<RentalaggrementRequest>;
  @VcNotEmptyClaim
  @VcLinkedCredentialClaim(Rentalaggrementdetails)
  rentalaggrementdetail!: LinkedCredential<Rentalaggrementdetails>;

  @VcNotEmptyClaim
  issuingAuthority!: string;
  @VcNotEmptyClaim
  date_of_issue!: string;
}



async function miko_to_rental() {
  // Step 1: Miko's Rental Request
  try {
    console.log("=== Starting Miko's rental request process ===");

    const { id: rentalManagerDid } = await employer_client.dids.didDocumentSelfGet();
    console.log("Rental Manager DID:", rentalManagerDid);

    const rentalRequest = miko_client.createVcDecorator(RentalaggrementRequest);
    console.log("Created rental request decorator");

    const requestDraft = await rentalRequest.create({
      claims: {
        proofofidentity_certificate: , 
        employment_contract: , 
        bankaccountdetails: ,
       
      },
    });
    console.log(
      "Created rental request draft with claims:",
      await requestDraft.getClaims()
    );

    const mikoKey = await miko_client.keys.keyGenerate({
      data: { type: "ED25519" },
    });
    console.log("Generated Miko's key with ID:", mikoKey.id);

    const requestVc = await requestDraft.issue(mikoKey.id);
    console.log("Issued rental request VC");

    await requestVc.send(rentalManagerDid, mikoKey.id);
    console.log("Successfully sent rental request to Rental Manager");
  } catch (error) {
    console.error("Error during rental request from Miko:", error);
  }

  // Step 2: Rental Manager Processing the Request and Issuing the Agreement
  try {
    console.log("\n=== Starting Rental Manager's processing ===");

    const rentalRequest = employer_client.createVcDecorator(RentalaggrementRequest);
    const rentalAgreement = employer_client.createVcDecorator(Rentalaggrementdetails);
    const rentalResponse = employer_client.createVcDecorator(RentalaggrementResponse);
    console.log("Created all required decorators");

    const rentalManagerKey = await employer_client.keys.keyGenerate({
      data: { type: "ED25519" },
    });
    console.log("Generated Rental Manager key with ID:", rentalManagerKey.id);

    const requestResults = await employer_client.credentials.credentialSearch({
      filter: [
        {
          data: {
            type: {
              operator: "IN",
              values: [rentalRequest.getCredentialTerm()],
            },
          },
        },
      ],
    });

    if (requestResults.items.length > 0) {
      const firstRequest = requestResults.items[0];

      const rentalAgreementDraft = await rentalAgreement.create({
        claims: {
          name: "Miko",
          address: "Miko's Address",
          phone_number: 1234567890,
          email: "",
          rent: 1000,
          rental_period: "Monthly",
          employment_contract: ,
          proofofidentity_certificate:, 
          bankaccountdetails: ,

        },
      });
      console.log("Created rental agreement draft");

      const rentalAgreementVc = await rentalAgreementDraft.issue(rentalManagerKey.id);
      console.log("Issued rental agreement VC");

      const responseDraft = await rentalResponse.create({
        claims: {
          request: rentalRequest.map(firstRequest),
          rentalaggrementdetail: rentalAgreementVc,
          issuingAuthority: "Rental Authority",
          date_of_issue: "2024-01-01",
        },
      });
      console.log("Created rental response draft");

      const responseVc = await responseDraft.issue(rentalManagerKey.id);
      console.log("Issued rental response VC");

     const presentation = await employer_client
        .createVpDecorator()
        .issue([rentalAgreementVc, responseVc], rentalManagerKey.id);

      const { issuer: requesterDid } = await rentalRequest.map(firstRequest).getMetaData();
      console.log("Requester DID:", requesterDid);

      await presentation.send(requesterDid, rentalManagerKey.id);
      console.log("Successfully sent bank account response to requester");
    }
  } catch (error) {
    console.error("Error during Rental Manager handling request:", error);
  }

  // Step 3: Miko handling the Rental Response
  try {
    console.log("\n=== Starting Miko's response handling ===");

    const rentalResponse = miko_client.createVcDecorator(RentalaggrementResponse);
    console.log("Created rental response decorator");

    const result = await miko_client.credentials.credentialSearch({
      sort: [{ field: "DATA_VALID_FROM", order: "DESC" }],
      filter: [
        {
          data: {
            type: {
              operator: "IN",
              values: [rentalResponse.getCredentialTerm()],
            },
          },
        },
      ],
    });
    console.log("Search results:", {
      totalResults: result.items.length,
      firstResultId: result.items[0]?.id,
    });

    const rentalResponseVc = rentalResponse.map(result.items[0]);
    console.log("Mapped rental response VC");

    const responseClaims = await rentalResponseVc.getClaims();
    console.log("Response claims:", responseClaims);

    const rentalAgreementVc = await responseClaims.rentalaggrementdetail.dereference();
    console.log("Dereferenced rental agreement VC");

    const rentalAgreementClaims = await rentalAgreementVc.getClaims();
    console.log("Final Rental Agreement Details:", rentalAgreementClaims);
  } catch (error) {
    console.error("Error during Miko handling rental response:", error);
  }
}