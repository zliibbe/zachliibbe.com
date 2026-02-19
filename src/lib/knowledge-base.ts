import { promises as fs } from 'node:fs';
import path from 'node:path';
import { chunkText, generateEmbeddings } from './embeddings';
import { type KnowledgeVector, upsertVectors } from './pinecone';

export interface KnowledgeFile {
  filename: string;
  title: string;
  content: string;
  category: string;
}

const KNOWLEDGE_BASE_PATH = path.join(
  process.cwd(),
  'src',
  'data',
  'knowledge'
);

export async function loadKnowledgeFiles(): Promise<KnowledgeFile[]> {
  try {
    const files = await fs.readdir(KNOWLEDGE_BASE_PATH);
    const markdownFiles = files.filter(file => file.endsWith('.md'));

    const knowledgeFiles: KnowledgeFile[] = [];

    for (const filename of markdownFiles) {
      const filePath = path.join(KNOWLEDGE_BASE_PATH, filename);
      const content = await fs.readFile(filePath, 'utf-8');

      // Extract title from first line or use filename
      const lines = content.split('\n');
      let title = filename.replace('.md', '');
      let actualContent = content;

      if (lines[0]?.startsWith('# ')) {
        title = lines[0]!.replace('# ', '').trim();
        actualContent = lines.slice(1).join('\n').trim();
      }

      // Determine category based on filename
      const category = getCategoryFromFilename(filename);

      knowledgeFiles.push({
        filename,
        title,
        content: actualContent,
        category,
      });
    }

    return knowledgeFiles;
  } catch (error) {
    console.error('Error loading knowledge files:', error);
    return [];
  }
}

function getCategoryFromFilename(filename: string): string {
  const name = filename.replace('.md', '').toLowerCase();

  const categoryMap: { [key: string]: string } = {
    personal: 'Personal',
    professional: 'Professional',
    projects: 'Projects',
    contact: 'Contact',
    about: 'About',
    skills: 'Skills',
    experience: 'Experience',
    education: 'Education',
  };

  return categoryMap[name] || 'General';
}

export async function processKnowledgeBase(): Promise<void> {
  console.log('Starting knowledge base processing...');

  try {
    const knowledgeFiles = await loadKnowledgeFiles();
    console.log(`Loaded ${knowledgeFiles.length} knowledge files`);

    const allVectors: KnowledgeVector[] = [];

    for (const file of knowledgeFiles) {
      console.log(`Processing ${file.filename}...`);

      // Chunk the content
      const chunks = chunkText(file.content, 800, 100);
      console.log(`Created ${chunks.length} chunks for ${file.filename}`);

      // Generate embeddings for all chunks
      const embeddings = await generateEmbeddings(chunks);

      // Create vectors
      for (let i = 0; i < chunks.length; i++) {
        const vector: KnowledgeVector = {
          id: `${file.filename}_chunk_${i}`,
          values: embeddings[i]!,
          metadata: {
            source: file.filename,
            title: file.title,
            content: chunks[i]!,
            category: file.category,
            chunk: i,
          },
        };
        allVectors.push(vector);
      }
    }

    console.log(`Generated ${allVectors.length} total vectors`);

    // Upsert to Pinecone in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < allVectors.length; i += BATCH_SIZE) {
      const batch = allVectors.slice(i, i + BATCH_SIZE);
      console.log(
        `Upserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allVectors.length / BATCH_SIZE)}`
      );
      await upsertVectors(batch);
    }

    console.log('Knowledge base processing completed successfully');
  } catch (error) {
    console.error('Error processing knowledge base:', error);
    throw error;
  }
}

export async function refreshKnowledgeBase(): Promise<void> {
  console.log('Refreshing knowledge base...');
  await processKnowledgeBase();
}
