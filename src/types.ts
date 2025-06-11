import { Node } from 'gatsby';

export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type WatermarkType = 'text' | 'image';

export interface WatermarkOptions {
  type: WatermarkType;
  text?: string;
  imagePath?: string;
  fontSize?: number;
  fontColor?: string;
  opacity?: number;
  position?: WatermarkPosition;
  margin?: number;
  scale?: number;
}

export interface WatermarkedImageNode extends Omit<Node, 'children'> {
  originalImage: {
    absolutePath: string;
  };
}

export interface GatsbyNode {
  id: string;
  internal: {
    type: string;
    mediaType?: string;
    contentDigest: string;
  };
  absolutePath?: string;
}

export interface CreateNodeArgs {
  node: GatsbyNode;
  actions: {
    createNode: (node: any) => void;
  };
  createNodeId: (input: string) => string;
  createContentDigest: (input: any) => string;
}

export interface CreatePagesArgs {
  graphql: (query: string) => Promise<any>;
  actions: {
    createPage: (args: any) => void;
  };
  reporter: {
    info: (message: string) => void;
    error: (message: string) => void;
    panicOnBuild: (message: string) => void;
  };
}

export interface CreateSchemaCustomizationArgs {
  actions: {
    createTypes: (types: string) => void;
  };
}

export interface CreateResolversArgs {
  createResolvers: (resolvers: any) => void;
} 