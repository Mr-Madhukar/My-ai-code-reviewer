/**
 * Pinecone vector database client.
 *
 * Both PR review and repo sync store code as embeddings in Pinecone so we can
 * do semantic search at review time. PR diffs live in a per-PR namespace;
 * full repo code lives in a separate per-repo namespace (see `buildPrNamespace`
 * and `buildRepoNamespace`). This module lazily creates one Pinecone client
 * and returns the configured index handle.
 */
import { Pinecone } from "@pinecone-database/pinecone";

/** Singleton client — created on first use to avoid work during cold imports. */
let pinecone: Pinecone | null = null;
let indexInitialized = false;

/**
 * Returns the Pinecone index used for all code embeddings in this app.
 *
 * Pinecone's integrated embedding turns each record's `text` field into a
 * vector automatically on upsert. Namespaces partition data so PR chunks and
 * repo chunks never collide.
 *
 * If the index does not exist, it will be automatically created using the
 * integrated multilingual-e5-large model.
 *
 * @returns Pinecone index handle for `PINECONE_INDEX`
 */
export async function getPineconeIndex() {
  if (!pinecone) {
    pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  }

  const indexName = process.env.PINECONE_INDEX || "shipflow-ai";

  if (!indexInitialized) {
    try {
      const indexes = await pinecone.listIndexes();
      const exists = indexes.indexes?.some((idx) => idx.name === indexName);

      if (!exists) {
        console.log(`Pinecone index "${indexName}" not found. Creating it with integrated inference model multilingual-e5-large...`);
        await pinecone.createIndexForModel({
          name: indexName,
          cloud: "aws",
          region: "us-east-1",
          embed: {
            model: "multilingual-e5-large",
            fieldMap: {
              text: "text",
            },
          },
          waitUntilReady: true,
        });
        console.log(`Pinecone index "${indexName}" created successfully!`);
      }
      indexInitialized = true;
    } catch (err) {
      console.error("Failed to initialize/verify Pinecone index:", err);
    }
  }

  return pinecone.index(indexName);
}
