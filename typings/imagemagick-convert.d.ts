declare module "imagemagick-convert" {
  interface Options {
    srcData: Buffer;
    srcFormat?: string;
    width?: number;
    height?: number;
    resize?: string;
    density?: number;
    background?: string;
    gravity?: string;
    format?: string;
    quality?: number;
    blur?: number;
    rotate?: number;
    flip?: boolean;
    alpha?: string;
  }

  class Converter {
    constructor(options: Options);

    public proceed(): Promise<Buffer>;
  }

  interface ImageMagickConvert {
    Converter: Converter;
    convert: (options: Options) => Promise<Buffer>;
  }

  const imageMagickConvert: ImageMagickConvert;

  export = imageMagickConvert;
}
