import React from "react";
import {
  AppShell,
  AreaChart,
  AsciiField,
  Badge,
  CodeBlock,
  GridPlus,
  IconButton,
  Tag,
  ArrowRightIcon,
  CopyIcon,
  CrawlIcon,
  ExternalIcon,
  ExtractIcon,
  EyeIcon,
  ScrapeIcon,
  SearchEndpointIcon,
} from "@/components/fc";

/* -------------------------------------------------------------------------
   Content
   ------------------------------------------------------------------------- */

const ENDPOINTS = [
  {
    name: "Scrape",
    icon: <ScrapeIcon size={20} />,
    description: "Get llm-ready data from websites. Markdown, JSON, screenshot, etc.",
  },
  {
    name: "Search",
    icon: <SearchEndpointIcon size={20} />,
    badge: "NEW",
    description: "Search the web and get full content from results.",
  },
  {
    name: "Crawl",
    icon: <CrawlIcon size={20} />,
    description: "Crawl all the pages on a website and get data for each page.",
  },
  {
    name: "Extract",
    icon: <ExtractIcon size={20} />,
    description: "Get structured data from websites with AI.",
  },
];

const INTEGRATIONS = [
  "Python",
  "JS/TS SDK",
  "Langchain",
  "Langchain JS",
  "LlamaIndex",
  "Zapier",
  "Make",
  "Discord",
  "CrewAI",
  "Dify",
  "Flowise",
  "Pipedream",
  "n8n",
  "Composio",
  "Langflow",
  "Vectorize",
  "CAMEL-AI",
  "Praison AI",
  "Superinterface",
  "RAGaaS",
  "Cargo",
  "Pabbly Connect",
];

const EXAMPLE_PROJECTS = [
  {
    title: "30+ Examples",
    description: "Collection of simple projects built with Firecrawl",
    tags: ["TypeScript", "Python", "Firecrawl SDK"],
  },
  {
    title: "LLMs.txt Generator",
    description: "Generate an llms.txt with this web app built on Next.js",
    tags: ["TypeScript", "Next.js", "Firecrawl SDK"],
  },
  {
    title: "Trend Finder",
    description: "Stay on top of trending topics on the web with AI",
    tags: ["TypeScript", "Firecrawl SDK"],
  },
  {
    title: "Open Deep Research",
    description: "Open source version of OpenAI's Deep Research",
    tags: ["Next.js", "AI SDK", "Firecrawl SDK"],
  },
  {
    title: "Full App Examples",
    description: "Full Firecrawl apps with source code and instructions",
    tags: ["Python", "Typescript", "Firecrawl SDK"],
  },
];

const MCP_SNIPPET = `{
  "mcpServers": {
    "firecrawl-mcp": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "$API_KEY"
      }
    }
  }
}`;

/** A 7-day series that peaks mid-window, matching the screenshot's curve. */
const SERIES = Array.from({ length: 33 }, (_, index) => {
  const x = (index - 17) / 3.1;
  return Math.exp(-0.5 * x * x);
});

/* -------------------------------------------------------------------------
   Page
   ------------------------------------------------------------------------- */

/**
 * Firecrawl's dashboard Overview, kept as a calibration reference.
 *
 * Unlinked from the nav on purpose: being able to diff a new AutoFlair screen
 * against a known-faithful port is worth one dead route. See DESIGN.md.
 */
