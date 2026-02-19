# Unsplash Production Application Guide

This document contains all the information you need to apply for Unsplash production access.

## Application Details

### Basic Information

- **Application Name:** Zach Liibbe Personal Website
- **Website URL:** https://zachliibbe.com
- **Application Type:** Personal Blog Website
- **Platform:** Web (Next.js)

### Use Case Description

**Primary Use:** Automatically fetch high-quality featured images for blog posts

**Detailed Description:**
Our personal website includes a blog system that automatically selects relevant, high-quality images from Unsplash to serve as featured images for blog posts. The system intelligently matches images based on:

- Blog post categories (Development, Personal, Learning, Projects)
- Associated tags (nextjs, typescript, architecture, etc.)
- Post title keywords
- Fallback to category-appropriate generic terms

**Value Proposition:**

- Enhances the visual appeal and professionalism of blog content
- Provides exposure to talented photographers through proper attribution
- Creates a better reading experience for visitors
- Drives traffic to Unsplash through attribution links

## Implementation Details

### Technical Implementation

- **Framework:** Next.js 15 with TypeScript
- **API Integration:** RESTful API calls using fetch()
- **Caching Strategy:** 1-hour cache to minimize API calls
- **Rate Limiting:** Built-in monitoring and respect for API limits
- **Error Handling:** Graceful fallbacks when API is unavailable

### Code Quality Features

✅ **Proper Attribution:** Every image includes photographer name and Unsplash link  
✅ **Download Tracking:** Required download tracking implemented  
✅ **Rate Limit Monitoring:** Built-in request counting and limit awareness  
✅ **Caching:** Intelligent caching to minimize unnecessary API calls  
✅ **Error Handling:** Graceful degradation when API is unavailable  
✅ **Responsive Images:** Proper image sizing for different screen sizes

### Attribution Implementation

```typescript
// Attribution is displayed on every image
export function getPhotoAttribution(photo: UnsplashPhoto): {
  text: string;
  photographerUrl: string;
  unsplashUrl: string;
} {
  return {
    text: `Photo by ${photo.user.name} on Unsplash`,
    photographerUrl: photo.user.links.html,
    unsplashUrl: photo.links.html,
  };
}
```

## Expected Usage Patterns

### Volume Estimates

- **Current:** 2-5 API calls per blog post
- **Monthly Average:** 10-20 requests per month (1-2 posts monthly)
- **Peak Usage:** 50-100 requests per month (during active writing periods)
- **Annual Estimate:** 200-600 requests per year

### Request Types

- **Search Photos:** Primary API endpoint used (90% of requests)
- **Download Tracking:** Required tracking calls (10% of requests)
- **Batch Requests:** None (single images per post)

### Caching Strategy

- **Image URLs:** Cached for 1 hour to minimize repeated requests
- **Search Results:** Stored locally to avoid re-fetching for same queries
- **Attribution Data:** Cached with image URLs for consistency

## Compliance with Unsplash Guidelines

### Attribution Requirements

✅ **Photographer Credit:** Always displayed prominently  
✅ **Unsplash Credit:** "on Unsplash" included in all attributions  
✅ **Clickable Links:** Both photographer and Unsplash links are clickable  
✅ **Visible Placement:** Attribution appears near each image

### API Usage Guidelines

✅ **Rate Limits:** Built-in monitoring and respect for limits  
✅ **Download Tracking:** Implemented for all image usage  
✅ **No Hotlinking:** Images are properly referenced, not hotlinked  
✅ **Quality Content:** Images enhance legitimate blog content

### Prohibited Uses (Not Applicable)

❌ **Competing Service:** Not building a competing photo service  
❌ **Bulk Download:** Not downloading images in bulk  
❌ **Reselling:** Not selling or redistributing images  
❌ **Inappropriate Content:** Only using for professional blog content

## Demonstrable Value

### Website Traffic

- **Monthly Visitors:** Growing personal website with regular traffic
- **Content Quality:** Professional development and personal blog posts
- **SEO Benefits:** Images improve content engagement and sharing

### Photographer Exposure

- **Attribution Visibility:** All images include prominent photographer credits
- **Click-through Potential:** Visitors can discover photographers through our content
- **Professional Context:** Images are showcased in high-quality blog content

### Unsplash Brand Exposure

- **Logo Placement:** Unsplash branding included in attribution
- **Link Placement:** Direct links to Unsplash for each image
- **Quality Association:** Unsplash associated with professional content

## Future Plans

### Scaling Considerations

- **Content Growth:** Expect 2-4 blog posts per month
- **Feature Expansion:** May add image galleries or project showcases
- **Traffic Growth:** Anticipate increased website traffic over time

### Additional Features (Potential)

- **Series Images:** Consistent imagery for blog post series
- **Category Galleries:** Curated image collections by category
- **Guest Posts:** Potential for guest authors (still single admin control)

## Technical Specifications

### Development Environment

- **Local Development:** Demo mode for testing and development
- **Production Environment:** Will use production keys responsibly
- **Version Control:** All code tracked in Git with proper documentation

### Monitoring and Maintenance

- **Usage Tracking:** Built-in monitoring of API usage patterns
- **Error Logging:** Comprehensive error tracking and debugging
- **Regular Updates:** Code maintained with latest best practices

## Contact Information

**Developer:** Zach Liibbe  
**Email:** [Your email address]  
**Website:** https://zachliibbe.com  
**GitHub:** [Your GitHub profile]

## Supporting Documentation

### Code Repository

The complete implementation is available for review, demonstrating:

- Proper API integration
- Attribution implementation
- Rate limiting and caching
- Error handling

### Live Examples

- Blog posts with Unsplash images and proper attribution
- Working attribution links to photographers and Unsplash
- Responsive image implementation

---

## Application Submission Checklist

Before submitting your application, ensure you have:

- [ ] Completed application form with above details
- [ ] Provided website URL with working examples
- [ ] Demonstrated proper attribution implementation
- [ ] Shown reasonable usage estimates
- [ ] Confirmed compliance with all API guidelines
- [ ] Prepared to provide code samples if requested
- [ ] Ready to respond to any follow-up questions

## Next Steps

1. **Visit:** https://unsplash.com/developers
2. **Navigate to:** Your application dashboard
3. **Click:** Apply for Production
4. **Complete:** Application form with above information
5. **Submit:** Application for review
6. **Wait:** for approval (typically 1-2 weeks)
7. **Update:** your environment variables once approved

## Additional Resources

- **API Guidelines:** https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines
- **Developer Documentation:** https://unsplash.com/documentation
- **Attribution Examples:** https://help.unsplash.com/en/articles/2612421-how-do-i-use-the-unsplash-license
