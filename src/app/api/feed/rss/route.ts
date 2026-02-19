import { NextResponse } from 'next/server';
import { getAllPublishedPosts } from '@/lib/blog-storage';

export async function GET() {
  const posts = await getAllPublishedPosts();
  const siteUrl = 'https://zachliibbe.com';
  const feedUrl = `${siteUrl}/api/feed/rss`;

  const rssItems = posts
    .map(post => {
      const postUrl = `${siteUrl}/blog/${post.slug}`;
      const pubDate = new Date(post.publishedAt).toUTCString();

      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid>${postUrl}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
      <author>zach@zachliibbe.com (${post.author})</author>
      <category><![CDATA[${post.categories.join(', ')}]]></category>
    </item>`.trim();
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Zach Liibbe - Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Thoughts on development, life, and everything in between. I write about building things, learning new technologies, and the journey of being a developer.</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <managingEditor>zach@zachliibbe.com (Zach Liibbe)</managingEditor>
    <webMaster>zach@zachliibbe.com (Zach Liibbe)</webMaster>
    <generator>Next.js Blog System</generator>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/favicon-light.png</url>
      <title>Zach Liibbe - Blog</title>
      <link>${siteUrl}/blog</link>
      <width>32</width>
      <height>32</height>
    </image>
${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
