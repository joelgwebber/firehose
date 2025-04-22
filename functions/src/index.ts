import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as pdfParse from "pdf-parse";
import * as cheerio from "cheerio";
import * as MarkdownIt from "markdown-it";

admin.initializeApp();

const firestore = admin.firestore();
const storage = admin.storage();
const md = new MarkdownIt();

export interface Document {
  id: string;
  filename: string;
  contentType: string;
  content: string;
  metadata: Record<string, any>;
  uploadedAt: admin.firestore.Timestamp;
}

export const processUpload = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const contentType = object.contentType || "";
  const fileId = object.id || object.name || "unknown";

  if (!filePath) {
    console.error("File path is undefined");
    return;
  }

  try {
    // Download the file
    const bucket = storage.bucket(object.bucket);
    const [file] = await bucket.file(filePath).download();

    let content = "";

    // Process file based on content type
    if (contentType.includes("pdf")) {
      const pdfData = await pdfParse(file);
      content = pdfData.text;
    } else if (contentType.includes("html")) {
      const $ = cheerio.load(file.toString());
      // Remove scripts and styles
      $('script, style').remove();
      content = $('body').text().trim();
    } else if (contentType.includes("markdown") || contentType.includes("md") || filePath.endsWith(".md")) {
      const markdownText = file.toString();
      // Parse markdown to html and then extract text
      const htmlContent = md.render(markdownText);
      const $ = cheerio.load(htmlContent);
      content = $.text().trim();
    } else if (contentType.includes("text")) {
      content = file.toString();
    } else {
      console.log(`Unsupported file type: ${contentType}`);
      return;
    }

    // Store in Firestore
    const document: Document = {
      id: fileId,
      filename: filePath.split("/").pop() || "",
      contentType,
      content,
      metadata: {
        size: object.size,
        updated: object.updated,
      },
      uploadedAt: admin.firestore.Timestamp.now(),
    };

    await firestore.collection("documents").doc(fileId).set(document);

    console.log(`Successfully processed ${filePath}`);
  } catch (error) {
    console.error("Error processing file:", error);
  }
});

// Function to search documents
export const searchDocuments = functions.https.onCall(async (data, context) => {
  // Implement simple text search
  const query = data.query;
  if (!query) {
    return { results: [] };
  }

  const snapshot = await firestore.collection("documents")
    .orderBy("uploadedAt", "desc")
    .get();

  const results = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as Document;
    // Simple string match for now
    if (data.content.toLowerCase().includes(query.toLowerCase())) {
      results.push({
        id: doc.id,
        filename: data.filename,
        contentType: data.contentType,
        // Include a snippet of the matched content
        snippet: generateSnippet(data.content, query),
        uploadedAt: data.uploadedAt.toDate(),
      });
    }
  }

  return { results };
});

// Helper function to generate a snippet with the search term in context
function generateSnippet(content: string, query: string): string {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  const index = contentLower.indexOf(queryLower);

  if (index === -1) return content.substring(0, 150) + "...";

  const start = Math.max(0, index - 75);
  const end = Math.min(content.length, index + query.length + 75);

  let snippet = content.substring(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";

  return snippet;
}
