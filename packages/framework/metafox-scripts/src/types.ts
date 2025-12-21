export type EnvDictionary = Record<
  string,
  string | undefined | boolean | number
>;

export type PackageInfo = {
  /**
   * Package Name
   */
  name: string;

  /**
   * Package version
   */
  version: string;
  /**
   * Absolute path
   */
  path: string;
  /**
   * is package private
   */
  private: boolean;
  /**
   * Theme name
   */
  theme?: string;
  /**
   * Relative path from workspace root path
   */
  dir: string;
};

export type CommentInfo = {
  type: string;
  name: string;
  bundle?: string;
  chunkName?: string;
  lazy?: boolean;
  priority?: number;
  depends?: string[];
  admincp?: boolean;
  theme?: string;
  path?: string | string[];
};

export type ViewBlockInfo = {
  title: string;
  description: string;
  keywords: string;
  importName?: string;
  end?: boolean;
};

export type BundleInfo = {
  packageName: string;
  from: string;
  source: string;
  theme?: string;
} & CommentInfo &
  Partial<ViewBlockInfo>;

export type BundleStats = Record<string, number>;

export type RouteInfo = {
  component: string;
  path: string | string[] | undefined;
};
