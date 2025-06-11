# gatsby-plugin-watermark

A Gatsby plugin that automatically adds configurable watermarks to all images during the build process. Supports both text and image watermarks.

## Installation

```bash
npm install gatsby-plugin-watermark
# or
yarn add gatsby-plugin-watermark
```

## Usage

Add the plugin to your `gatsby-config.js`:

```javascript
module.exports = {
  plugins: [
    'gatsby-plugin-sharp',
    'gatsby-source-filesystem',
    {
      resolve: 'gatsby-plugin-watermark',
      options: {
        // Required: Specify the type of watermark
        type: 'text', // or 'image'
        
        // Text watermark options
        text: 'Your Watermark Text',
        fontSize: 32,
        fontColor: '#ffffff',
        
        // Image watermark options
        imagePath: '/path/to/watermark.png', // Required if type is 'image'
        scale: 0.2, // Scale factor for image watermark (0-1)
        
        // Common options
        opacity: 0.5,
        position: 'bottom-right', // Can be: 'top-left', 'top-right', 'bottom-left', 'bottom-right'
        margin: 20,
      },
    },
  ],
}
```

The plugin will automatically process all images in your Gatsby project and add watermarks according to your configuration. The watermarked images will be saved alongside the original images with a "watermarked-" prefix.

## Configuration Options

The plugin accepts the following configuration options:

### Common Options
- `type` (String): The type of watermark ('text' or 'image')
- `opacity` (Number): The opacity of the watermark (0-1) (default: 0.5)
- `position` (String): The position of the watermark (default: 'bottom-right')
  - Available positions: 'top-left', 'top-right', 'bottom-left', 'bottom-right'
- `margin` (Number): The margin from the edges in pixels (default: 20)

### Text Watermark Options
- `text` (String): The watermark text to display (default: 'Watermark')
- `fontSize` (Number): The size of the watermark text in pixels (default: 32)
- `fontColor` (String): The color of the watermark text in hex format (default: '#ffffff')

### Image Watermark Options
- `imagePath` (String): Path to the watermark image file (required if type is 'image')
- `scale` (Number): Scale factor for the watermark image (0-1) (default: 0.2)

## Examples

### Text Watermark
```javascript
{
  resolve: 'gatsby-plugin-watermark',
  options: {
    type: 'text',
    text: '© 2024 Your Company',
    fontSize: 32,
    fontColor: '#ffffff',
    opacity: 0.5,
    position: 'bottom-right',
    margin: 20,
  },
}
```

### Image Watermark
```javascript
{
  resolve: 'gatsby-plugin-watermark',
  options: {
    type: 'image',
    imagePath: './src/images/logo.png',
    scale: 0.2,
    opacity: 0.5,
    position: 'bottom-right',
    margin: 20,
  },
}
```

## How It Works

The plugin automatically:
1. Detects all images in your Gatsby project
2. Processes each image to add the watermark
3. Saves the watermarked version alongside the original
4. Integrates with Gatsby's image processing pipeline

## GraphQL Usage

You can query watermarked images using GraphQL:

```graphql
query {
  allFile(filter: { internal: { mediaType: { regex: "/image/" } } }) {
    nodes {
      id
      absolutePath
    }
  }
}
```

## License

MIT 