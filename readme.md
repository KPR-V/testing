The process of verifying a verifiable credential ensures that the credential's information is genuine and has not been altered. This is achieved by checking the cryptographic proof attached to the credential, which validates the issuer's identity and confirms the integrity of the claims (data) within the credential.


Steps to Verify a Credential

Here’s a breakdown of the steps required to verify a credential, from prerequisites to using the actual verification command:


Prerequisites:


Install and Configure the SDK: Ensure that you have the SDK (Software Development Kit) installed and configured to interact with the system issuing or verifying credentials.
Define Credential Schema: A credential schema outlines the structure and data types for the information within the credential. By defining a schema, you ensure that both the credential’s issuer and verifier understand the expected data format and structure.

Create a Draft: Before issuing a credential, it’s common to create a draft to ensure that all data fields are filled in according to the defined schema.

Issue Credential: The credential is then issued, meaning it’s finalized with all necessary data, signed by the issuer, and made ready for verification.

Verification Example:




Verification Command: The verification process typically involves calling the verify method, which checks the credential’s cryptographic proof, verifying its origin and that the data remains unchanged.

Example Code:


typescript
```typescript
const verificationResult = await credential.verify();
```
Explanation:
The verify method performs the cryptographic checks on the credential's data.

If successful, verificationResult contains information confirming that the credential is valid.


---





verifying credentials is essential for confirming the authenticity and integrity of each credential at certain stages. Given your code structure, you can implement verification in the following areas:



After Credential Issuance: When Miko or the Employer issues a credential, you can verify the issued credential right after it's created to confirm its integrity.



Example: Right after issuing proofofidentityVc in Miko's code and contractVc in the Employer's code.


```typescript

const isValidIdentityRequest = await proofofidentityVc.verify();
if (isValidIdentityRequest) {
  console.log("Identity Request VC is verified successfully.");
} else {
  console.error("Identity Request VC verification failed.");
}
```


When Receiving a Credential: Before accepting or processing received credentials, Miko and the Employer should verify them to ensure they’re untampered and trustworthy.



Example: In the final section where Miko retrieves the employmentcontractresponseVc, you can verify this credential before reading its claims.


```typescript

const isResponseValid = await employmentcontractresponseVc.verify();
if (isResponseValid) {
  const responseClaims = await employmentcontractresponseVc.getClaims();
  // Proceed to retrieve further details as shown in the original code
} else {
  console.error("Employment contract response VC verification failed.");
}
```


Before Sending a Credential: Before Miko or the Employer sends out a credential, verifying it ensures its validity and prevents sending tampered data. This verification can be added just before the send method in each case.



Adding these verification steps will improve data integrity and security without majorly altering the flow of your code. Let me know if you'd like further clarification on any part!

---


Key Operations and Examples

 
 Upload File Blob (/files/upload)


This endpoint uploads the file's binary data (blob) to the Truvity server.


After uploading, it returns a blob_id and an upload_uri for reference.

Example:

```typescript

import { TruvityClient } from "@truvity/sdk";
const client = new TruvityClient({ apiKey: "YOUR_API_KEY" });

const response = await client.files.fileUpload({
  headers: { "Idempotency-Key": "unique-key-here" },
  data: fileBlob,
});
console.log(response); // { blob_id: "8249af2f...", upload_uri: "http://example.com" }
```

Create File (/files)


This endpoint creates a new file resource with metadata like filename, annotations, and labels.

blob_id must be provided if the file content was uploaded via the fileUpload() method.

Example:

```typescript

const fileData = {
  data: { filename: "document.pdf" },
  annotations: { property1: "value1" },
  labels: { property2: "value2" }
};

const response = await client.files.createFile({
  headers: { "Idempotency-Key": "unique-key-here" },
  data: fileData,
});
console.log(response); // Returns the created file resource data

```

Get Latest Version of File (/files/{id})

Retrieves the most recent metadata and content details of a file using its unique id.

Example:

```typescript

const response = await client.files.fileLatest("file-id");
console.log(response); // { id: "file-id", data: { filename: "document.pdf" }, ... }

```
Update File (/files/{id})


Updates an existing file’s metadata, including filename, annotations, and labels.

Requires If-Match header to ensure the correct version is updated.

Example:

```typescript

const updatedData = {
  data: { filename: "updated-document.pdf" },
  annotations: { property1: "new-value" },
};

const response = await client.files.updateFile("file-id", {
  headers: {
    "Idempotency-Key": "unique-key-here",
    "If-Match": "etag-value",
  },
  data: updatedData,
});
console.log(response); // Returns updated file details

```
Delete File (/files/{id})


Deletes a file resource based on its unique id.

Requires If-Match header for confirmation of deletion.

Example:

```typescript
await client.files.deleteFile("file-id", {
  headers: {
    "Idempotency-Key": "unique-key-here",
    "If-Match": "etag-value",
  },
});

```
Download File Blob (/files/{id}/revisions/{revision}/download)


Allows downloading a specific revision of the file's binary content.

Example:

```typescript

const response = await client.files.fileDownload("file-id", 1); // Revision 1
console.log(response); // Blob or content of the file

```



