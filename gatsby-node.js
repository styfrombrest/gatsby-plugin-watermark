const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

exports.onPreBootstrap = ({ reporter }) => {
  reporter.info('gatsby-plugin-watermark: Adding watermark to images');
};

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;
  const typeDefs = `
    type WatermarkOptions {
      type: String
      text: String
      imagePath: String
      fontSize: Int
      fontColor: String
      opacity: Float
      position: String
      margin: Int
      scale: Float
    }
  `;
  createTypes(typeDefs);
};

exports.createResolvers = ({ createResolvers }) => {
  createResolvers({
    ImageSharp: {
      watermark: {
        type: 'WatermarkOptions',
        args: {
          type: 'String',
          text: 'String',
          imagePath: 'String',
          fontSize: 'Int',
          fontColor: 'String',
          opacity: 'Float',
          position: 'String',
          margin: 'Int',
          scale: 'Float',
        },
        resolve: (source, args) => {
          return {
            type: args.type || 'text',
            text: args.text || 'Watermark',
            imagePath: args.imagePath || '',
            fontSize: args.fontSize || 32,
            fontColor: args.fontColor || '#ffffff',
            opacity: args.opacity || 0.5,
            position: args.position || 'bottom-right',
            margin: args.margin || 20,
            scale: args.scale || 0.2,
          };
        },
      },
    },
  });
};

exports.onCreateNode = async ({ node, actions, createNodeId, createContentDigest }) => {
  if (node.internal.type === 'File' && node.internal.mediaType === 'image') {
    const { createNode } = actions;
    
    // Create a new node for the watermarked image
    const watermarkedNode = {
      id: createNodeId(`watermarked-${node.id}`),
      parent: node.id,
      internal: {
        type: 'WatermarkedImage',
        contentDigest: createContentDigest(node),
      },
      originalImage: node,
    };

    createNode(watermarkedNode);
  }
};

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;

  const result = await graphql(`
    query {
      allWatermarkedImage {
        nodes {
          id
          originalImage {
            absolutePath
          }
        }
      }
    }
  `);

  if (result.errors) {
    reporter.panicOnBuild('Error while running GraphQL query.');
    return;
  }

  const watermarkImage = async (imagePath, options) => {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    let compositeOptions = [];

    if (options.type === 'text') {
      // Create text watermark
      const svgText = `
        <svg width="${metadata.width}" height="${metadata.height}">
          <style>
            .watermark { 
              fill: ${options.fontColor};
              font-size: ${options.fontSize}px;
              font-family: Arial;
              opacity: ${options.opacity};
            }
          </style>
          <text
            x="${options.position.includes('right') ? metadata.width - options.margin : options.margin}"
            y="${options.position.includes('bottom') ? metadata.height - options.margin : options.margin + options.fontSize}"
            class="watermark"
            text-anchor="${options.position.includes('right') ? 'end' : 'start'}"
          >
            ${options.text}
          </text>
        </svg>
      `;
      
      compositeOptions.push({
        input: Buffer.from(svgText),
        top: 0,
        left: 0,
      });
    } else if (options.type === 'image' && options.imagePath) {
      // Process image watermark
      const watermarkImage = sharp(options.imagePath);
      const watermarkMetadata = await watermarkImage.metadata();
      
      // Calculate scaled dimensions
      const scaledWidth = Math.round(metadata.width * options.scale);
      const scaledHeight = Math.round((scaledWidth * watermarkMetadata.height) / watermarkMetadata.width);
      
      // Resize watermark image
      const resizedWatermark = await watermarkImage
        .resize(scaledWidth, scaledHeight)
        .toBuffer();
      
      // Calculate position
      let top = 0;
      let left = 0;
      
      if (options.position.includes('bottom')) {
        top = metadata.height - scaledHeight - options.margin;
      } else {
        top = options.margin;
      }
      
      if (options.position.includes('right')) {
        left = metadata.width - scaledWidth - options.margin;
      } else {
        left = options.margin;
      }
      
      compositeOptions.push({
        input: resizedWatermark,
        top,
        left,
        blend: 'over',
      });
    }

    return image
      .composite(compositeOptions)
      .toBuffer();
  };

  // Process each image
  for (const node of result.data.allWatermarkedImage.nodes) {
    const options = {
      type: 'text', // or 'image'
      text: 'Watermark',
      imagePath: '', // Path to watermark image if type is 'image'
      fontSize: 32,
      fontColor: '#ffffff',
      opacity: 0.5,
      position: 'bottom-right',
      margin: 20,
      scale: 0.2, // Scale factor for image watermark
    };

    try {
      const watermarkedBuffer = await watermarkImage(node.originalImage.absolutePath, options);
      const outputPath = path.join(
        path.dirname(node.originalImage.absolutePath),
        `watermarked-${path.basename(node.originalImage.absolutePath)}`
      );
      
      await fs.promises.writeFile(outputPath, watermarkedBuffer);
      
      reporter.info(`Created watermarked image: ${outputPath}`);
    } catch (error) {
      reporter.error(`Error processing image ${node.originalImage.absolutePath}: ${error.message}`);
    }
  }
}; 