import { source } from '@/lib/source';
import { join } from 'path';
import { readFile } from "fs/promises";;
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getMDXComponents } from '@/mdx-components';
import { DocsActions } from "@/components/DocsActions";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDXContent = page.data.body;

  let markdownContent = "";

  const slugPath = params.slug?.join("/") || "index";

  const generatePaths = (basePath: string) => {
    const paths = [
      join(process.cwd(), "content/docs", `${basePath}.mdx`),
      join(process.cwd(), "content/docs", basePath, "index.mdx"),
    ];

    // Handle fumadocs (docs) folder convention
    if (params.slug && params.slug.length > 0) {
      if (params.slug.length >= 1) {
        const pathWithDocs = [
          params.slug[0],
          "(docs)",
          ...params.slug.slice(1),
        ].join("/");
        paths.push(
          join(process.cwd(), "content/docs", `${pathWithDocs}.mdx`),
          join(process.cwd(), "content/docs", pathWithDocs, "index.mdx")
        );
      }
      if (params.slug.length >= 2) {
        const pathWithDocs = [
          params.slug[0],
          params.slug[1],
          "(docs)",
          ...params.slug.slice(2),
        ].join("/");
        paths.push(
          join(process.cwd(), "content/docs", `${pathWithDocs}.mdx`),
          join(process.cwd(), "content/docs", pathWithDocs, "index.mdx")
        );
      }
    }

    return paths;
  };

  const possiblePaths = generatePaths(slugPath);

  // Add root index for homepage
  if (!params.slug || params.slug.length === 0) {
    possiblePaths.push(join(process.cwd(), "content/docs", "index.mdx"));
  }

  for (const filePath of possiblePaths) {
    try {
      markdownContent = await readFile(filePath, "utf-8");
      break;
    } catch {
      // Continue to next path
    }
  }

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsActions slug={params.slug} markdownContent={markdownContent} />
      <DocsBody>
        <MDXContent
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