Workflow Example: Uploading and Linking a File to a Credential

Here’s a possible workflow to upload a file and link it to a credential using Truvity’s SDK:

Step 1: Upload the File Blob

Use /files/upload to upload the file's binary data and obtain a blob_id.

Step 2: Create the File Resource

Pass the blob_id to /files to create a new file resource and generate metadata.

Step 3: Link to Credential

Use the returned file resource link in a verifiable credential field with VcLinkedFileClaim.

---
# Compliance Officer Panel - Challenge 2

In this challenge, a bank's compliance officer reviews and approves/rejects Miko's submitted Verifiable Credentials (VCs) to determine if they meet the bank's requirements. If approved, the officer issues a final "Bank Account Confirmation" VC. This README outlines the steps to implement a user-friendly UI and backend for managing Miko's VC submissions.

---

## Workflow and Components for Challenge 2

### Step 1: Extend Backend Functions from Challenge 1

**VC Retrieval and Verification:**
- Reuse backend functions from Challenge 1 for fetching, verifying, and linking VCs.
- These functions will retrieve Miko's submitted VCs and assist in their verification.

**Verification and Approval Function:**
- Implement a new function to approve or reject each VC based on bank requirements.
- Set a status for each VC (e.g., "Approved" or "Rejected").

---

### Step 2: Develop the Compliance Officer Panel UI

#### Dashboard Interface:
- **Purpose:** Display all pending applications.
- **Functionality:** Each submission, like Miko's Bank Account Application, shows a summary of submitted VCs and their current status.

#### VC Viewing Panel:
- **Purpose:** Display detailed information for each submitted VC.
- **Details to Show:** 
  - VC Issuer (e.g., Municipality of Amsterdam, Miko’s employer)
  - Linked Status (confirm if VCs are correctly interlinked)
  - Document content preview (fields like ID number, employer name, anonymized as needed)

#### Search Functionality:
- **Purpose:** Allow the officer to search through VCs for specific fields (e.g., name, issuer, date).
- **Use Case:** This enables quick cross-referencing of information.

#### Approval and Rejection Buttons:
- **Purpose:** Enable the officer to mark each VC as "Approved" or "Rejected."
- **Status Update:** Update the backend and reflect the new status in the UI.

---

### Step 3: Implement Document Verification Logic

#### Interlinked VC Check:
- **Functionality:** Ensure that only properly linked VCs are approved.
- **Example:** Miko’s Proof of Registration VC should be linked to her Employment Contract and Proof of Identity.
- **Error Handling:** Display a message for incorrectly linked VCs, prompting Miko to resubmit the correct documents.

#### Status Logging and Notifications:
- **Purpose:** Log each approval/rejection and notify Miko's wallet of status changes.
- **Rejection Note:** Add a reason for each rejection to guide Miko on required corrections.

---

### Step 4: Issue the Final “Bank Account Confirmation” VC

**Automated Issuance:**
- **Enable Button:** If all VCs are approved, activate the "Issue Bank Account VC" button.
- **Functionality:** This VC confirms Miko’s bank account approval and is sent to her wallet.

**Send VC to Miko’s Wallet:**
- **Notification:** Miko’s wallet receives the Bank Account Confirmation VC.
- **Task Completion:** Miko’s bank account setup task is marked as complete.

---

## Example Workflow

1. **Dashboard View:** 
   - Compliance officer logs in and sees Miko’s Bank Account Application with a summary of submitted VCs.

2. **Document Review:** 
   - Officer selects Miko’s application to review detailed VC information:
     - **Proof of Registration:** Issued by Municipality, linked to Employment Contract and Proof of Identity.
     - **Employment Contract:** Issued by employer, valid, interlinked.
     - **Proof of Identity:** Government-issued and verified.

3. **Approving Documents:** 
   - Officer approves Proof of Registration and Employment Contract.
   - If Proof of Identity had issues (e.g., expired), the officer rejects it and provides a reason.

4. **Issuing Final VC:** 
   - Upon all VC approvals, the "Issue Bank Account VC" button activates. 
   - The officer clicks it, generating and sending the final VC to Miko’s wallet.

5. **Notification and Task Completion:** 
   - Miko’s wallet receives the Bank Account Confirmation VC.
   - Miko’s task list marks the account setup as complete, and she is notified of successful account creation.

---

## Summary of Steps

1. **Reuse Backend Verification Functions:** Extend document-fetching and linking functions from Challenge 1.
2. **Develop Compliance Officer Panel UI:** 
   - Create a dashboard for pending applications.
   - Design a VC review screen with options to approve, reject, and search VCs.
3. **Implement Document Verification Logic:**
   - Only allow approval of interlinked VCs.
   - Log actions and send notifications to Miko’s wallet.
4. **Issue Final VC:** Upon approval of all VCs, allow the officer to issue a "Bank Account Confirmation VC."
5. **Send Confirmation to Miko:** Automatically send the final VC to Miko’s wallet and mark the task as complete.

---

This README outlines the necessary steps to create a compliance officer panel that efficiently manages VC submissions, supports document verification, and provides a seamless UI for bank officers.