export default function FirecrawlReferencePage() {
  return (
    <AppShell>
      {/* ---------------------------------------------- Explore our endpoints */}
      <section className="border-b-1 border-border-faint bg-accent-white p-16 sm:p-24">
        <h1 className="text-title-h5 text-accent-black">Explore our endpoints</h1>
        <p className="mt-4 text-body-medium text-black-alpha-56">
          Power your applications with our comprehensive scraping API
        </p>
      </section>

      <section className="relative grid grid-cols-1 bg-accent-white md:grid-cols-2 lg:grid-cols-4">
        {ENDPOINTS.map((endpoint, index) => (
          <article
            key={endpoint.name}
            className="group relative flex cursor-pointer flex-col gap-10 border-b-1 border-border-faint p-16 transition hover:bg-background-lighter sm:p-24 md:[&:nth-child(even)]:border-l-1 lg:border-l-1 lg:first:border-l-0"
          >
            <span className="text-black-alpha-40 transition group-hover:text-heat-100">
              {endpoint.icon}
            </span>
            <div className="flex items-center gap-8">
              <span className="text-label-large text-accent-black">
                {endpoint.name}
              </span>
              <span className="text-black-alpha-32 transition group-hover:translate-x-2 group-hover:text-heat-100">
                <ArrowRightIcon size={14} />
              </span>
              {endpoint.badge ? <Badge tone="heat">{endpoint.badge}</Badge> : null}
            </div>
            <p className="text-body-medium text-black-alpha-56">
              {endpoint.description}
            </p>
            {index > 0 ? (
              <GridPlus className="-top-5 -left-5 hidden lg:block" />
            ) : null}
          </article>
        ))}
      </section>

      {/* Rhythm band — the grid keeps breathing even where there is no content. */}
      <div className="h-32 border-b-1 border-border-faint bg-accent-white sm:h-64" />

      {/* ------------------------------------------ Usage / key / integration */}
      <section className="grid grid-cols-1 border-b-1 border-border-faint bg-accent-white lg:grid-cols-[1.35fr_1fr]">
        <div className="flex min-w-0 flex-col">
          <div className="border-b-1 border-border-faint p-16 sm:p-24">
            <div className="flex items-start justify-between gap-16">
              <div>
                <h2 className="text-label-x-large text-accent-black">
                  Scraped pages - Last 7 days
                </h2>
                <p className="mt-2 text-body-medium text-black-alpha-48">
                  Credit usage differs
                </p>
              </div>
              <span className="text-title-h3 text-accent-black">2</span>
            </div>

            <div className="mt-24">
              <AreaChart data={SERIES} labels={["08/29", "09/01", "09/05"]} />
            </div>
          </div>

          <div className="p-16 sm:p-24">
            <div className="flex items-center gap-8">
              <h2 className="text-label-x-large text-accent-black">
                Concurrent Browsers
              </h2>
              <span className="flex items-center gap-6 font-mono text-mono-x-small text-heat-100">
                <span
                  className="size-6 animate-heat-pulse rounded-full bg-heat-100"
                  aria-hidden="true"
                />
                [ LIVE ]
              </span>
            </div>
            <p className="mt-4 text-body-medium text-black-alpha-56">
              # of active browsers —{" "}
              <a className="text-heat-100 underline underline-offset-2" href="#">
                upgrade plan
              </a>{" "}
              for faster scraping
            </p>

            <div className="mt-24 flex items-center gap-12">
              <span className="flex-center size-40 rounded-full border-1 border-border-loud font-mono text-mono-medium text-black-alpha-64">
                0
              </span>
              <span className="text-body-medium text-black-alpha-56">
                of <span className="text-accent-black">2</span> active browsers
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col border-t-1 border-border-faint lg:border-t-0 lg:border-l-1">
          <div className="border-b-1 border-border-faint p-16 sm:p-24">
            <h2 className="text-label-x-large text-accent-black">API Key</h2>
            <p className="mt-2 text-body-medium text-black-alpha-48">
              Start scraping right away
            </p>

            <div className="mt-16 flex h-40 items-center gap-8 rounded-8 border-1 border-heat-16 bg-heat-4 px-12">
              <code className="min-w-0 flex-1 truncate font-mono text-mono-small text-heat-100">
                fc-9************************aebf
              </code>
              <IconButton label="Reveal API key" className="text-heat-100">
                <EyeIcon />
              </IconButton>
              <IconButton label="Copy API key" className="text-heat-100">
                <CopyIcon />
              </IconButton>
            </div>
          </div>

          <div className="p-16 sm:p-24">
            <div className="flex items-start justify-between gap-16">
              <div>
                <h2 className="text-label-x-large text-accent-black">
                  MCP Integration
                </h2>
                <p className="mt-2 text-body-medium text-black-alpha-48">
                  Connect with AI tools
                </p>
              </div>
              <div className="flex items-center gap-4">
                <IconButton label="Reveal configuration">
                  <EyeIcon />
                </IconButton>
                <IconButton label="Copy configuration">
                  <CopyIcon />
                </IconButton>
              </div>
            </div>

            <CodeBlock code={MCP_SNIPPET} className="mt-16" />
          </div>
        </div>
      </section>

      {/* -------------------------------- Integrations / example projects */}
      <section className="grid grid-cols-1 bg-accent-white lg:grid-cols-[1.35fr_1fr]">
        <div className="min-w-0">
          <div className="border-b-1 border-border-faint p-16 sm:p-24">
            <h2 className="text-label-x-large text-accent-black">Integrations</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.map((name) => (
              <a
                key={name}
                href="#"
                className="group flex items-center gap-10 border-r-1 border-b-1 border-border-faint p-16 transition hover:bg-background-lighter"
              >
                <span
                  className="flex-center size-24 shrink-0 rounded-6 bg-black-alpha-5 text-label-x-small text-black-alpha-64"
                  aria-hidden="true"
                >
                  {name.charAt(0)}
                </span>
                <span className="flex-1 text-label-medium text-accent-black">
                  {name}
                </span>
                <span className="text-black-alpha-24 transition group-hover:text-heat-100">
                  <ExternalIcon size={14} />
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="relative min-w-0 border-t-1 border-border-faint lg:border-t-0 lg:border-l-1">
          <div className="relative overflow-hidden border-b-1 border-border-faint p-16 sm:p-24">
            <div className="absolute -top-8 right-0 opacity-60">
              <AsciiField rows={8} cols={52} seed={11} />
            </div>
            <h2 className="relative text-label-x-large text-accent-black">
              Example Projects
            </h2>
          </div>

          {EXAMPLE_PROJECTS.map((project) => (
            <a
              key={project.title}
              href="#"
              className="group flex flex-col gap-8 border-b-1 border-border-faint p-16 transition hover:bg-background-lighter sm:p-24"
            >
              <div className="flex items-start justify-between gap-16">
                <h3 className="font-mono text-mono-medium text-accent-black">
                  {project.title}
                </h3>
                <span className="mt-2 text-black-alpha-24 transition group-hover:text-heat-100">
                  <ExternalIcon size={14} />
                </span>
              </div>
              <p className="text-body-medium text-black-alpha-56">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-6">
                {project.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </a>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
