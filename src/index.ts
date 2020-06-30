import { stripIndent } from "common-tags";
import * as fs from "fs";
import * as im from "imagemagick";
import { noop } from "lodash";
import * as path from "path";
import { withDir } from "tmp-promise";
import { v4 as uuid } from "uuid";
import yargs from "yargs";

const toDataUrl = (jpegBuffer: Buffer) => `data:image/jpeg;base64,${jpegBuffer.toString("base64")}`;
const identify = (inputPath: string) => new Promise<im.Features>((resolve, reject) => {
  im.identify(inputPath, (err, features) => {
    err ? reject(err) : resolve(features);
  });
});
const convert = (args: any[], timeout?: number) => new Promise<string>((resolve, reject) => {
  const callback = (err: Error, result: any) => {
    err ? reject(err) : resolve(result);
  };
  typeof timeout === "undefined" ? im.convert(args, callback) : im.convert(args, timeout, callback);
});

noop(yargs.command({
  command: "convert <input> [output]",
  describe: "Convert",
  builder: y => {
    return y.positional("input", {
      describe: "Input file",
      type: "string",
      demandOption: true,
    })
    .positional("output", {
      describe: "Output file",
    })
    .options({
      quality: {
        alias: "q",
        default: 80,
        type: "number",
        description: "Output JPEG quality",
      },
      "alpha-quality": {
        type: "number",
        description: "Output JPEG alpha mask quality (defaults to same as quality)",
      },
    });
  },
  handler: async (argv) => {
    const input = path.resolve(argv.input as string);
    const output = (argv.output as string | undefined) ?? (() => {
      const inputBasename = path.basename(input);
      const lastDotIndex = inputBasename.lastIndexOf(".");
      const inputFilename = lastDotIndex === -1 ? inputBasename : inputBasename.substring(0, lastDotIndex);
      return `${inputFilename}.svg`;
    })();
    const quality = argv.quality as number;
    const alphaQuality = (argv["alpha-quality"] as number | undefined) ?? quality;

    const featuresPromise = identify(input);

    await withDir(async (result) => {
      const jpegPath = path.join(result.path, `${uuid()}.jpg`);
      const pngAlphaPath = path.join(result.path, `${uuid()}.png`);
      const jpegAlphaPath = path.join(result.path, `${uuid()}.jpg`);

      const outputJpegPromise = convert([input, "-define", `quality=${quality}`, jpegPath]);

      await convert([input, "-alpha", "extract", "-colorspace", "Gray", pngAlphaPath]);
      const outputJpegAlphaPromise = convert([pngAlphaPath, "-define", `quality=${alphaQuality}`, jpegAlphaPath]);

      await Promise.all([outputJpegPromise, outputJpegAlphaPromise]);

      const [
        jpegBuffer,
        jpegAlphaBuffer,
      ] = await Promise.all([jpegPath, jpegAlphaPath].map(filePath => fs.promises.readFile(filePath)));
      const features = await featuresPromise;

      const svg = stripIndent`
        <?xml version="1.0" encoding="UTF-8"?>
        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${features.width} ${features.height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="a" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
              <image width="${features.width}" height="${features.height}" xlink:href="${toDataUrl(jpegAlphaBuffer)}" />
            </mask>
          </defs>
          <image mask="url(#a)" xlink:href="${toDataUrl(jpegBuffer)}" />
        </svg>
      `;

      await fs.promises.writeFile(output, svg);
    }, { unsafeCleanup: true });
  },
})
  .strict()
  .demandCommand()
  .help().argv);
