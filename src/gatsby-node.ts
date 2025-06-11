import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import {
  CreateNodeArgs,
  CreatePagesArgs,
  CreateSchemaCustomizationArgs,
  CreateResolversArgs,
  WatermarkOptions,
  WatermarkedImageNode,
} from './types';

export const onPreBootstrap = ({ reporter }: { reporter: { info: (message: string) => void } }) => {
  reporter.info('gatsby-plugin-watermark: Adding watermark to images');
};

export const createSchemaCustomization = ({ actions }: CreateSchemaCustomizationArgs) => {
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

export const createResolvers = ({ createResolvers }: CreateResolversArgs) => {
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
        resolve: (source: any, args: Partial<WatermarkOptions>) => {
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

export const onCreateNode = async ({ node, actions, createNodeId, createContentDigest }: CreateNodeArgs) => {
  if (node.internal.type === 'File' && node.internal.mediaType === 'image') {
    const { createNode } = actions;
    
    const watermarkedNode: WatermarkedImageNode = {
      id: createNodeId(`watermarked-${node.id}`),
      parent: node.id,
      internal: {
        type: 'WatermarkedImage',
        contentDigest: createContentDigest(node),
        owner: 'gatsby-plugin-watermark'
      },
      originalImage: {
        absolutePath: node.absolutePath || '',
      },
    };

    createNode(watermarkedNode);
  }
};

const watermarkImage = async (imagePath: string, options: WatermarkOptions): Promise<Buffer> => {
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  
  let compositeOptions: sharp.OverlayOptions[] = [];

  if (options.type === 'text') {
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
          x="${options.position?.includes('right') ? metadata.width! - options.margin! : options.margin}"
          y="${options.position?.includes('bottom') ? metadata.height! - options.margin! : options.margin! + options.fontSize!}"
          class="watermark"
          text-anchor="${options.position?.includes('right') ? 'end' : 'start'}"
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
    const watermarkImage = sharp(options.imagePath);
    const watermarkMetadata = await watermarkImage.metadata();
    
    const scaledWidth = Math.round(metadata.width! * options.scale!);
    const scaledHeight = Math.round((scaledWidth * watermarkMetadata.height!) / watermarkMetadata.width!);
    
    const resizedWatermark = await watermarkImage
      .resize(scaledWidth, scaledHeight)
      .toBuffer();
    
    let top = 0;
    let left = 0;
    
    if (options.position?.includes('bottom')) {
      top = metadata.height! - scaledHeight - options.margin!;
    } else {
      top = options.margin!;
    }
    
    if (options.position?.includes('right')) {
      left = metadata.width! - scaledWidth - options.margin!;
    } else {
      left = options.margin!;
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

export const createPages = async ({ graphql, actions, reporter }: CreatePagesArgs) => {
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

  const options: WatermarkOptions = {
    type: 'text',
    text: 'Watermark',
    imagePath: '',
    fontSize: 32,
    fontColor: '#ffffff',
    opacity: 0.5,
    position: 'bottom-right',
    margin: 20,
    scale: 0.2,
  };

  for (const node of (result.data as any).allWatermarkedImage.nodes) {
    try {
      const watermarkedBuffer = await watermarkImage(node.originalImage.absolutePath, options);
      const outputPath = path.join(
        path.dirname(node.originalImage.absolutePath),
        `watermarked-${path.basename(node.originalImage.absolutePath)}`
      );
      
      await fs.promises.writeFile(outputPath, watermarkedBuffer);
      
      reporter.info(`Created watermarked image: ${outputPath}`);
    } catch (error) {
      reporter.error(`Error processing image ${node.originalImage.absolutePath}: ${(error as Error).message}`);
    }
  }
}; 