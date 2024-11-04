import {
  TruvityClient,
  LinkedCredential,
  VcContext,
  VcLinkedCredentialClaim,
  VcNotEmptyClaim,
} from "@truvity/sdk";
import "dotenv/config";

// Client initialization
const compliance_officer_client = new TruvityClient({
  apiKey: process.env.AIRLINE_API_KEY,
  environment: "https://api.truvity.cloud",
});

@VcContext({
  name: "bankAccountInfo",
  namespace: "urn:compliance:bank",
})
class BankAccountInfo {
  @VcNotEmptyClaim
  customerId!: string;

  @VcNotEmptyClaim
  accountStatus!: string;

  @VcNotEmptyClaim
  approvalDate!: string;

  @VcNotEmptyClaim
  linkedDocuments!: LinkedCredential<any>[];
}

// Document status enum
enum DocumentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// Review decision interface
interface ReviewDecision {
  documentId: string;
  status: DocumentStatus;
  comments: string;
  reviewedAt: Date;
  reviewedBy: string;
}

// Document review manager class
class ComplianceReviewManager {
  private decisions: Map<string, ReviewDecision> = new Map();
  private requiredDocuments: Set<string> = new Set([
    "ProofOfRegistration",
    "EmploymentContract",
    "ProofOfIdentity",
    "ProofOfAddress",
  ]);

  // Check if all required documents are present
  async validateDocumentSet(
    documents: LinkedCredential<any>[]
  ): Promise<boolean> {
    const presentDocTypes = new Set<string>(documents.map((doc) => doc.type));
    return Array.from(this.requiredDocuments).every((required) =>
      presentDocTypes.has(required)
    );
  }

  // Updated method to get correct document ID
  private getDocumentId(doc: LinkedCredential<any>): string {
    const { linkedId } = LinkedCredential.normalizeLinkedCredentialId(doc.id);
    return linkedId;
  }

  // Updated review document method
  async reviewDocument(
    document: LinkedCredential<any>,
    status: DocumentStatus,
    comments: string,
    reviewerId: string
  ): Promise<ReviewDecision> {
    const documentId = this.getDocumentId(document);
    const decision: ReviewDecision = {
      documentId,
      status,
      comments,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
    };
    this.decisions.set(documentId, decision);
    return decision;
  }

  // Updated method to check approvals
  async areAllDocumentsApproved(
    documents: LinkedCredential<any>[]
  ): Promise<boolean> {
    return documents.every((doc) => {
      const docId = this.getDocumentId(doc);
      const decision = this.decisions.get(docId);
      return decision?.status === DocumentStatus.APPROVED;
    });
  }

  // Search through VCs based on criteria
  async searchVCs(criteria: any): Promise<any[]> {
    try {
      const result =
        await compliance_officer_client.credentials.credentialSearch({
          filter: [
            {
              data: {
                type: {
                  operator: "IN",
                  values: criteria.documentTypes || [],
                },
              },
            },
          ],
        });
      return result.items;
    } catch (error) {
      console.error("Error searching VCs:", error);
      return [];
    }
  }

  // Issue bank account VC after approval
  async issueBankAccountVC(
    customerId: string,
    approvedDocuments: LinkedCredential<any>[]
  ): Promise<any> {
    if (!(await this.areAllDocumentsApproved(approvedDocuments))) {
      throw new Error("Not all documents are approved");
    }

    try {
      const bankAccountVC =
        await compliance_officer_client.createVcDecorator(BankAccountInfo);
      const bankKey = await compliance_officer_client.keys.keyGenerate({
        data: { type: "ED25519" },
      });

      const vcDraft = await bankAccountVC.create({
        claims: {
          customerId,
          accountStatus: "ACTIVE",
          approvalDate: new Date().toISOString(),
          linkedDocuments: approvedDocuments,
        },
      });

      const issuedVC = await vcDraft.issue(bankKey.id);
      return issuedVC;
    } catch (error) {
      console.error("Error issuing bank account VC:", error);
      throw error;
    }
  }
}

// Example usage
async function handleCustomerDocuments(
  customerId: string,
  documents: LinkedCredential<any>[]
) {
  const reviewManager = new ComplianceReviewManager();

  try {
    // Validate document set
    const isValid = await reviewManager.validateDocumentSet(documents);
    if (!isValid) {
      throw new Error("Incomplete document set");
    }

    // Review each document
    for (const doc of documents) {
      await reviewManager.reviewDocument(
        doc,
        DocumentStatus.APPROVED,
        "Document verified successfully",
        "compliance_officer_1"
      );
    }

    // Check if all approved and issue bank account VC
    if (await reviewManager.areAllDocumentsApproved(documents)) {
      const bankAccountVC = await reviewManager.issueBankAccountVC(
        customerId,
        documents
      );
      console.log("Bank account VC issued:", bankAccountVC);
    }
  } catch (error) {
    console.error("Error processing documents:", error);
  }
}

const customerId = "customer_123";
const documents: LinkedCredential<any>[] = [
 
];

handleCustomerDocuments(customerId, documents);
