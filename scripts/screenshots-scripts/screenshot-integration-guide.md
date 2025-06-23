# iTracksy Screenshot Integration Guide for Web Developers

This technical guide explains how to integrate the automatically generated feature screenshots into the iTracksy landing page website.

## Screenshot Generation Technical Details

The screenshots are generated using Playwright testing framework, which:

1. Launches the packaged Electron app in development mode
2. Navigates through different pages
3. Captures full-page screenshots
4. Stores them in a standardized format

## Screenshot Specifications

| Feature                 | Filename                    | Resolution | Format |
| ----------------------- | --------------------------- | ---------- | ------ |
| Activity Tracking       | activity-tracking.png       | Full-page  | PNG    |
| Project Management      | project-management.png      | Full-page  | PNG    |
| Time Analytics          | time-analytics.png          | Full-page  | PNG    |
| Activity Classification | activity-classification.png | Full-page  | PNG    |
| Rule Classification     | rule-classification.png     | Full-page  | PNG    |

## Integration into Website

### Directory Structure

The screenshots are automatically copied to:

```
../itracksy-web/public/screenshots/
```

This makes them available via the URL path:

```
/screenshots/[filename].png
```

### Image Optimization

Consider implementing the following optimizations:

1. Convert PNG files to WebP format for improved performance:

```bash
# Using sharp or similar tool
npx sharp --input "../itracksy-web/public/screenshots/*.png" --output "../itracksy-web/public/screenshots/" --format webp
```

2. Create responsive image variants:

```bash
# Create mobile variants at 480px width
npx sharp --input "../itracksy-web/public/screenshots/*.png" --output "../itracksy-web/public/screenshots/mobile/" --resize 480
```

3. Use the HTML `<picture>` element for responsive images:

```html
<picture>
  <source
    media="(max-width: 480px)"
    srcset="/screenshots/mobile/activity-tracking.webp"
    type="image/webp"
  />
  <source
    media="(min-width: 481px)"
    srcset="/screenshots/activity-tracking.webp"
    type="image/webp"
  />
  <img src="/screenshots/activity-tracking.png" alt="Activity Tracking Feature" loading="lazy" />
</picture>
```

### React Component Example

Here's a reusable React component for displaying feature screenshots:

```jsx
import React from "react";

const FeatureShowcase = ({
  title,
  description,
  imageName,
  benefits = [],
  imagePosition = "right",
}) => {
  return (
    <section
      className={`feature-section ${imagePosition === "left" ? "image-left" : "image-right"}`}
    >
      <div className="feature-content">
        <h2>{title}</h2>
        <p>{description}</p>
        {benefits.length > 0 && (
          <ul className="feature-benefits">
            {benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="feature-image">
        <picture>
          <source
            media="(max-width: 480px)"
            srcset={`/screenshots/mobile/${imageName}.webp`}
            type="image/webp"
          />
          <source
            media="(min-width: 481px)"
            srcset={`/screenshots/${imageName}.webp`}
            type="image/webp"
          />
          <img
            src={`/screenshots/${imageName}.png`}
            alt={`${title} feature in iTracksy`}
            loading="lazy"
          />
        </picture>
      </div>
    </section>
  );
};

// Usage example
const FeaturesSection = () => {
  return (
    <div className="features-container">
      <FeatureShowcase
        title="Activity Tracking"
        description="Track your work sessions effortlessly with automatic activity capture."
        imageName="activity-tracking"
        benefits={[
          "Automatic application tracking",
          "Real-time productivity insights",
          "Detailed activity timeline",
        ]}
        imagePosition="right"
      />

      <FeatureShowcase
        title="Project Management"
        description="Organize tasks with an intuitive kanban board."
        imageName="project-management"
        benefits={[
          "Customizable board layouts",
          "Drag-and-drop task management",
          "Progress visualization",
        ]}
        imagePosition="left"
      />

      {/* Additional features... */}
    </div>
  );
};
```

### CSS Styling Example

```css
.feature-section {
  display: flex;
  padding: 4rem 2rem;
  gap: 2rem;
  align-items: center;
}

.image-left {
  flex-direction: row;
}

.image-right {
  flex-direction: row-reverse;
}

.feature-content {
  flex: 1;
  max-width: 500px;
}

.feature-image {
  flex: 1;
  display: flex;
  justify-content: center;
}

.feature-image img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.feature-image img:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .feature-section {
    flex-direction: column;
    padding: 3rem 1rem;
  }

  .feature-content {
    max-width: 100%;
  }
}
```

## Continuous Integration

When new features are added or UI changes are made:

1. Run the screenshot script in the iTracksy app:

   ```bash
   ./scripts/generate-screenshots.sh
   ```

2. The script will:

   - Take new screenshots
   - Automatically copy them to the web project directory
   - Preserve any existing image optimizations

3. Deploy the website with updated screenshots

## Troubleshooting

If screenshots don't appear or show outdated UI:

1. Check that the screenshots were successfully generated:

   ```bash
   ls -la screenshots/
   ```

2. Verify the copy process was successful:

   ```bash
   ls -la ../itracksy-web/public/screenshots/
   ```

3. Clear browser cache or use incognito mode to test

4. Check browser console for image loading errors

## Best Practices for Landing Page Performance

1. Use WebP with PNG fallback
2. Implement lazy loading for below-the-fold images
3. Specify image dimensions to prevent layout shifts
4. Use responsive images for different viewport sizes
5. Implement a lightweight, progressive loading animation
